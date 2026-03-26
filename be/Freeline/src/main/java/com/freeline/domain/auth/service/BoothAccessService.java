package com.freeline.domain.auth.service;

import java.util.Objects;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;

import com.freeline.common.error.ErrorCode;
import com.freeline.domain.auth.entity.Role;
import com.freeline.domain.auth.exception.AuthException;
import com.freeline.domain.booth.entity.Booth;
import com.freeline.domain.booth.entity.BoothGoods;
import com.freeline.domain.booth.repository.BoothRepository;
import com.freeline.domain.event.entity.Event;
import com.freeline.domain.event.repository.EventRepository;
import com.freeline.domain.goods.exception.GoodsException;
import com.freeline.domain.goods.repository.GoodsRepository;

@Service
@RequiredArgsConstructor
public class BoothAccessService {

    private final BoothAdminContextService boothAdminContextService;
    private final GoodsRepository goodsRepository;
    private final BoothRepository boothRepository;
    private final EventRepository eventRepository;

    public Long validateBoothAccess(final Authentication authentication, final Long boothId) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return boothId;
        }

        final Long userId = extractUserId(authentication);

        if (hasRole(authentication, Role.EVENT_ADMIN)) {
            validateEventAdminBoothAccess(userId, boothId);
            return boothId;
        }

        if (!hasRole(authentication, Role.BOOTH_ADMIN)) {
            throw new AuthException(ErrorCode.ACCESS_DENIED);
        }

        final Long requestedBoothId = boothAdminContextService.resolveBoothId(userId);
        if (!Objects.equals(requestedBoothId, boothId)) {
            throw new AuthException(ErrorCode.ACCESS_DENIED);
        }

        return requestedBoothId;
    }

    public Long validateGoodsAccess(final Authentication authentication, final Long goodsId) {
        final BoothGoods goods = goodsRepository.findById(goodsId)
                .orElseThrow(() -> new GoodsException(ErrorCode.GOODS_NOT_FOUND));

        if (authentication == null || !authentication.isAuthenticated()) {
            return goods.getId();
        }

        validateBoothAccess(authentication, goods.getBoothId());
        return goods.getId();
    }

    public Long resolveAccessibleBoothId(final Authentication authentication, final Long boothId) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AuthException(ErrorCode.ACCESS_DENIED);
        }

        final Long userId = extractUserId(authentication);

        if (hasRole(authentication, Role.BOOTH_ADMIN)) {
            final Long ownBoothId = boothAdminContextService.resolveBoothId(userId);
            if (boothId != null && !Objects.equals(ownBoothId, boothId)) {
                throw new AuthException(ErrorCode.ACCESS_DENIED);
            }
            return ownBoothId;
        }

        if (hasRole(authentication, Role.EVENT_ADMIN)) {
            if (boothId == null) {
                throw new AuthException(ErrorCode.INVALID_INPUT);
            }
            validateEventAdminBoothAccess(userId, boothId);
            return boothId;
        }

        throw new AuthException(ErrorCode.ACCESS_DENIED);
    }

    private boolean hasRole(final Authentication authentication, final Role role) {
        return authentication.getAuthorities().stream()
                .anyMatch(authority -> Objects.equals(authority.getAuthority(), "ROLE_" + role.name()));
    }

    private void validateEventAdminBoothAccess(final Long eventAdminId, final Long boothId) {
        final Long eventId = boothRepository.findById(boothId)
                .map(Booth::getEventId)
                .orElseThrow(() -> new AuthException(ErrorCode.BOOTH_NOT_FOUND));

        final Long boothOwnerId = eventRepository.findById(eventId)
                .map(Event::getEventAdminId)
                .orElseThrow(() -> new AuthException(ErrorCode.EVENT_NOT_FOUND));

        if (!Objects.equals(boothOwnerId, eventAdminId)) {
            throw new AuthException(ErrorCode.ACCESS_DENIED);
        }
    }

    private Long extractUserId(final Authentication authentication) {
        return Long.valueOf(authentication.getName());
    }
}
