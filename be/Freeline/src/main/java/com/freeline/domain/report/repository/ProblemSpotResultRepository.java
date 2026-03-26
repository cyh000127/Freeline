package com.freeline.domain.report.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.freeline.domain.report.entity.ProblemSpotResult;

@Repository
public interface ProblemSpotResultRepository extends JpaRepository<ProblemSpotResult, Long> {
    List<ProblemSpotResult> findAllByEventId(Long eventId);
    List<ProblemSpotResult> findAllByEventIdAndTargetId(Long eventId, String targetId);
    void deleteByEventId(Long eventId);
}
