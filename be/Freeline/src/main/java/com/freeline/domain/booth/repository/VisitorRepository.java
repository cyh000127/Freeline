package com.freeline.domain.booth.repository;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.freeline.domain.booth.entity.Visitor;

public interface VisitorRepository extends JpaRepository<Visitor, Long> {

    Optional<Visitor> findByEntryCode(String entryCode);

    Optional<Visitor> findByEntryCodeAndActiveTrue(String entryCode);

    boolean existsByEntryCode(String entryCode);

    long countByEventId(Long eventId);

    Page<Visitor> findAllByEventId(Long eventId, Pageable pageable);
}
