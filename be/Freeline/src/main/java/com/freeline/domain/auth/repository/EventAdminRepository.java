package com.freeline.domain.auth.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.freeline.domain.auth.entity.EventAdmin;

public interface EventAdminRepository extends JpaRepository<EventAdmin, Long> {

    Optional<EventAdmin> findByEmail(String email);

    boolean existsByEmail(String email);

}
