package com.freeline.domain.booth.service;

import java.util.List;

import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.ArgumentMatchers;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.freeline.common.error.ErrorCode;
import com.freeline.common.error.exception.BusinessException;
import com.freeline.common.file.service.FileService;
import com.freeline.domain.auth.entity.BoothAdmin;
import com.freeline.domain.auth.repository.BoothAdminRepository;
import com.freeline.domain.booth.dto.response.BoothCsvUploadResDto;
import com.freeline.domain.booth.entity.Booth;
import com.freeline.domain.booth.repository.BoothGoodsRepository;
import com.freeline.domain.booth.repository.BoothImageRepository;
import com.freeline.domain.booth.repository.BoothPolicyRepository;
import com.freeline.domain.booth.repository.BoothRepository;
import com.freeline.domain.booth.repository.BoothWaitingRepository;
import com.freeline.domain.event.repository.EventPolicyRepository;
import com.freeline.domain.event.repository.EventRepository;

@ExtendWith(MockitoExtension.class)
class BoothCsvUploadServiceTest {

    @Mock
    private BoothRepository boothRepository;

    @Mock
    private BoothGoodsRepository boothGoodsRepository;

    @Mock
    private BoothImageRepository boothImageRepository;

    @Mock
    private BoothPolicyRepository boothPolicyRepository;

    @Mock
    private BoothWaitingRepository boothWaitingRepository;

    @Mock
    private BoothAdminRepository boothAdminRepository;

    @Mock
    private EventRepository eventRepository;

    @Mock
    private EventPolicyRepository eventPolicyRepository;

    @Mock
    private FileService fileService;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private BoothService boothService;

    @Test
    void uploadBoothsByCsv_success() {
        final MockMultipartFile file = new MockMultipartFile(
                "file",
                "booths.csv",
                "text/csv",
                ("boothName,locationCode,openTime,closeTime,adminName,adminEmail,adminCompany\n"
                        + "굿즈 부스,A-01,10:00:00,18:00:00,홍길동,admin1@example.com,Freeline\n"
                        + "체험 부스,B-02,11:00:00,19:00:00,김부스,admin2@example.com,SSAFY\n").getBytes()
        );

        Mockito.when(eventRepository.existsById(5L)).thenReturn(true);
        Mockito.when(passwordEncoder.encode(ArgumentMatchers.anyString()))
                .thenAnswer(invocation -> "ENC:" + invocation.getArgument(0, String.class));
        Mockito.when(boothRepository.saveAll(ArgumentMatchers.<Booth>anyList()))
                .thenAnswer(invocation -> {
                    final List<Booth> booths = invocation.getArgument(0);
                    return List.of(
                            Booth.builder()
                                    .id(101L)
                                    .eventId(5L)
                                    .name(booths.get(0).getName())
                                    .locationCode(booths.get(0).getLocationCode())
                                    .openTime(booths.get(0).getOpenTime())
                                    .closeTime(booths.get(0).getCloseTime())
                                    .emergencyClosed(booths.get(0).isEmergencyClosed())
                                    .build(),
                            Booth.builder()
                                    .id(102L)
                                    .eventId(5L)
                                    .name(booths.get(1).getName())
                                    .locationCode(booths.get(1).getLocationCode())
                                    .openTime(booths.get(1).getOpenTime())
                                    .closeTime(booths.get(1).getCloseTime())
                                    .emergencyClosed(booths.get(1).isEmergencyClosed())
                                    .build()
                    );
                });
        Mockito.when(boothAdminRepository.findByLoginId(ArgumentMatchers.anyString()))
                .thenReturn(java.util.Optional.empty());
        Mockito.when(boothAdminRepository.saveAll(ArgumentMatchers.anyList()))
                .thenAnswer(invocation -> {
                    final List<BoothAdmin> boothAdmins = invocation.getArgument(0);
                    return List.of(
                            BoothAdmin.builder()
                                    .id(201L)
                                    .boothId(boothAdmins.get(0).getBoothId())
                                    .loginId(boothAdmins.get(0).getLoginId())
                                    .password(boothAdmins.get(0).getPassword())
                                    .name(boothAdmins.get(0).getName())
                                    .email(boothAdmins.get(0).getEmail())
                                    .company(boothAdmins.get(0).getCompany())
                                    .build(),
                            BoothAdmin.builder()
                                    .id(202L)
                                    .boothId(boothAdmins.get(1).getBoothId())
                                    .loginId(boothAdmins.get(1).getLoginId())
                                    .password(boothAdmins.get(1).getPassword())
                                    .name(boothAdmins.get(1).getName())
                                    .email(boothAdmins.get(1).getEmail())
                                    .company(boothAdmins.get(1).getCompany())
                                    .build()
                    );
                });

        final BoothCsvUploadResDto result = boothService.uploadBoothsByCsv(5L, file);

        Assertions.assertThat(result.eventId()).isEqualTo(5L);
        Assertions.assertThat(result.importedCount()).isEqualTo(2);
        Assertions.assertThat(result.adminCreatedCount()).isEqualTo(2);
        Assertions.assertThat(result.createdAdmins()).hasSize(2);
        Assertions.assertThat(result.createdAdmins())
                .extracting(createdAdmin -> createdAdmin.adminId())
                .containsExactly(201L, 202L);
        Assertions.assertThat(result.createdAdmins())
                .extracting(createdAdmin -> createdAdmin.boothName())
                .containsExactly("굿즈 부스", "체험 부스");
        Assertions.assertThat(result.createdAdmins())
                .extracting(createdAdmin -> createdAdmin.loginId())
                .doesNotHaveDuplicates();
        Assertions.assertThat(result.createdAdmins())
                .extracting(createdAdmin -> createdAdmin.rawPassword())
                .allMatch(password -> password != null && password.length() == 8);

        final ArgumentCaptor<List> boothAdminCaptor = ArgumentCaptor.forClass(List.class);
        Mockito.verify(boothAdminRepository).saveAll(boothAdminCaptor.capture());
        @SuppressWarnings("unchecked")
        final List<BoothAdmin> savedAdmins = boothAdminCaptor.getValue();
        Assertions.assertThat(savedAdmins).hasSize(2);
        for (int index = 0; index < savedAdmins.size(); index++) {
            Assertions.assertThat(savedAdmins.get(index).getPassword())
                    .isEqualTo("ENC:" + result.createdAdmins().get(index).rawPassword());
        }

        Mockito.verify(boothRepository).saveAll(ArgumentMatchers.anyList());
    }

    @Test
    void uploadBoothsByCsv_failWhenOpenTimeFormatIsInvalid() {
        final MockMultipartFile file = new MockMultipartFile(
                "file",
                "booths.csv",
                "text/csv",
                ("boothName,locationCode,openTime,closeTime,adminName,adminEmail,adminCompany\n"
                        + "굿즈 부스,A-01,10:00,18:00:00,홍길동,admin1@example.com,Freeline\n").getBytes()
        );

        Mockito.when(eventRepository.existsById(5L)).thenReturn(true);

        Assertions.assertThatThrownBy(() -> boothService.uploadBoothsByCsv(5L, file))
                .isInstanceOf(BusinessException.class)
                .satisfies(exception -> Assertions.assertThat(((BusinessException) exception).getErrorCode())
                        .isEqualTo(ErrorCode.INVALID_CSV_FORMAT));
        Mockito.verify(boothRepository, Mockito.never()).saveAll(ArgumentMatchers.anyList());
        Mockito.verify(boothAdminRepository, Mockito.never()).saveAll(ArgumentMatchers.anyList());
    }

    @Test
    void uploadBoothsByCsv_failWhenAdminEmailIsMissing() {
        final MockMultipartFile file = new MockMultipartFile(
                "file",
                "booths.csv",
                "text/csv",
                ("boothName,locationCode,openTime,closeTime,adminName,adminEmail,adminCompany\n"
                        + "굿즈 부스,A-01,10:00:00,18:00:00,홍길동,,Freeline\n").getBytes()
        );

        Mockito.when(eventRepository.existsById(5L)).thenReturn(true);

        Assertions.assertThatThrownBy(() -> boothService.uploadBoothsByCsv(5L, file))
                .isInstanceOf(BusinessException.class)
                .satisfies(exception -> Assertions.assertThat(((BusinessException) exception).getErrorCode())
                        .isEqualTo(ErrorCode.INVALID_CSV_FORMAT));
        Mockito.verify(boothRepository, Mockito.never()).saveAll(ArgumentMatchers.anyList());
        Mockito.verify(boothAdminRepository, Mockito.never()).saveAll(ArgumentMatchers.anyList());
    }

    @Test
    void uploadBoothsByCsv_failWhenSpoofedBinaryFileIsUploaded() {
        final MockMultipartFile file = new MockMultipartFile(
                "file",
                "spoofed.csv",
                "text/csv",
                new byte[]{(byte) 0xC3, 0x28, 0x00, 0x01}
        );

        Mockito.when(eventRepository.existsById(5L)).thenReturn(true);

        Assertions.assertThatThrownBy(() -> boothService.uploadBoothsByCsv(5L, file))
                .isInstanceOf(BusinessException.class)
                .satisfies(exception -> Assertions.assertThat(((BusinessException) exception).getErrorCode())
                        .isEqualTo(ErrorCode.INVALID_CSV_FORMAT));
        Mockito.verify(boothRepository, Mockito.never()).saveAll(ArgumentMatchers.anyList());
        Mockito.verify(boothAdminRepository, Mockito.never()).saveAll(ArgumentMatchers.anyList());
    }
}
