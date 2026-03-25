package com.freeline.domain.auth.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.freeline.domain.auth.entity.BoothAdmin;

public interface BoothAdminRepository extends JpaRepository<BoothAdmin, Long> {

    Optional<BoothAdmin> findByLoginId(String loginId);

    List<BoothAdmin> findAllByBoothIdIn(List<Long> boothIds);

    @Query("""
            select boothAdmin
            from BoothAdmin boothAdmin
            join fetch boothAdmin.booth booth
            where booth.eventId = :eventId
            order by booth.id asc, boothAdmin.id asc
            """)
    List<BoothAdmin> findAllWithBoothByEventId(@Param("eventId") final Long eventId);

}
