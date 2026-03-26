package com.freeline.domain.report.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.freeline.domain.report.entity.BoothPerformanceResult;

@Repository
public interface BoothPerformanceResultRepository extends JpaRepository<BoothPerformanceResult, Long> {
    List<BoothPerformanceResult> findAllByEventId(Long eventId);
    Optional<BoothPerformanceResult> findByEventIdAndBoothId(Long eventId, Long boothId);
    void deleteByEventId(Long eventId);
}
