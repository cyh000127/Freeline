package com.freeline.domain.booth.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.freeline.domain.booth.entity.BoothWaiting;
import com.freeline.domain.booth.entity.WaitingStatus;

public interface BoothWaitingRepository extends JpaRepository<BoothWaiting, Long> {

    long countByBoothIdAndStatus(final Long boothId, final WaitingStatus status);

    long countByBoothIdAndStatusIn(final Long boothId, final Collection<WaitingStatus> statuses);

    List<BoothWaiting> findAllByBoothIdAndStatusInOrderByWaitingNumberAsc(
            final Long boothId,
            final Collection<WaitingStatus> statuses
    );

    Optional<BoothWaiting> findFirstByBoothIdAndStatusOrderByCalledAtDesc(
            final Long boothId,
            final WaitingStatus status
    );

    boolean existsByVisitorIdAndBoothIdNotAndStatusIn(
            final Long visitorId,
            final Long boothId,
            final Collection<WaitingStatus> statuses
    );

    boolean existsByVisitorIdAndStatusIn(
            final Long visitorId,
            final Collection<WaitingStatus> statuses
    );
}