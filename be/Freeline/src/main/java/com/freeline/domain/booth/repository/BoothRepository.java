package com.freeline.domain.booth.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.freeline.domain.booth.entity.Booth;

public interface BoothRepository extends JpaRepository<Booth, Long> {

    List<Booth> findAllByEventIdOrderByIdAsc(final Long eventId);
}
