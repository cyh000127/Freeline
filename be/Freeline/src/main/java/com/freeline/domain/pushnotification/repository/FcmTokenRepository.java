package com.freeline.domain.pushnotification.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.freeline.domain.pushnotification.entity.FcmToken;

public interface FcmTokenRepository extends JpaRepository<FcmToken, Long> {

    Optional<FcmToken> findByDeviceId(final String deviceId);

    List<FcmToken> findAllByVisitorIdOrderByIdAsc(final Long visitorId);
}
