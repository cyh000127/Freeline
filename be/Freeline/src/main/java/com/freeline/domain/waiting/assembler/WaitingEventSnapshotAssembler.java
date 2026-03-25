package com.freeline.domain.waiting.assembler;

import org.springframework.stereotype.Component;

import com.freeline.common.event.waiting.model.WaitingEventSnapshot;
import com.freeline.domain.booth.entity.BoothWaiting;

@Component
public class WaitingEventSnapshotAssembler {

    public WaitingEventSnapshot toSnapshot(final BoothWaiting waiting) {
        return WaitingEventSnapshot.builder()
                .waitingId(waiting.getId())
                .waitingNumber(waiting.getWaitingNumber())
                .visitorId(waiting.getVisitorId())
                .visitorName(waiting.getVisitor() != null ? waiting.getVisitor().getName() : null)
                .status(waiting.getStatus() != null ? waiting.getStatus().name() : null)
                .arrivalChecked(waiting.getRegisteredAt() != null)
                .calledAt(waiting.getCalledAt())
                .registeredAt(waiting.getRegisteredAt())
                .enteredAt(waiting.getEnteredAt())
                .build();
    }
}
