package com.freeline.domain.eventadmin.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.freeline.domain.eventadmin.entity.EventAdmin;

public interface EventAdminRepository extends JpaRepository<EventAdmin, Long> {

	boolean existsByEmail(String email);

	Optional<EventAdmin> findByEmail(String email);
}
