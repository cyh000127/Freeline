package com.freeline.domain.boothmap.entity;

import java.math.BigDecimal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import com.freeline.common.entity.BaseEntity;

@Entity
@Table(name = "booth_map_areas")
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PROTECTED)
public class BoothMapArea extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "event_map_id", nullable = false)
    private Long eventMapId;

    @Column(name = "booth_id", nullable = false)
    private Long boothId;

    @Column(name = "x_ratio", nullable = false, precision = 7, scale = 4)
    private BigDecimal xRatio;

    @Column(name = "y_ratio", nullable = false, precision = 7, scale = 4)
    private BigDecimal yRatio;

    @Column(name = "width_ratio", nullable = false, precision = 7, scale = 4)
    private BigDecimal widthRatio;

    @Column(name = "height_ratio", nullable = false, precision = 7, scale = 4)
    private BigDecimal heightRatio;

    public void updateRect(
            final BigDecimal xRatio,
            final BigDecimal yRatio,
            final BigDecimal widthRatio,
            final BigDecimal heightRatio
    ) {
        this.xRatio = xRatio;
        this.yRatio = yRatio;
        this.widthRatio = widthRatio;
        this.heightRatio = heightRatio;
    }
}