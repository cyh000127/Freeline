package com.freeline.domain.auth.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.freeline.domain.auth.entity.Organizer;

public interface OrganizerRepository extends JpaRepository<Organizer, Long> {

    Optional<Organizer> findByEmail(String email);

    boolean existsByEmail(String email);

}
