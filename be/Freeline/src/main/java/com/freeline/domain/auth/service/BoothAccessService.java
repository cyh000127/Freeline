package com.freeline.domain.auth.service;

import java.util.Objects;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;

import com.freeline.common.error.ErrorCode;
import com.freeline.domain.auth.entity.Role;
import com.freeline.domain.auth.exception.AuthException;
import com.freeline.domain.booth.entity.BoothGoods;
import com.freeline.domain.goods.exception.GoodsException;
import com.freeline.domain.goods.repository.GoodsRepository;

@Service
@RequiredArgsConstructor
public class BoothAccessService {

    private final BoothAdminContextService boothAdminContextService;
    private final GoodsRepository goodsRepository;

    public Long validateBoothAccess(final Authentication authentication, final Long boothId) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return boothId;
        }

        if (hasRole(authentication, Role.EVENT_ADMIN)) {
            return boothId;
        }

        if (!hasRole(authentication, Role.BOOTH_ADMIN)) {
            throw new AuthException(ErrorCode.ACCESS_DENIED);
        }

        final Long requestedBoothId = boothAdminContextService.resolveBoothId(extractUserId(authentication));
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

    private boolean hasRole(final Authentication authentication, final Role role) {
        return authentication.getAuthorities().stream()
                .anyMatch(authority -> Objects.equals(authority.getAuthority(), "ROLE_" + role.name()));
    }

    private Long extractUserId(final Authentication authentication) {
        return Long.valueOf(authentication.getName());
    }
}
