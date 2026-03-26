package com.freeline.domain.event.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.freeline.domain.event.entity.Event;
import com.freeline.domain.event.entity.EventStatus;

public interface EventRepository extends JpaRepository<Event, Long> {

    Page<Event> findAllByEventAdminId(final Long eventAdminId, final Pageable pageable);

    Page<Event> findAllByEventAdminIdAndStatus(final Long eventAdminId, final EventStatus status, final Pageable pageable);
}
