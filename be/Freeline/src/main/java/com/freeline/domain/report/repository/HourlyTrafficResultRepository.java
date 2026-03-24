package com.freeline.domain.report.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.freeline.domain.report.entity.HourlyTrafficResult;

@Repository
public interface HourlyTrafficResultRepository extends JpaRepository<HourlyTrafficResult, Long> {
    List<HourlyTrafficResult> findAllByEventId(Long eventId);
    void deleteByEventId(Long eventId);
}
