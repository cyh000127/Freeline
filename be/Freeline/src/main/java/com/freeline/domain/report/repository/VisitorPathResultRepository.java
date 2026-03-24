package com.freeline.domain.report.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.freeline.domain.report.entity.VisitorPathResult;

@Repository
public interface VisitorPathResultRepository extends JpaRepository<VisitorPathResult, Long> {
    List<VisitorPathResult> findAllByEventId(Long eventId);
    void deleteByEventId(Long eventId);
}
