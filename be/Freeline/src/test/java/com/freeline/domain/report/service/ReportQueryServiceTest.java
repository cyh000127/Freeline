package com.freeline.domain.report.service;

import java.util.List;
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
import com.freeline.domain.event.repository.EventRepository;
import com.freeline.domain.report.dto.response.ReportResponseDto;
import com.freeline.domain.report.entity.BoothPerformanceResult;
import com.freeline.domain.report.entity.EventSummaryResult;
import com.freeline.domain.report.entity.HourlyTrafficResult;
import com.freeline.domain.report.entity.ProblemSpotResult;
import com.freeline.domain.report.entity.VisitorPathResult;
import com.freeline.domain.report.repository.BoothPerformanceResultRepository;
import com.freeline.domain.report.repository.EventSummaryResultRepository;
import com.freeline.domain.report.repository.HourlyTrafficResultRepository;
import com.freeline.domain.report.repository.ProblemSpotResultRepository;
import com.freeline.domain.report.repository.VisitorPathResultRepository;

@ExtendWith(MockitoExtension.class)
class ReportQueryServiceTest {

    @InjectMocks
    private ReportQueryService reportQueryService;

    @Mock
    private EventRepository eventRepository;
    @Mock
    private EventSummaryResultRepository eventSummaryResultRepository;
    @Mock
    private BoothPerformanceResultRepository boothPerformanceResultRepository;
    @Mock
    private HourlyTrafficResultRepository hourlyTrafficResultRepository;
    @Mock
    private VisitorPathResultRepository visitorPathResultRepository;
    @Mock
    private ProblemSpotResultRepository problemSpotResultRepository;

    private static final Long EVENT_ID = 1L;
    private static final Long EVENT_ADMIN_ID = 100L;

    private Event mockEvent() {
        Event event = Mockito.mock(Event.class);
        Mockito.when(event.getEventAdminId()).thenReturn(EVENT_ADMIN_ID);
        Mockito.when(eventRepository.findById(EVENT_ID)).thenReturn(Optional.of(event));
        return event;
    }

    @Nested
    @DisplayName("전체 리포트 조회")
    class GetEventReport {

        @Test
        @DisplayName("성공 - 요약 포함 전체 데이터 반환")
        void success() {
            mockEvent();

            EventSummaryResult summary = EventSummaryResult.builder()
                    .eventId(EVENT_ID)
                    .totalVisitors(500L)
                    .totalRegistrations(200L)
                    .avgWaitingSeconds(120.5)
                    .overallDropoutRate(0.15)
                    .peakHour("2026-03-20T14")
                    .build();

            BoothPerformanceResult performance = BoothPerformanceResult.builder()
                    .boothId(10L).boothName("Test Booth").viewCount(100L)
                    .registerCount(50L).dropoutCount(5L)
                    .conversionRate(0.5).dropoutRate(0.1).build();

            Mockito.when(eventSummaryResultRepository.findByEventId(EVENT_ID))
                    .thenReturn(Optional.of(summary));
            Mockito.when(boothPerformanceResultRepository.findAllByEventId(EVENT_ID))
                    .thenReturn(List.of(performance));
            Mockito.when(hourlyTrafficResultRepository.findAllByEventId(EVENT_ID))
                    .thenReturn(List.of());
            Mockito.when(visitorPathResultRepository.findAllByEventId(EVENT_ID))
                    .thenReturn(List.of());
            Mockito.when(problemSpotResultRepository.findAllByEventId(EVENT_ID))
                    .thenReturn(List.of());

            ReportResponseDto result = reportQueryService.getEventReport(EVENT_ADMIN_ID, EVENT_ID);

            org.assertj.core.api.Assertions.assertThat(result.getSummary().getTotalVisitors()).isEqualTo(500L);
            org.assertj.core.api.Assertions.assertThat(result.getSummary().getPeakHour()).isEqualTo("2026-03-20T14");
            org.assertj.core.api.Assertions.assertThat(result.getBoothPerformances()).hasSize(1);
            org.assertj.core.api.Assertions.assertThat(result.getBoothPerformances().get(0).getBoothName())
                    .isEqualTo("Test Booth");
            org.assertj.core.api.Assertions.assertThat(result.getHourlyTraffics()).isEmpty();
        }

        @Test
        @DisplayName("실패 - 리포트 데이터 없음")
        void reportNotFound() {
            mockEvent();
            Mockito.when(eventSummaryResultRepository.findByEventId(EVENT_ID))
                    .thenReturn(Optional.empty());

            org.junit.jupiter.api.Assertions.assertThrows(BusinessException.class,
                    () -> reportQueryService.getEventReport(EVENT_ADMIN_ID, EVENT_ID));
        }

        @Test
        @DisplayName("실패 - 행사 없음")
        void eventNotFound() {
            Mockito.when(eventRepository.findById(EVENT_ID)).thenReturn(Optional.empty());

            org.junit.jupiter.api.Assertions.assertThrows(BusinessException.class,
                    () -> reportQueryService.getEventReport(EVENT_ADMIN_ID, EVENT_ID));
        }

        @Test
        @DisplayName("실패 - 권한 없음")
        void accessDenied() {
            Event event = Mockito.mock(Event.class);
            Mockito.when(event.getEventAdminId()).thenReturn(999L);
            Mockito.when(eventRepository.findById(EVENT_ID)).thenReturn(Optional.of(event));

            org.junit.jupiter.api.Assertions.assertThrows(BusinessException.class,
                    () -> reportQueryService.getEventReport(EVENT_ADMIN_ID, EVENT_ID));
        }
    }

    @Nested
    @DisplayName("부스별 성과 조회")
    class GetBoothPerformances {

        @Test
        @DisplayName("성공")
        void success() {
            mockEvent();
            BoothPerformanceResult perf = BoothPerformanceResult.builder()
                    .boothId(10L).boothName("Booth A").viewCount(200L)
                    .registerCount(80L).dropoutCount(10L)
                    .conversionRate(0.4).dropoutRate(0.125).build();
            Mockito.when(boothPerformanceResultRepository.findAllByEventId(EVENT_ID))
                    .thenReturn(List.of(perf));

            List<ReportResponseDto.BoothPerformanceDto> result =
                    reportQueryService.getBoothPerformances(EVENT_ADMIN_ID, EVENT_ID);

            org.assertj.core.api.Assertions.assertThat(result).hasSize(1);
            org.assertj.core.api.Assertions.assertThat(result.get(0).getBoothName()).isEqualTo("Booth A");
        }

        @Test
        @DisplayName("실패 - 데이터 없음")
        void notFound() {
            mockEvent();
            Mockito.when(boothPerformanceResultRepository.findAllByEventId(EVENT_ID))
                    .thenReturn(List.of());

            org.junit.jupiter.api.Assertions.assertThrows(BusinessException.class,
                    () -> reportQueryService.getBoothPerformances(EVENT_ADMIN_ID, EVENT_ID));
        }
    }

    @Nested
    @DisplayName("시간대별 유입량 조회")
    class GetHourlyTraffics {

        @Test
        @DisplayName("성공")
        void success() {
            mockEvent();
            HourlyTrafficResult traffic = HourlyTrafficResult.builder()
                    .eventId(EVENT_ID).datetimeHour("2026-03-20T14")
                    .activeUserCount(150L).registerCount(30L).build();
            Mockito.when(hourlyTrafficResultRepository.findAllByEventId(EVENT_ID))
                    .thenReturn(List.of(traffic));

            List<ReportResponseDto.HourlyTrafficDto> result =
                    reportQueryService.getHourlyTraffics(EVENT_ADMIN_ID, EVENT_ID);

            org.assertj.core.api.Assertions.assertThat(result).hasSize(1);
            org.assertj.core.api.Assertions.assertThat(result.get(0).getDatetimeHour()).isEqualTo("2026-03-20T14");
        }
    }

    @Nested
    @DisplayName("동선 분석 조회")
    class GetVisitorPaths {

        @Test
        @DisplayName("성공")
        void success() {
            mockEvent();
            VisitorPathResult path = VisitorPathResult.builder()
                    .eventId(EVENT_ID).pathString("A→B→C").visitorCount(42L).build();
            Mockito.when(visitorPathResultRepository.findAllByEventId(EVENT_ID))
                    .thenReturn(List.of(path));

            List<ReportResponseDto.VisitorPathDto> result =
                    reportQueryService.getVisitorPaths(EVENT_ADMIN_ID, EVENT_ID);

            org.assertj.core.api.Assertions.assertThat(result).hasSize(1);
            org.assertj.core.api.Assertions.assertThat(result.get(0).getPathString()).isEqualTo("A→B→C");
        }
    }

    @Nested
    @DisplayName("문제 지점 조회")
    class GetProblemSpots {

        @Test
        @DisplayName("성공")
        void success() {
            mockEvent();
            ProblemSpotResult problem = ProblemSpotResult.builder()
                    .eventId(EVENT_ID).issueType("HIGH_DROPOUT")
                    .targetId("10").targetName("Booth X")
                    .severity("HIGH").issueMetric(0.45)
                    .description("이탈률이 평균의 2배 이상").build();
            Mockito.when(problemSpotResultRepository.findAllByEventId(EVENT_ID))
                    .thenReturn(List.of(problem));

            List<ReportResponseDto.ProblemSpotDto> result =
                    reportQueryService.getProblemSpots(EVENT_ADMIN_ID, EVENT_ID);

            org.assertj.core.api.Assertions.assertThat(result).hasSize(1);
            org.assertj.core.api.Assertions.assertThat(result.get(0).getIssueType()).isEqualTo("HIGH_DROPOUT");
        }
    }
}
