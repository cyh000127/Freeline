package com.freeline.domain.boothmap.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.freeline.domain.boothmap.entity.EventMap;

public interface EventMapRepository extends JpaRepository<EventMap, Long> {

    Optional<EventMap> findFirstByEventIdAndVisibleTrueOrderByIdDesc(final Long eventId);

    Optional<EventMap> findFirstByEventIdOrderByIdDesc(final Long eventId);
}
