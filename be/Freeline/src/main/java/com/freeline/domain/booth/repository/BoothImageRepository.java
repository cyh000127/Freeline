package com.freeline.domain.booth.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.freeline.domain.booth.entity.BoothImage;

public interface BoothImageRepository extends JpaRepository<BoothImage, Long> {

    List<BoothImage> findAllByBoothIdOrderByIdAsc(final Long boothId);
}
