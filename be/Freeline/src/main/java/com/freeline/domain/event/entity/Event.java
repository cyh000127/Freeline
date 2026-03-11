package com.freeline.domain.event.entity;

import java.time.LocalDate;
import java.time.LocalTime;

import com.freeline.common.entity.BaseEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "events")
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PROTECTED)
public class Event extends BaseEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "id")
	private Long id;

	@Column(name = "event_admin_id", nullable = false)
	private Long eventAdminId;

	@Column(name = "name", nullable = false, length = 100)
	private String name;

	@Column(name = "description", nullable = false, columnDefinition = "TEXT")
	private String description;

	@Column(name = "start_date", nullable = false)
	private LocalDate startDate;

	@Column(name = "end_date", nullable = false)
	private LocalDate endDate;

	@Column(name = "open_time", nullable = false)
	private LocalTime openTime;

	@Column(name = "close_time", nullable = false)
	private LocalTime closeTime;

	@Column(name = "location_address", nullable = false, length = 255)
	private String locationAddress;

	@Column(name = "thumbnail_image_url", length = 500)
	private String thumbnailImageUrl;

	@Enumerated(EnumType.STRING)
	@Column(name = "status", nullable = false, length = 20)
	private EventStatus status;

	public void updateEventInfo(
		final String name,
		final String description,
		final LocalDate startDate,
		final LocalDate endDate,
		final LocalTime openTime,
		final LocalTime closeTime,
		final String locationAddress,
		final String thumbnailImageUrl
	) {
		this.name = name;
		this.description = description;
		this.startDate = startDate;
		this.endDate = endDate;
		this.openTime = openTime;
		this.closeTime = closeTime;
		this.locationAddress = locationAddress;
		this.thumbnailImageUrl = thumbnailImageUrl;
	}

	public void updateStatus(final EventStatus status) {
		this.status = status;
	}
}
