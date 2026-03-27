package com.freeline.domain.booth.service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.CharsetDecoder;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import com.freeline.common.error.ErrorCode;
import com.freeline.common.error.exception.BusinessException;
import com.freeline.common.file.dto.FileInfo;
import com.freeline.common.file.service.FileService;
import com.freeline.domain.auth.entity.BoothAdmin;
import com.freeline.domain.auth.repository.BoothAdminRepository;
import com.freeline.domain.booth.converter.BoothConverter;
import com.freeline.domain.booth.dto.request.BoothCreateReqDto;
import com.freeline.domain.booth.dto.request.BoothPolicyUpdateReqDto;
import com.freeline.domain.booth.dto.request.BoothStatusUpdateReqDto;
import com.freeline.domain.booth.dto.request.BoothUpdateReqDto;
import com.freeline.domain.booth.dto.response.BoothCalledUserResDto;
import com.freeline.domain.booth.dto.response.BoothCreateResDto;
import com.freeline.domain.booth.dto.response.BoothCsvUploadResDto;
import com.freeline.domain.booth.dto.response.CreatedBoothAdminCredentialResDto;
import com.freeline.domain.booth.dto.response.BoothGoodsResDto;
import com.freeline.domain.booth.dto.response.BoothImageUploadResDto;
import com.freeline.domain.booth.dto.response.BoothListResDto;
import com.freeline.domain.booth.dto.response.BoothPolicyResDto;
import com.freeline.domain.booth.dto.response.BoothQueueEntryResDto;
import com.freeline.domain.booth.dto.response.BoothQueueResDto;
import com.freeline.domain.booth.dto.response.BoothResDto;
import com.freeline.domain.booth.dto.response.BoothSearchResDto;
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
import com.freeline.domain.event.entity.EventPolicy;
import com.freeline.domain.event.exception.EventException;
import com.freeline.domain.event.repository.EventPolicyRepository;
import com.freeline.domain.event.repository.EventRepository;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class BoothService {

    private static final int DEFAULT_CALL_COUNT = 1;
    private static final int DEFAULT_CALL_VALID_SECONDS = 180;

    private static final String BOOTH_DIRECTORY = "booth";
    private static final DateTimeFormatter CSV_TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm:ss");
    private static final int CSV_COLUMN_COUNT = 7;
    private static final String[] CSV_HEADER_COLUMNS = {
            "boothName",
            "locationCode",
            "openTime",
            "closeTime",
            "adminName",
            "adminEmail",
            "adminCompany"
    };
    private static final int RANDOM_PASSWORD_LENGTH = 8;
    private static final String PASSWORD_ALPHABET = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    private static final String PASSWORD_DIGITS = "0123456789";
    private static final String PASSWORD_ALLOW_BASE = PASSWORD_ALPHABET + PASSWORD_DIGITS;
    private static final SecureRandom RANDOM = new SecureRandom();

    private static final List<WaitingStatus> FRONT_QUEUE_STATUSES = List.of(
            WaitingStatus.CALLED,
            WaitingStatus.REGISTERED
    );

    private final BoothRepository boothRepository;
    private final BoothGoodsRepository boothGoodsRepository;
    private final BoothImageRepository boothImageRepository;
    private final BoothPolicyRepository boothPolicyRepository;
    private final BoothWaitingRepository boothWaitingRepository;
    private final BoothAdminRepository boothAdminRepository;
    private final EventRepository eventRepository;
    private final EventPolicyRepository eventPolicyRepository;
    private final FileService fileService;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public List<BoothSearchResDto> searchBooths(final Long eventId, final String keyword) {
        validateEventExists(eventId);

        return boothRepository.searchBoothsByKeyword(eventId, keyword)
                .stream()
                .map(row -> BoothSearchResDto.builder()
                        .boothId((Long) row[0])
                        .boothName((String) row[1])
                        .adminName((String) row[2])
                        .company((String) row[3])
                        .build())
                .toList();
    }

// TODO: 부스 정책 조회/설정 기능이 생기면 메서드를 분리하여 BoothPolicyRepository를 직접 사용하는 새 API로 이전합니다.

    public BoothCreateResDto createBooth(final Long eventId, final BoothCreateReqDto request) {
        validateEventExists(eventId);
        validateOperatingHours(request.openTime(), request.closeTime());
        validateDuplicateBoothName(eventId, request.name());

        final Booth booth = BoothConverter.toEntity(eventId, request);
        final Booth saved = boothRepository.save(booth);

        log.info("[Booth] 생성 완료 {id: {}, eventId: {}}", saved.getId(), saved.getEventId());

        return BoothConverter.toBoothCreateResDto(saved);
    }

    @Transactional(rollbackFor = Exception.class)
    public BoothCsvUploadResDto uploadBoothsByCsv(final Long eventId, final MultipartFile file) {
        validateEventExists(eventId);

        if (file.isEmpty()) {
            throw new BusinessException(ErrorCode.FILE_EMPTY);
        }

        final List<ParsedBoothCsvRow> parsedRows = parseBoothsFromCsv(file);
        validateDuplicateBoothNamesForCsv(eventId, parsedRows);
        final List<Booth> booths = parsedRows.stream()
                .map(row -> Booth.builder()
                        .eventId(eventId)
                        .name(row.boothName())
                        .locationCode(row.locationCode())
                        .openTime(row.openTime())
                        .closeTime(row.closeTime())
                        .emergencyClosed(false)
                        .build())
                .toList();
        final List<Booth> savedBooths = boothRepository.saveAll(booths);
        final List<CreatedBoothAdminDraft> createdAdminDrafts = createBoothAdmins(eventId, parsedRows, savedBooths);
        final List<BoothAdmin> boothAdmins = boothAdminRepository.saveAll(createdAdminDrafts.stream()
                .map(CreatedBoothAdminDraft::boothAdmin)
                .toList());
        final List<CreatedBoothAdminCredentialResDto> createdAdmins = new ArrayList<>();

        for (int index = 0; index < boothAdmins.size(); index++) {
            final BoothAdmin boothAdmin = boothAdmins.get(index);
            final CreatedBoothAdminDraft draft = createdAdminDrafts.get(index);

            createdAdmins.add(CreatedBoothAdminCredentialResDto.builder()
                    .adminId(boothAdmin.getId())
                    .boothId(boothAdmin.getBoothId())
                    .boothName(draft.boothName())
                    .loginId(boothAdmin.getLoginId())
                    .rawPassword(draft.rawPassword())
                    .email(boothAdmin.getEmail())
                    .name(boothAdmin.getName())
                    .company(boothAdmin.getCompany())
                    .build());
        }

        log.info("[Booth] CSV bulk upload completed {eventId: {}, boothCount: {}, boothAdminCount: {}}",
                eventId, savedBooths.size(), boothAdmins.size());

        return BoothCsvUploadResDto.builder()
                .eventId(eventId)
                .importedCount(savedBooths.size())
                .adminCreatedCount(boothAdmins.size())
                .createdAdmins(createdAdmins)
                .build();
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
        final Optional<EventPolicy> eventPolicy = resolveEventPolicy(booth);
        final List<BoothImage> boothImages = boothImageRepository.findAllByBoothIdOrderByIdAsc(boothId);
        final List<BoothGoodsResDto> goods = boothGoodsRepository.findAllByBoothIdOrderByIdAsc(boothId)
                .stream()
                .map(BoothConverter::toBoothGoodsResDto)
                .toList();
        final String representativeImageUrl = boothImages.stream()
                .filter(BoothImage::isRepresentative)
                .map(BoothImage::getImagePath)
                .findFirst()
                .orElse(null);
        final List<String> boothImageUrls = boothImages.stream()
                .map(BoothImage::getImagePath)
                .toList();

        return BoothConverter.toBoothResDto(
                booth,
                waitingCount,
                resolveCallCount(boothPolicy, eventPolicy),
                resolveCallValidSeconds(boothPolicy, eventPolicy),
                representativeImageUrl,
                boothImageUrls,
                goods
        );
    }

    @Transactional(readOnly = true)
    public BoothQueueResDto getBoothQueue(final Long boothId) {
        final Booth booth = getBoothEntity(boothId);

        final long backQueueCount = boothWaitingRepository.countByBoothIdAndStatus(boothId, WaitingStatus.WAITING);
        final long frontQueueCount = boothWaitingRepository.countByBoothIdAndStatusIn(boothId, FRONT_QUEUE_STATUSES);
        final int frontQueueLimit = resolveCallCount(
                boothPolicyRepository.findByBoothId(boothId),
                resolveEventPolicy(booth)
        );

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

    @Transactional(readOnly = true)
    public BoothPolicyResDto getBoothPolicy(final Long boothId) {
        final Booth booth = getBoothEntity(boothId);

        return boothPolicyRepository.findByBoothId(boothId)
                .map(boothPolicy -> BoothConverter.toBoothPolicyResDto(boothId, boothPolicy))
                .orElseGet(() -> eventPolicyRepository.findByEvent_Id(booth.getEventId())
                        .map(eventPolicy -> BoothConverter.toBoothPolicyResDto(boothId, eventPolicy))
                        .orElseThrow(() -> new BoothException(ErrorCode.NOT_FOUND)));
    }

    public BoothPolicyResDto upsertBoothPolicy(final Long boothId, final BoothPolicyUpdateReqDto request) {
        getBoothEntity(boothId);

        final BoothPolicy saved = boothPolicyRepository.findByBoothId(boothId)
                .map(existingPolicy -> {
                    existingPolicy.updatePolicy(
                            request.staySeconds(),
                            request.maxWaitingCount(),
                            request.callCount(),
                            request.callValidSeconds(),
                            request.deferLimit()
                    );
                    return existingPolicy;
                })
                .orElseGet(() -> boothPolicyRepository.save(
                        BoothConverter.toBoothPolicyEntity(boothId, request)
                ));

        log.info("[Booth] policy upsert completed {boothId: {}}", boothId);

        return BoothConverter.toBoothPolicyResDto(boothId, saved);
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
        validateDuplicateBoothNameOnUpdate(booth.getEventId(), booth.getId(), request.name());

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

    private Optional<EventPolicy> resolveEventPolicy(final Booth booth) {
        return eventPolicyRepository.findByEvent_Id(booth.getEventId());
    }

    private int resolveCallCount(
            final Optional<BoothPolicy> boothPolicy,
            final Optional<EventPolicy> eventPolicy
    ) {
        return boothPolicy.map(BoothPolicy::getCallCount)
                .filter(count -> count > 0)
                .or(() -> eventPolicy.map(EventPolicy::getDefaultCallCount)
                        .filter(count -> count > 0))
                .orElse(DEFAULT_CALL_COUNT);
    }

    private int resolveCallValidSeconds(
            final Optional<BoothPolicy> boothPolicy,
            final Optional<EventPolicy> eventPolicy
    ) {
        return boothPolicy.map(BoothPolicy::getCallValidTime)
                .filter(seconds -> seconds > 0)
                .or(() -> eventPolicy.map(EventPolicy::getDefaultCallTtl)
                        .filter(seconds -> seconds > 0))
                .orElse(DEFAULT_CALL_VALID_SECONDS);
    }

    private void validateOperatingHours(final LocalTime openTime, final LocalTime closeTime) {
        if (!closeTime.isAfter(openTime)) {
            throw new BoothException(ErrorCode.INVALID_BOOTH_OPERATING_HOURS);
        }
    }

    private void validateDuplicateBoothName(final Long eventId, final String boothName) {
        final String normalizedName = normalizeBoothName(boothName);
        if (boothRepository.existsByEventIdAndNormalizedName(eventId, normalizedName)) {
            throw new BoothException(ErrorCode.BOOTH_NAME_DUPLICATE);
        }
    }

    private void validateDuplicateBoothNameOnUpdate(final Long eventId, final Long boothId, final String boothName) {
        final String normalizedName = normalizeBoothName(boothName);
        if (boothRepository.existsByEventIdAndNormalizedNameAndIdNot(eventId, boothId, normalizedName)) {
            throw new BoothException(ErrorCode.BOOTH_NAME_DUPLICATE);
        }
    }

    private void validateDuplicateBoothNamesForCsv(final Long eventId, final List<ParsedBoothCsvRow> parsedRows) {
        final Set<String> normalizedNames = new LinkedHashSet<>();

        for (ParsedBoothCsvRow row : parsedRows) {
            final String normalizedName = normalizeBoothName(row.boothName());
            if (!normalizedNames.add(normalizedName)) {
                throw new BoothException(ErrorCode.BOOTH_NAME_DUPLICATE);
            }
        }

        if (normalizedNames.isEmpty()) {
            return;
        }

        final List<String> duplicatedNames =
                boothRepository.findDuplicatedNormalizedNames(eventId, new ArrayList<>(normalizedNames));
        if (!duplicatedNames.isEmpty()) {
            throw new BoothException(ErrorCode.BOOTH_NAME_DUPLICATE);
        }
    }

    private String normalizeBoothName(final String boothName) {
        return boothName.trim().toLowerCase(Locale.ROOT);
    }

    private List<ParsedBoothCsvRow> parseBoothsFromCsv(final MultipartFile file) {
        final List<ParsedBoothCsvRow> rows = new ArrayList<>();
        final CharsetDecoder decoder = StandardCharsets.UTF_8.newDecoder()
                .onMalformedInput(CodingErrorAction.REPORT)
                .onUnmappableCharacter(CodingErrorAction.REPORT);

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(file.getInputStream(), decoder))) {
            String line = reader.readLine();
            int lineNumber = 1;

            validateCsvHeader(line);

            while ((line = reader.readLine()) != null) {
                lineNumber++;

                if (line.isBlank()) {
                    continue;
                }

                rows.add(parseBoothRow(line, lineNumber));
            }
        } catch (BusinessException ex) {
            throw ex;
        } catch (IOException | RuntimeException ex) {
            throw new BusinessException(ErrorCode.INVALID_CSV_FORMAT);
        }

        return rows;
    }

    private void validateCsvHeader(final String headerLine) {
        if (headerLine == null) {
            throw new BusinessException(ErrorCode.INVALID_CSV_FORMAT);
        }

        final String[] headers = headerLine.split(",", -1);
        if (headers.length != CSV_COLUMN_COUNT) {
            throw new BusinessException(ErrorCode.INVALID_CSV_FORMAT);
        }

        for (int index = 0; index < CSV_COLUMN_COUNT; index++) {
            if (!CSV_HEADER_COLUMNS[index].equals(headers[index].trim())) {
                throw new BusinessException(ErrorCode.INVALID_CSV_FORMAT);
            }
        }
    }

    private ParsedBoothCsvRow parseBoothRow(final String line, final int lineNumber) {
        final String[] columns = line.split(",", -1);
        if (columns.length != CSV_COLUMN_COUNT) {
            throw new IllegalArgumentException("CSV 파싱 오류: " + lineNumber + "번째 줄은 7개 컬럼이어야 합니다.");
        }

        final String boothName = getColumn(columns, 0);
        final String locationCode = getColumn(columns, 1);
        final LocalTime openTime = parseCsvTime(getColumn(columns, 2), "openTime", lineNumber);
        final LocalTime closeTime = parseCsvTime(getColumn(columns, 3), "closeTime", lineNumber);
        final String adminName = getColumn(columns, 4);
        final String adminEmail = getColumn(columns, 5);
        final String adminCompany = getColumn(columns, 6);

        if (boothName == null) {
            throw new IllegalArgumentException("CSV 파싱 오류: " + lineNumber + "번째 줄의 boothName 값이 비어 있습니다.");
        }

        if (adminEmail == null) {
            throw new IllegalArgumentException("CSV 파싱 오류: " + lineNumber + "번째 줄의 adminEmail 값이 비어 있습니다.");
        }

        if (openTime != null && closeTime != null && !closeTime.isAfter(openTime)) {
            throw new IllegalArgumentException("CSV 파싱 오류: " + lineNumber + "번째 줄의 운영 시간이 올바르지 않습니다.");
        }

        return new ParsedBoothCsvRow(
                boothName,
                locationCode,
                openTime,
                closeTime,
                adminName,
                adminEmail,
                adminCompany
        );
    }

    private List<CreatedBoothAdminDraft> createBoothAdmins(
            final Long eventId,
            final List<ParsedBoothCsvRow> parsedRows,
            final List<Booth> savedBooths
    ) {
        final List<CreatedBoothAdminDraft> boothAdmins = new ArrayList<>();

        for (int i = 0; i < parsedRows.size(); i++) {
            final ParsedBoothCsvRow row = parsedRows.get(i);
            final Booth booth = savedBooths.get(i);
            final String rawPassword = generateRandomPassword();

            boothAdmins.add(new CreatedBoothAdminDraft(
                    BoothAdmin.builder()
                            .boothId(booth.getId())
                            .loginId(generateLoginId(eventId))
                            .password(passwordEncoder.encode(rawPassword))
                            .name(row.adminName())
                            .email(row.adminEmail())
                            .company(row.adminCompany())
                            .build(),
                    rawPassword,
                    booth.getName()
            ));
        }

        return boothAdmins;
    }

    private String getColumn(final String[] columns, final int index) {
        if (index >= columns.length) {
            return null;
        }

        final String value = columns[index].trim();
        return value.isEmpty() ? null : value;
    }

    private String generateLoginId(final Long eventId) {
        String loginId;

        do {
            loginId = "event" + eventId + "_" + UUID.randomUUID().toString().substring(0, 8);
        } while (boothAdminRepository.findByLoginId(loginId).isPresent());

        return loginId;
    }

    private String generateRandomPassword() {
        final List<Character> passwordCharacters = new ArrayList<>();
        passwordCharacters.add(PASSWORD_ALPHABET.charAt(RANDOM.nextInt(PASSWORD_ALPHABET.length())));
        passwordCharacters.add(PASSWORD_DIGITS.charAt(RANDOM.nextInt(PASSWORD_DIGITS.length())));

        while (passwordCharacters.size() < RANDOM_PASSWORD_LENGTH) {
            passwordCharacters.add(PASSWORD_ALLOW_BASE.charAt(RANDOM.nextInt(PASSWORD_ALLOW_BASE.length())));
        }

        for (int i = passwordCharacters.size() - 1; i > 0; i--) {
            final int swapIndex = RANDOM.nextInt(i + 1);
            final char current = passwordCharacters.get(i);
            passwordCharacters.set(i, passwordCharacters.get(swapIndex));
            passwordCharacters.set(swapIndex, current);
        }

        final StringBuilder password = new StringBuilder(RANDOM_PASSWORD_LENGTH);
        for (char character : passwordCharacters) {
            password.append(character);
        }

        return password.toString();
    }

    private LocalTime parseCsvTime(final String value, final String fieldName, final int lineNumber) {
        if (value == null) {
            return null;
        }

        try {
            return LocalTime.parse(value, CSV_TIME_FORMATTER);
        } catch (DateTimeParseException ex) {
            throw new IllegalArgumentException(
                    "CSV 파싱 오류: " + lineNumber + "번째 줄의 " + fieldName + " 형식이 올바르지 않습니다.",
                    ex
            );
        }
    }

    private record ParsedBoothCsvRow(
            String boothName,
            String locationCode,
            LocalTime openTime,
            LocalTime closeTime,
            String adminName,
            String adminEmail,
            String adminCompany
    ) {
    }

    private record CreatedBoothAdminDraft(
            BoothAdmin boothAdmin,
            String rawPassword,
            String boothName
    ) {
    }
}
