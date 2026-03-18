package com.freeline.domain.goods.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.freeline.domain.booth.entity.BoothGoods;

public interface GoodsRepository extends JpaRepository<BoothGoods, Long> {

    List<BoothGoods> findAllByBoothIdOrderByIdAsc(final Long boothId);
}
