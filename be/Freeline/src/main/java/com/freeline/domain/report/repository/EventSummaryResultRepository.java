package com.freeline.domain.report.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.freeline.domain.report.entity.EventSummaryResult;

@Repository
public interface EventSummaryResultRepository extends JpaRepository<EventSummaryResult, Long> {
    Optional<EventSummaryResult> findByEventId(Long eventId);
    void deleteByEventId(Long eventId);
}
