package com.freeline.domain.waiting.service;

import java.time.LocalDateTime;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import com.freeline.common.event.waiting.detector.WaitingStatusChangeCommand;
import com.freeline.common.event.waiting.dispatcher.WaitingEventDispatcher;
import com.freeline.common.event.waiting.model.WaitingEventType;
import com.freeline.domain.booth.entity.BoothWaiting;
import com.freeline.domain.booth.entity.WaitingStatus;
import com.freeline.domain.booth.repository.BoothWaitingRepository;
import com.freeline.domain.waiting.assembler.WaitingEventSnapshotAssembler;

@Slf4j
@Service
@RequiredArgsConstructor
public class WaitingStatusPersistenceService {

    private final BoothWaitingRepository boothWaitingRepository;
    private final WaitingEventDispatcher waitingEventDispatcher;
    private final WaitingEventSnapshotAssembler waitingEventSnapshotAssembler;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public boolean expireWaiting(final Long waitingId, final LocalDateTime expiresAt) {
        final BoothWaiting waiting = boothWaitingRepository.findById(waitingId)
                .orElseThrow(() -> new IllegalStateException("Waiting not found for expiration: " + waitingId));

        if (expiresAt != null) {
            waiting.updateCallExpiresAt(expiresAt);
        }

        if (waiting.getStatus() == WaitingStatus.EXPIRED) {
            return true;
        }

        if (waiting.getStatus() != WaitingStatus.CALLED) {
            log.warn(
                    "[Waiting] skip expiration due to status mismatch {waitingId: {}, currentStatus: {}}",
                    waitingId,
                    waiting.getStatus()
            );
            return false;
        }

        final String previousStatus = waiting.getStatus().name();
        waiting.updateStatus(WaitingStatus.EXPIRED);

        waitingEventDispatcher.dispatch(
                new WaitingStatusChangeCommand(
                        WaitingEventType.WAITING_EXPIRED,
                        waiting.getId(),
                        waiting.getBoothId(),
                        waiting.getVisitorId(),
                        previousStatus,
                        waiting.getStatus().name(),
                        waitingEventSnapshotAssembler.toSnapshot(waiting)
                )
        );
        return true;
    }
}
