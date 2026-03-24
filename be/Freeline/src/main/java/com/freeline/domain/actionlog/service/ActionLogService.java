package com.freeline.domain.actionlog.service;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;

import com.freeline.domain.actionlog.dto.request.ActionLogBulkReqDto;
import com.freeline.domain.actionlog.dto.request.ActionLogReqDto;
import com.freeline.domain.actionlog.dto.response.ActionLogBulkResDto;

@Service
@RequiredArgsConstructor
public class ActionLogService {

	private static final Logger actionLogger = LoggerFactory.getLogger("ACTION_LOG");

	public ActionLogBulkResDto collectLogs(final Long visitorId, final ActionLogBulkReqDto request) {
		final List<ActionLogReqDto> logs = request.logs();
		int receivedCount = 0;

		for (final ActionLogReqDto log : logs) {
			actionLogger.info("{}\t{}\t{}\t{}\t{}\t{}\t{}\t{}",
					log.eventId(),
					visitorId,
					log.action(),
					log.targetType(),
					log.targetId(),
					log.metadata(),
					log.clientTimestamp(),
					log.sessionId()
			);
			receivedCount++;
		}

		return ActionLogBulkResDto.builder()
				.receivedCount(receivedCount)
				.droppedCount(logs.size() - receivedCount)
				.build();
	}
}
