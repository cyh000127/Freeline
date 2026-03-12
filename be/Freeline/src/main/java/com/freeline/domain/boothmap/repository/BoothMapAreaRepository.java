package com.freeline.domain.boothmap.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.freeline.domain.boothmap.entity.BoothMapArea;

public interface BoothMapAreaRepository extends JpaRepository<BoothMapArea, Long> {

    List<BoothMapArea> findAllByEventMapIdOrderByIdAsc(final Long eventMapId);

    Optional<BoothMapArea> findByEventMapIdAndBoothId(final Long eventMapId, final Long boothId);
}