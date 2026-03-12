package com.freeline.domain.booth.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.freeline.domain.booth.entity.BoothGoods;

public interface BoothGoodsRepository extends JpaRepository<BoothGoods, Long> {

    List<BoothGoods> findAllByBoothIdOrderByIdAsc(final Long boothId);
}
