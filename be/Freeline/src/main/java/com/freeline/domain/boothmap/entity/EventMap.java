package com.freeline.domain.boothmap.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import com.freeline.common.entity.BaseEntity;

@Entity
@Table(name = "event_maps")
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PROTECTED)
public class EventMap extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "event_id", nullable = false)
    private Long eventId;

    @Column(name = "image_path", nullable = false, length = 500)
    private String imagePath;

    @Column(name = "is_visible", nullable = false)
    private boolean visible;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "mapping_snapshot", columnDefinition = "json")
    private String mappingSnapshot;

    public void update(final String imagePath, final boolean visible) {
        this.imagePath = imagePath;
        this.visible = visible;
    }

    public void updateMappingSnapshot(final String mappingSnapshot) {
        this.mappingSnapshot = mappingSnapshot;
    }
}
