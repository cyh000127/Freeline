package com.freeline.domain.event.repository;

import java.util.Optional;

import jakarta.persistence.LockModeType;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.freeline.domain.event.entity.Event;
import com.freeline.domain.event.entity.EventStatus;

public interface EventRepository extends JpaRepository<Event, Long> {

    Page<Event> findAllByEventAdminId(final Long eventAdminId, final Pageable pageable);

    Page<Event> findAllByEventAdminIdAndStatus(final Long eventAdminId, final EventStatus status, final Pageable pageable);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select event from Event event where event.id = :eventId")
    Optional<Event> findByIdForUpdate(@Param("eventId") final Long eventId);
}
