package com.freeline.domain.booth.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.freeline.domain.booth.entity.BoothPolicy;

public interface BoothPolicyRepository extends JpaRepository<BoothPolicy, Long> {

    Optional<BoothPolicy> findByBoothId(final Long boothId);
}
