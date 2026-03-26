package com.freeline.domain.auth.service;

import java.util.List;
import java.util.Optional;

import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import com.freeline.domain.auth.entity.BoothAdmin;
import com.freeline.domain.auth.exception.AuthException;
import com.freeline.domain.auth.repository.BoothAdminRepository;
import com.freeline.domain.booth.entity.Booth;
import com.freeline.domain.booth.entity.BoothGoods;
import com.freeline.domain.booth.repository.BoothRepository;
import com.freeline.domain.event.entity.Event;
import com.freeline.domain.event.repository.EventRepository;
import com.freeline.domain.goods.exception.GoodsException;
import com.freeline.domain.goods.repository.GoodsRepository;

@ExtendWith(MockitoExtension.class)
class BoothAccessServiceTest {

    @Mock
    private BoothAdminRepository boothAdminRepository;

    @Mock
    private GoodsRepository goodsRepository;

    @Mock
    private BoothRepository boothRepository;

    @Mock
    private EventRepository eventRepository;

    private BoothAccessService boothAccessService;

    @BeforeEach
    void setUp() {
        final BoothAdminContextService boothAdminContextService = new BoothAdminContextService(boothAdminRepository);
        boothAccessService = new BoothAccessService(
                boothAdminContextService,
                goodsRepository,
                boothRepository,
                eventRepository
        );
    }

    @Test
    void 부스관리자는_자신의_boothId에만_접근할_수_있다() {
        final Authentication authentication = new UsernamePasswordAuthenticationToken(
                "11",
                null,
                List.of(new SimpleGrantedAuthority("ROLE_BOOTH_ADMIN"))
        );
        final BoothAdmin boothAdmin = BoothAdmin.builder()
                .id(11L)
                .boothId(7L)
                .build();

        org.mockito.Mockito.when(boothAdminRepository.findById(11L)).thenReturn(Optional.of(boothAdmin));

        final Long boothId = boothAccessService.validateBoothAccess(authentication, 7L);

        Assertions.assertThat(boothId).isEqualTo(7L);
    }

    @Test
    void 부스관리자는_다른_boothId에_접근할_수_없다() {
        final Authentication authentication = new UsernamePasswordAuthenticationToken(
                "11",
                null,
                List.of(new SimpleGrantedAuthority("ROLE_BOOTH_ADMIN"))
        );
        final BoothAdmin boothAdmin = BoothAdmin.builder()
                .id(11L)
                .boothId(7L)
                .build();

        org.mockito.Mockito.when(boothAdminRepository.findById(11L)).thenReturn(Optional.of(boothAdmin));

        Assertions.assertThatThrownBy(() -> boothAccessService.validateBoothAccess(authentication, 8L))
                .isInstanceOf(AuthException.class);
    }

    @Test
    void 굿즈_수정은_해당_부스_관리자만_수행할_수_있다() {
        final Authentication authentication = new UsernamePasswordAuthenticationToken(
                "11",
                null,
                List.of(new SimpleGrantedAuthority("ROLE_BOOTH_ADMIN"))
        );
        final BoothAdmin boothAdmin = BoothAdmin.builder()
                .id(11L)
                .boothId(7L)
                .build();
        final BoothGoods boothGoods = BoothGoods.builder()
                .id(101L)
                .boothId(7L)
                .name("키링")
                .imagePath("https://example.com/image.png")
                .soldOut(false)
                .build();

        org.mockito.Mockito.when(boothAdminRepository.findById(11L)).thenReturn(Optional.of(boothAdmin));
        org.mockito.Mockito.when(goodsRepository.findById(101L)).thenReturn(Optional.of(boothGoods));

        final Long goodsId = boothAccessService.validateGoodsAccess(authentication, 101L);

        Assertions.assertThat(goodsId).isEqualTo(101L);
    }

    @Test
    void 이벤트관리자는_자신이_소유한_이벤트의_부스에_접근할_수_있다() {
        final Authentication authentication = new UsernamePasswordAuthenticationToken(
                "21",
                null,
                List.of(new SimpleGrantedAuthority("ROLE_EVENT_ADMIN"))
        );
        final Booth booth = Booth.builder()
                .id(7L)
                .eventId(3L)
                .build();
        final Event event = Event.builder()
                .id(3L)
                .eventAdminId(21L)
                .build();

        org.mockito.Mockito.when(boothRepository.findById(7L)).thenReturn(Optional.of(booth));
        org.mockito.Mockito.when(eventRepository.findById(3L)).thenReturn(Optional.of(event));

        final Long boothId = boothAccessService.validateBoothAccess(authentication, 7L);

        Assertions.assertThat(boothId).isEqualTo(7L);
    }

    @Test
    void 이벤트관리자는_다른_주최자의_부스에_접근할_수_없다() {
        final Authentication authentication = new UsernamePasswordAuthenticationToken(
                "21",
                null,
                List.of(new SimpleGrantedAuthority("ROLE_EVENT_ADMIN"))
        );
        final Booth booth = Booth.builder()
                .id(7L)
                .eventId(3L)
                .build();
        final Event event = Event.builder()
                .id(3L)
                .eventAdminId(999L)
                .build();

        org.mockito.Mockito.when(boothRepository.findById(7L)).thenReturn(Optional.of(booth));
        org.mockito.Mockito.when(eventRepository.findById(3L)).thenReturn(Optional.of(event));

        Assertions.assertThatThrownBy(() -> boothAccessService.validateBoothAccess(authentication, 7L))
                .isInstanceOf(AuthException.class);
    }

    @Test
    void 부스관리자의_접근_boothId는_본인_부스로_해석된다() {
        final Authentication authentication = new UsernamePasswordAuthenticationToken(
                "11",
                null,
                List.of(new SimpleGrantedAuthority("ROLE_BOOTH_ADMIN"))
        );
        final BoothAdmin boothAdmin = BoothAdmin.builder()
                .id(11L)
                .boothId(7L)
                .build();

        org.mockito.Mockito.when(boothAdminRepository.findById(11L)).thenReturn(Optional.of(boothAdmin));

        final Long boothId = boothAccessService.resolveAccessibleBoothId(authentication, null);

        Assertions.assertThat(boothId).isEqualTo(7L);
    }

    @Test
    void 이벤트관리자는_부스관리자_me_API_호출시_boothId가_필수다() {
        final Authentication authentication = new UsernamePasswordAuthenticationToken(
                "21",
                null,
                List.of(new SimpleGrantedAuthority("ROLE_EVENT_ADMIN"))
        );

        Assertions.assertThatThrownBy(() -> boothAccessService.resolveAccessibleBoothId(authentication, null))
                .isInstanceOf(AuthException.class);
    }

    @Test
    void 존재하지_않는_굿즈는_접근_검증에서_예외가_발생한다() {
        final Authentication authentication = new UsernamePasswordAuthenticationToken(
                "11",
                null,
                List.of(new SimpleGrantedAuthority("ROLE_BOOTH_ADMIN"))
        );

        org.mockito.Mockito.when(goodsRepository.findById(101L)).thenReturn(Optional.empty());

        Assertions.assertThatThrownBy(() -> boothAccessService.validateGoodsAccess(authentication, 101L))
                .isInstanceOf(GoodsException.class);
    }
}
