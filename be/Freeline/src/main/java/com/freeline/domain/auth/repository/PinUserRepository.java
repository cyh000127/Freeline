package com.freeline.domain.auth.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.freeline.domain.auth.entity.PinUser;

public interface PinUserRepository extends JpaRepository<PinUser, Long> {

    Optional<PinUser> findByPinCode(String pinCode);

}
