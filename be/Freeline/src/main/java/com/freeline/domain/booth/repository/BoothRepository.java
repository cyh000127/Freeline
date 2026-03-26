package com.freeline.domain.booth.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.freeline.domain.booth.entity.Booth;

public interface BoothRepository extends JpaRepository<Booth, Long> {

    List<Booth> findAllByEventIdOrderByIdAsc(final Long eventId);

    long countByIdInAndEventId(final List<Long> boothIds, final Long eventId);

    @Query("""
            SELECT b.id, b.name, ba.name, ba.company
            FROM Booth b
            LEFT JOIN BoothAdmin ba ON b.id = ba.boothId
            WHERE b.eventId = :eventId
            AND (:keyword IS NULL OR :keyword = ''
                 OR LOWER(b.name) LIKE LOWER(CONCAT('%', :keyword, '%'))
                 OR LOWER(ba.name) LIKE LOWER(CONCAT('%', :keyword, '%'))
                 OR LOWER(ba.company) LIKE LOWER(CONCAT('%', :keyword, '%')))
            ORDER BY b.name ASC
            """)
    List<Object[]> searchBoothsByKeyword(
            @Param("eventId") final Long eventId,
            @Param("keyword") final String keyword
    );
}
