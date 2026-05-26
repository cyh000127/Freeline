package com.freeline.domain.waiting.service;

import java.util.Optional;

import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;

import com.freeline.domain.booth.entity.Booth;
import com.freeline.domain.booth.entity.BoothPolicy;
import com.freeline.domain.booth.repository.BoothPolicyRepository;
import com.freeline.domain.booth.repository.BoothRepository;
import com.freeline.domain.event.entity.EventPolicy;
import com.freeline.domain.event.repository.EventPolicyRepository;

@Component
@RequiredArgsConstructor
public class WaitingPolicyResolver {

    private final BoothRepository boothRepository;
    private final BoothPolicyRepository boothPolicyRepository;
    private final EventPolicyRepository eventPolicyRepository;

    public int resolveCallValidTimeSeconds(final Long boothId, final int defaultValue) {
        return boothPolicyRepository.findByBoothId(boothId)
                .map(BoothPolicy::getCallValidTime)
                .filter(value -> value > 0)
                .or(() -> findEventPolicy(boothId)
                        .map(EventPolicy::getDefaultCallTtl)
                        .filter(value -> value > 0))
                .orElse(defaultValue);
    }

    public int resolveDeferLimit(final Long boothId, final int defaultValue) {
        return boothPolicyRepository.findByBoothId(boothId)
                .map(BoothPolicy::getDeferLimit)
                .filter(value -> value >= 0)
                .or(() -> findEventPolicy(boothId)
                        .map(EventPolicy::getDefaultDeferLimit)
                        .filter(value -> value >= 0))
                .orElse(defaultValue);
    }

    public int resolveStayTimeSeconds(final Long boothId, final int defaultValue) {
        return boothPolicyRepository.findByBoothId(boothId)
                .map(BoothPolicy::getStayTime)
                .filter(value -> value > 0)
                .or(() -> findEventPolicy(boothId)
                        .map(EventPolicy::getDefaultStaySec)
                        .filter(value -> value > 0))
                .orElse(defaultValue);
    }

    public int resolveMaxWaitingCount(final Long boothId, final int defaultValue) {
        return boothPolicyRepository.findByBoothId(boothId)
                .map(BoothPolicy::getMaxWaitingCount)
                .filter(value -> value >= 0)
                .or(() -> findEventPolicy(boothId)
                        .map(EventPolicy::getDefaultMaxWaiting)
                        .filter(value -> value >= 0))
                .orElse(defaultValue);
    }

    public int resolveCallCount(final Long boothId, final int defaultValue) {
        return boothPolicyRepository.findByBoothId(boothId)
                .map(BoothPolicy::getCallCount)
                .filter(value -> value > 0)
                .or(() -> findEventPolicy(boothId)
                        .map(EventPolicy::getDefaultCallCount)
                        .filter(value -> value > 0))
                .orElse(defaultValue);
    }

    public WaitingCallPolicy resolveCallPolicy(
            final Booth booth,
            final int defaultCallCount,
            final int defaultCallValidTimeSeconds
    ) {
        final Optional<BoothPolicy> boothPolicy = boothPolicyRepository.findByBoothId(booth.getId());
        Integer callCount = boothPolicy
                .map(BoothPolicy::getCallCount)
                .filter(value -> value > 0)
                .orElse(null);
        Integer callValidTimeSeconds = boothPolicy
                .map(BoothPolicy::getCallValidTime)
                .filter(value -> value > 0)
                .orElse(null);

        if (callCount == null || callValidTimeSeconds == null) {
            final Optional<EventPolicy> eventPolicy = eventPolicyRepository.findByEvent_Id(booth.getEventId());
            if (callCount == null) {
                callCount = eventPolicy
                        .map(EventPolicy::getDefaultCallCount)
                        .filter(value -> value > 0)
                        .orElse(defaultCallCount);
            }

            if (callValidTimeSeconds == null) {
                callValidTimeSeconds = eventPolicy
                        .map(EventPolicy::getDefaultCallTtl)
                        .filter(value -> value > 0)
                        .orElse(defaultCallValidTimeSeconds);
            }
        }

        return new WaitingCallPolicy(callCount, callValidTimeSeconds);
    }

    private Optional<EventPolicy> findEventPolicy(final Long boothId) {
        return boothRepository.findById(boothId)
                .map(Booth::getEventId)
                .flatMap(eventPolicyRepository::findByEvent_Id);
    }

    public record WaitingCallPolicy(
            int callCount,
            int callValidTimeSeconds
    ) {
    }
}
