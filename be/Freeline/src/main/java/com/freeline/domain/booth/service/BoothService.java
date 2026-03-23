package com.freeline.domain.booth.service;

import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import com.freeline.common.error.ErrorCode;
import com.freeline.common.file.dto.FileInfo;
import com.freeline.common.file.service.FileService;
import com.freeline.domain.booth.converter.BoothConverter;
import com.freeline.domain.booth.dto.request.BoothCreateReqDto;
import com.freeline.domain.booth.dto.request.BoothStatusUpdateReqDto;
import com.freeline.domain.booth.dto.request.BoothUpdateReqDto;
import com.freeline.domain.booth.dto.response.BoothCalledUserResDto;
import com.freeline.domain.booth.dto.response.BoothCreateResDto;
import com.freeline.domain.booth.dto.response.BoothGoodsResDto;
import com.freeline.domain.booth.dto.response.BoothImageUploadResDto;
import com.freeline.domain.booth.dto.response.BoothListResDto;
import com.freeline.domain.booth.dto.response.BoothQueueEntryResDto;
import com.freeline.domain.booth.dto.response.BoothQueueResDto;
import com.freeline.domain.booth.dto.response.BoothResDto;
import com.freeline.domain.booth.dto.response.BoothStatusResDto;
import com.freeline.domain.booth.entity.Booth;
import com.freeline.domain.booth.entity.BoothImage;
import com.freeline.domain.booth.entity.BoothPolicy;
import com.freeline.domain.booth.entity.WaitingStatus;
import com.freeline.domain.booth.exception.BoothException;
import com.freeline.domain.booth.repository.BoothGoodsRepository;
import com.freeline.domain.booth.repository.BoothImageRepository;
import com.freeline.domain.booth.repository.BoothPolicyRepository;
import com.freeline.domain.booth.repository.BoothRepository;
import com.freeline.domain.booth.repository.BoothWaitingRepository;
import com.freeline.domain.event.exception.EventException;
import com.freeline.domain.event.repository.EventRepository;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class BoothService {

    private static final String BOOTH_DIRECTORY = "booth";

    private static final List<WaitingStatus> FRONT_QUEUE_STATUSES = List.of(
            WaitingStatus.CALLED,
            WaitingStatus.REGISTERED
    );

    private static final List<WaitingStatus> CALL_BLOCKING_STATUSES = List.of(
            WaitingStatus.CALLED,
            WaitingStatus.REGISTERED,
            WaitingStatus.ENTERED
    );

    private final BoothRepository boothRepository;
    private final BoothGoodsRepository boothGoodsRepository;
    private final BoothImageRepository boothImageRepository;
    private final BoothPolicyRepository boothPolicyRepository;
    private final BoothWaitingRepository boothWaitingRepository;
    private final EventRepository eventRepository;
    private final FileService fileService;

    // TODO: 부스 정책 조회/설정 전용 서비스 메서드를 분리하고 BoothPolicyRepository를 직접 사용하는 흐름을 API로 노출한다.

    public BoothCreateResDto createBooth(final Long eventId, final BoothCreateReqDto request) {
        validateEventExists(eventId);
        validateOperatingHours(request.openTime(), request.closeTime());

        final Booth booth = BoothConverter.toEntity(eventId, request);
        final Booth saved = boothRepository.save(booth);

        log.info("[Booth] 생성 완료 {id: {}, eventId: {}}", saved.getId(), saved.getEventId());

        return BoothConverter.toBoothCreateResDto(saved);
    }

    @Transactional(readOnly = true)
    public List<BoothListResDto> getBooths(final Long eventId) {
        validateEventExists(eventId);

        return boothRepository.findAllByEventIdOrderByIdAsc(eventId)
                .stream()
                .map(BoothConverter::toBoothListResDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public BoothResDto getBooth(final Long boothId) {
        final Booth booth = getBoothEntity(boothId);
        final long waitingCount = boothWaitingRepository.countByBoothIdAndStatus(boothId, WaitingStatus.WAITING);
        final Optional<BoothPolicy> boothPolicy = boothPolicyRepository.findByBoothId(boothId);
        final List<BoothGoodsResDto> goods = boothGoodsRepository.findAllByBoothIdOrderByIdAsc(boothId)
                .stream()
                .map(BoothConverter::toBoothGoodsResDto)
                .toList();

        return BoothConverter.toBoothResDto(
                booth,
                waitingCount,
                boothPolicy.map(BoothPolicy::getCallCount).orElse(0),
                boothPolicy.map(BoothPolicy::getCallValidTime).orElse(0),
                goods
        );
    }

    @Transactional(readOnly = true)
    public BoothQueueResDto getBoothQueue(final Long boothId) {
        getBoothEntity(boothId);

        final long backQueueCount = boothWaitingRepository.countByBoothIdAndStatus(boothId, WaitingStatus.WAITING);
        final long frontQueueCount = boothWaitingRepository.countByBoothIdAndStatusIn(boothId, FRONT_QUEUE_STATUSES);
        final int frontQueueLimit = boothPolicyRepository.findByBoothId(boothId)
                .map(BoothPolicy::getCallCount)
                .filter(count -> count > 0)
                .orElse(5);

        final List<BoothQueueEntryResDto> frontQueue = boothWaitingRepository
                .findAllByBoothIdAndStatusInOrderByWaitingNumberAsc(boothId, FRONT_QUEUE_STATUSES)
                .stream()
                .limit(frontQueueLimit)
                .map(BoothConverter::toBoothQueueEntryResDto)
                .toList();

        final BoothCalledUserResDto currentCalledUser = boothWaitingRepository
                .findFirstByBoothIdAndStatusOrderByCalledAtDesc(boothId, WaitingStatus.CALLED)
                .map(BoothConverter::toBoothCalledUserResDto)
                .orElse(null);

        return BoothQueueResDto.builder()
                .boothId(boothId)
                .backQueueCount(backQueueCount)
                .frontQueueCount(frontQueueCount)
                .frontQueue(frontQueue)
                .currentCalledUser(currentCalledUser)
                .build();
    }

    public BoothStatusResDto updateBoothStatus(final Long boothId, final BoothStatusUpdateReqDto request) {
        final Booth booth = getBoothEntity(boothId);
        booth.updateEmergencyClosed(request.isEmergencyClosed());

        log.info("[Booth] 운영 상태 변경 완료 {id: {}, emergencyClosed: {}}", booth.getId(), booth.isEmergencyClosed());

        return BoothConverter.toBoothStatusResDto(booth);
    }

    public BoothImageUploadResDto uploadBoothImage(
            final Long boothId,
            final MultipartFile file,
            final boolean representative
    ) {
        getBoothEntity(boothId);

        final FileInfo uploadedFile = fileService.uploadFile(file, BOOTH_DIRECTORY);
        final BoothImage boothImage = BoothImage.builder()
                .boothId(boothId)
                .imagePath(uploadedFile.fileUrl())
                .representative(representative)
                .build();
        final BoothImage saved = boothImageRepository.save(boothImage);

        if (representative) {
            boothImageRepository.findAllByBoothIdOrderByIdAsc(boothId).stream()
                    .filter(image -> !image.getId().equals(saved.getId()) && image.isRepresentative())
                    .forEach(image -> image.updateRepresentative(false));
        }

        log.info("[Booth] image upload completed {boothImageId: {}, boothId: {}, representative: {}}",
                saved.getId(), boothId, saved.isRepresentative());

        return BoothConverter.toBoothImageUploadResDto(saved);
    }

    public BoothCreateResDto updateBooth(final Long boothId, final BoothUpdateReqDto request) {
        final Booth booth = getBoothEntity(boothId);
        validateOperatingHours(request.openTime(), request.closeTime());

        booth.updateInfo(request.name(), request.locationCode(), request.openTime(), request.closeTime());

        log.info("[Booth] 정보 수정 완료 {id: {}, locationCode: {}}", booth.getId(), booth.getLocationCode());

        return BoothConverter.toBoothCreateResDto(booth);
    }

    public void deleteBooth(final Long boothId) {
        final Booth booth = getBoothEntity(boothId);
        boothRepository.delete(booth);

        log.info("[Booth] 삭제 완료 {id: {}, eventId: {}}", booth.getId(), booth.getEventId());
    }

    private Booth getBoothEntity(final Long boothId) {
        return boothRepository.findById(boothId)
                .orElseThrow(() -> new BoothException(ErrorCode.BOOTH_NOT_FOUND));
    }

    private void validateEventExists(final Long eventId) {
        if (!eventRepository.existsById(eventId)) {
            throw new EventException(ErrorCode.EVENT_NOT_FOUND);
        }
    }

    private void validateOperatingHours(final LocalTime openTime, final LocalTime closeTime) {
        if (!closeTime.isAfter(openTime)) {
            throw new BoothException(ErrorCode.INVALID_BOOTH_OPERATING_HOURS);
        }
    }
}
