package com.freeline.domain.booth.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.freeline.domain.booth.entity.Booth;

public interface BoothRepository extends JpaRepository<Booth, Long> {

    List<Booth> findAllByEventIdOrderByIdAsc(final Long eventId);

    @Query("""
            SELECT COUNT(b) > 0
            FROM Booth b
            WHERE b.eventId = :eventId
            AND LOWER(TRIM(b.name)) = :normalizedName
            """)
    boolean existsByEventIdAndNormalizedName(
            @Param("eventId") final Long eventId,
            @Param("normalizedName") final String normalizedName
    );

    @Query("""
            SELECT COUNT(b) > 0
            FROM Booth b
            WHERE b.eventId = :eventId
            AND b.id <> :boothId
            AND LOWER(TRIM(b.name)) = :normalizedName
            """)
    boolean existsByEventIdAndNormalizedNameAndIdNot(
            @Param("eventId") final Long eventId,
            @Param("boothId") final Long boothId,
            @Param("normalizedName") final String normalizedName
    );

    @Query("""
            SELECT LOWER(TRIM(b.name))
            FROM Booth b
            WHERE b.eventId = :eventId
            AND LOWER(TRIM(b.name)) IN :normalizedNames
            """)
    List<String> findDuplicatedNormalizedNames(
            @Param("eventId") final Long eventId,
            @Param("normalizedNames") final List<String> normalizedNames
    );

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
