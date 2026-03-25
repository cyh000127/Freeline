package com.freeline.domain.boothmap.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.freeline.domain.boothmap.entity.BoothMapArea;

public interface BoothMapAreaRepository extends JpaRepository<BoothMapArea, Long> {

    List<BoothMapArea> findAllByEventMapIdOrderByIdAsc(final Long eventMapId);

    Optional<BoothMapArea> findByEventMapIdAndBoothId(final Long eventMapId, final Long boothId);

    @Modifying
    @Query("DELETE FROM BoothMapArea bma WHERE bma.eventMapId = :eventMapId")
    void deleteAllByEventMapId(@Param("eventMapId") final Long eventMapId);
}
