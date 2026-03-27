package com.freeline.domain.booth.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.freeline.domain.booth.entity.BoothWaiting;
import com.freeline.domain.booth.entity.WaitingStatus;

public interface BoothWaitingRepository extends JpaRepository<BoothWaiting, Long> {

    long countByBoothIdAndStatus(final Long boothId, final WaitingStatus status);

    long countByBoothIdAndStatusIn(final Long boothId, final Collection<WaitingStatus> statuses);

    long countByBoothIdAndStatusInAndWaitingNumberLessThan(
            final Long boothId,
            final Collection<WaitingStatus> statuses,
            final Integer waitingNumber
    );

    long countByVisitorIdAndStatusIn(final Long visitorId, final Collection<WaitingStatus> statuses);

    List<BoothWaiting> findAllByBoothIdAndStatusInOrderByWaitingNumberAsc(
            final Long boothId,
            final Collection<WaitingStatus> statuses
    );

    List<BoothWaiting> findAllByBoothIdInAndStatusInOrderByBoothIdAscWaitingNumberAsc(
            final Collection<Long> boothIds,
            final Collection<WaitingStatus> statuses
    );

    List<BoothWaiting> findAllByVisitorIdAndStatusInOrderByRequestedAtAsc(
            final Long visitorId,
            final Collection<WaitingStatus> statuses
    );

    @Query("""
            select w
            from BoothWaiting w
            join fetch w.visitor
            where w.boothId = :boothId
              and w.status in :statuses
            order by w.waitingNumber asc
            """)
    List<BoothWaiting> findWithVisitorByBoothIdAndStatusInOrderByWaitingNumberAsc(
            @Param("boothId") final Long boothId,
            @Param("statuses") final Collection<WaitingStatus> statuses
    );

    Optional<BoothWaiting> findFirstByBoothIdAndStatusOrderByCalledAtDesc(
            final Long boothId,
            final WaitingStatus status
    );

    Optional<BoothWaiting> findFirstByBoothIdAndVisitorIdAndStatusOrderByCalledAtDesc(
            final Long boothId,
            final Long visitorId,
            final WaitingStatus status
    );

    Optional<BoothWaiting> findFirstByBoothIdAndStatusAndWaitingNumberGreaterThanOrderByWaitingNumberAsc(
            final Long boothId,
            final WaitingStatus status,
            final Integer waitingNumber
    );

    boolean existsByVisitorIdAndBoothIdNotAndStatusIn(
            final Long visitorId,
            final Long boothId,
            final Collection<WaitingStatus> statuses
    );

    boolean existsByVisitorIdAndBoothIdAndStatusIn(
            final Long visitorId,
            final Long boothId,
            final Collection<WaitingStatus> statuses
    );

    boolean existsByVisitorIdAndStatusIn(
            final Long visitorId,
            final Collection<WaitingStatus> statuses
    );

    Optional<BoothWaiting> findTopByBoothIdOrderByWaitingNumberDesc(final Long boothId);
}
