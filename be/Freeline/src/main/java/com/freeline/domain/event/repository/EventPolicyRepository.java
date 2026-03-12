package com.freeline.domain.event.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.freeline.domain.event.entity.EventPolicy;

public interface EventPolicyRepository extends JpaRepository<EventPolicy, Long> {

    Optional<EventPolicy> findByEvent_Id(final Long eventId);
}
