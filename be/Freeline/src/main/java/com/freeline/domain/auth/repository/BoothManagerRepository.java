package com.freeline.domain.auth.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.freeline.domain.auth.entity.BoothManager;

public interface BoothManagerRepository extends JpaRepository<BoothManager, Long> {

    Optional<BoothManager> findByLoginId(String loginId);

}
