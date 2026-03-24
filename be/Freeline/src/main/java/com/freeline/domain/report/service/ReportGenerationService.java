package com.freeline.domain.report.service;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import com.freeline.common.error.ErrorCode;
import com.freeline.common.error.exception.BusinessException;
import com.freeline.domain.event.entity.Event;
import com.freeline.domain.event.entity.EventStatus;
import com.freeline.domain.event.repository.EventRepository;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReportGenerationService {

    private final EventRepository eventRepository;
    private final DbDumpService dbDumpService;
    private final HiveAnalysisService hiveAnalysisService;
    private final ReportImportService reportImportService;

    private final ConcurrentMap<Long, ReportStatus> statusMap = new ConcurrentHashMap<>();

    public void requestGeneration(Long eventAdminId, Long eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new BusinessException(ErrorCode.EVENT_NOT_FOUND));

        if (!event.getEventAdminId().equals(eventAdminId)) {
            throw new BusinessException(ErrorCode.ACCESS_DENIED);
        }

        if (event.getStatus() != EventStatus.CLOSED) {
            throw new BusinessException(ErrorCode.REPORT_EVENT_NOT_CLOSED);
        }

        ReportStatus current = statusMap.get(eventId);
        if (current != null && current != ReportStatus.COMPLETED && current != ReportStatus.FAILED) {
            throw new BusinessException(ErrorCode.REPORT_ALREADY_GENERATING);
        }

        statusMap.put(eventId, ReportStatus.PENDING);
        executeAsync(eventId);
    }

    @Async
    public void executeAsync(Long eventId) {
        try {
            statusMap.put(eventId, ReportStatus.DUMPING);
            log.info("[Report] DUMPING - event_id: {}", eventId);
            dbDumpService.dumpEventData(eventId);

            statusMap.put(eventId, ReportStatus.ANALYZING);
            log.info("[Report] ANALYZING - event_id: {}", eventId);
            hiveAnalysisService.runAnalysis(eventId);

            statusMap.put(eventId, ReportStatus.IMPORTING);
            log.info("[Report] IMPORTING - event_id: {}", eventId);
            reportImportService.importEventReport(eventId);

            statusMap.put(eventId, ReportStatus.COMPLETED);
            log.info("[Report] COMPLETED - event_id: {}", eventId);
        } catch (Exception e) {
            statusMap.put(eventId, ReportStatus.FAILED);
            log.error("[Report] FAILED - event_id: {}", eventId, e);
        }
    }

    public ReportStatus getStatus(Long eventId) {
        return statusMap.get(eventId);
    }
}
