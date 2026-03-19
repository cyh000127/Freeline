package com.freeline.domain.auth.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.freeline.domain.auth.entity.BoothAdmin;

public interface BoothAdminRepository extends JpaRepository<BoothAdmin, Long> {

    Optional<BoothAdmin> findByLoginId(String loginId);

    List<BoothAdmin> findAllByBoothIdIn(List<Long> boothIds);

    List<BoothAdmin> findAllByBoothIdInOrderByBoothIdAsc(List<Long> boothIds);

}
