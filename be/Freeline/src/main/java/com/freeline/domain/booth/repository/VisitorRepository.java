package com.freeline.domain.booth.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.freeline.domain.booth.entity.Visitor;

public interface VisitorRepository extends JpaRepository<Visitor, Long> {
}
