package com.freeline.domain.booth.service;

import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentMatchers;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import com.freeline.common.file.service.FileService;
import com.freeline.domain.booth.dto.response.BoothCsvUploadResDto;
import com.freeline.domain.booth.repository.BoothGoodsRepository;
import com.freeline.domain.booth.repository.BoothImageRepository;
import com.freeline.domain.booth.repository.BoothPolicyRepository;
import com.freeline.domain.booth.repository.BoothRepository;
import com.freeline.domain.booth.repository.BoothWaitingRepository;
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
    private EventRepository eventRepository;

    @Mock
    private FileService fileService;

    @InjectMocks
    private BoothService boothService;

    @Test
    void uploadBoothsByCsv_success() {
        final MockMultipartFile file = new MockMultipartFile(
                "file",
                "booths.csv",
                "text/csv",
                ("name,locationCode,openTime,closeTime\n"
                        + "굿즈 부스,A-01,10:00:00,18:00:00\n"
                        + "체험 부스,,11:00:00,19:00:00\n").getBytes()
        );

        Mockito.when(eventRepository.existsById(5L)).thenReturn(true);
        Mockito.when(boothRepository.saveAll(ArgumentMatchers.anyList()))
                .thenAnswer(invocation -> invocation.getArgument(0));

        final BoothCsvUploadResDto result = boothService.uploadBoothsByCsv(5L, file);

        Assertions.assertThat(result.eventId()).isEqualTo(5L);
        Assertions.assertThat(result.importedCount()).isEqualTo(2);
        Mockito.verify(boothRepository).saveAll(ArgumentMatchers.anyList());
    }

    @Test
    void uploadBoothsByCsv_failWhenOpenTimeFormatIsInvalid() {
        final MockMultipartFile file = new MockMultipartFile(
                "file",
                "booths.csv",
                "text/csv",
                ("name,locationCode,openTime,closeTime\n"
                        + "굿즈 부스,A-01,10:00,18:00:00\n").getBytes()
        );

        Mockito.when(eventRepository.existsById(5L)).thenReturn(true);

        Assertions.assertThatThrownBy(() -> boothService.uploadBoothsByCsv(5L, file))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("2번째 줄의 openTime 형식이 잘못되었습니다.");
    }
}
