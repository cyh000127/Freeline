package com.freeline.common.event.waiting.dispatcher;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;

import com.freeline.common.event.waiting.detector.WaitingStatusChangeCommand;
import com.freeline.common.event.waiting.detector.WaitingStatusChangeDetector;

@Component
@RequiredArgsConstructor
public class WaitingEventDispatcher {

    private final WaitingStatusChangeDetector waitingStatusChangeDetector;
    private final ApplicationEventPublisher applicationEventPublisher;

    public void dispatch(final WaitingStatusChangeCommand command) {
        waitingStatusChangeDetector.detect(command)
                .ifPresent(applicationEventPublisher::publishEvent);
    }
}
