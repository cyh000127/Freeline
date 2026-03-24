package com.freeline.domain.report.service;

import java.util.Optional;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

import com.freeline.common.error.exception.BusinessException;
import com.freeline.domain.event.entity.Event;
import com.freeline.domain.event.entity.EventStatus;
import com.freeline.domain.event.repository.EventRepository;

@ExtendWith(MockitoExtension.class)
class ReportGenerationServiceTest {

    @InjectMocks
    private ReportGenerationService reportGenerationService;

    @Mock
    private EventRepository eventRepository;
    @Mock
    private DbDumpService dbDumpService;
    @Mock
    private HiveAnalysisService hiveAnalysisService;
    @Mock
    private ReportImportService reportImportService;

    private static final Long EVENT_ID = 1L;
    private static final Long EVENT_ADMIN_ID = 100L;

    @Nested
    @DisplayName("리포트 생성 요청")
    class RequestGeneration {

        @Test
        @DisplayName("성공 - CLOSED 상태 행사")
        void success() {
            Event event = Mockito.mock(Event.class);
            Mockito.when(event.getEventAdminId()).thenReturn(EVENT_ADMIN_ID);
            Mockito.when(event.getStatus()).thenReturn(EventStatus.CLOSED);
            Mockito.when(eventRepository.findById(EVENT_ID)).thenReturn(Optional.of(event));

            reportGenerationService.requestGeneration(EVENT_ADMIN_ID, EVENT_ID);

            org.assertj.core.api.Assertions.assertThat(reportGenerationService.getStatus(EVENT_ID))
                    .isNotNull();
        }

        @Test
        @DisplayName("실패 - 행사 없음")
        void eventNotFound() {
            Mockito.when(eventRepository.findById(EVENT_ID)).thenReturn(Optional.empty());

            org.junit.jupiter.api.Assertions.assertThrows(BusinessException.class,
                    () -> reportGenerationService.requestGeneration(EVENT_ADMIN_ID, EVENT_ID));
        }

        @Test
        @DisplayName("실패 - 권한 없음")
        void accessDenied() {
            Event event = Mockito.mock(Event.class);
            Mockito.when(event.getEventAdminId()).thenReturn(999L);
            Mockito.when(eventRepository.findById(EVENT_ID)).thenReturn(Optional.of(event));

            org.junit.jupiter.api.Assertions.assertThrows(BusinessException.class,
                    () -> reportGenerationService.requestGeneration(EVENT_ADMIN_ID, EVENT_ID));
        }

        @Test
        @DisplayName("실패 - CLOSED 상태가 아닌 행사")
        void eventNotClosed() {
            Event event = Mockito.mock(Event.class);
            Mockito.when(event.getEventAdminId()).thenReturn(EVENT_ADMIN_ID);
            Mockito.when(event.getStatus()).thenReturn(EventStatus.OPEN);
            Mockito.when(eventRepository.findById(EVENT_ID)).thenReturn(Optional.of(event));

            org.junit.jupiter.api.Assertions.assertThrows(BusinessException.class,
                    () -> reportGenerationService.requestGeneration(EVENT_ADMIN_ID, EVENT_ID));
        }

        @Test
        @DisplayName("실패 - 이미 생성 중 (DUMPING 상태에서 재요청)")
        void alreadyGenerating() {
            Event event = Mockito.mock(Event.class);
            Mockito.when(event.getEventAdminId()).thenReturn(EVENT_ADMIN_ID);
            Mockito.when(event.getStatus()).thenReturn(EventStatus.CLOSED);
            Mockito.when(eventRepository.findById(EVENT_ID)).thenReturn(Optional.of(event));

            Mockito.doAnswer(invocation -> {
                throw new RuntimeException("block to keep DUMPING state");
            }).when(dbDumpService).dumpEventData(EVENT_ID);

            reportGenerationService.requestGeneration(EVENT_ADMIN_ID, EVENT_ID);

            org.assertj.core.api.Assertions.assertThat(reportGenerationService.getStatus(EVENT_ID))
                    .isEqualTo(ReportStatus.FAILED);
        }
    }

    @Nested
    @DisplayName("비동기 실행")
    class ExecuteAsync {

        @Test
        @DisplayName("성공 시 COMPLETED 상태")
        void successCompleted() {
            reportGenerationService.executeAsync(EVENT_ID);

            org.assertj.core.api.Assertions.assertThat(reportGenerationService.getStatus(EVENT_ID))
                    .isEqualTo(ReportStatus.COMPLETED);
            Mockito.verify(dbDumpService).dumpEventData(EVENT_ID);
            Mockito.verify(hiveAnalysisService).runAnalysis(EVENT_ID);
            Mockito.verify(reportImportService).importEventReport(EVENT_ID);
        }

        @Test
        @DisplayName("실패 시 FAILED 상태")
        void failedStatus() {
            Mockito.doThrow(new RuntimeException("dump error"))
                    .when(dbDumpService).dumpEventData(EVENT_ID);

            reportGenerationService.executeAsync(EVENT_ID);

            org.assertj.core.api.Assertions.assertThat(reportGenerationService.getStatus(EVENT_ID))
                    .isEqualTo(ReportStatus.FAILED);
        }
    }

    @Nested
    @DisplayName("상태 조회")
    class GetStatus {

        @Test
        @DisplayName("생성 요청 전이면 null")
        void notStarted() {
            org.assertj.core.api.Assertions.assertThat(
                    reportGenerationService.getStatus(999L)).isNull();
        }
    }
}
