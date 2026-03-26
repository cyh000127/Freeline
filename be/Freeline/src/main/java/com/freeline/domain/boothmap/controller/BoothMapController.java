package com.freeline.domain.boothmap.controller;

import jakarta.validation.Valid;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import lombok.RequiredArgsConstructor;

import com.freeline.common.response.BaseResponse;
import com.freeline.common.util.ResponseUtils;
import com.freeline.domain.boothmap.dto.request.BoothMapAreaBulkUpsertReqDto;
import com.freeline.domain.boothmap.dto.request.MappingSnapshotUpdateReqDto;
import com.freeline.domain.boothmap.dto.response.BoothMapResDto;
import com.freeline.domain.boothmap.dto.response.EventMapUploadResDto;
import com.freeline.domain.boothmap.service.BoothMapService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "BoothMap", description = "Booth map APIs")
@RestController
@RequestMapping("/api/v1/boothmaps")
@RequiredArgsConstructor
public class BoothMapController {

    private final BoothMapService boothMapService;

    @Operation(summary = "Upload event map image", description = "Uploads a map image and returns AI analyzed draft boxes.")
    @PreAuthorize("hasRole('EVENT_ADMIN')")
    @PostMapping(value = "/events/{eventId}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<BaseResponse<EventMapUploadResDto>> upsertEventMap(
            final Authentication authentication,
            @PathVariable final Long eventId,
            @RequestPart("file") final MultipartFile file,
            @RequestParam(defaultValue = "true") final Boolean isVisible
    ) {
        final EventMapUploadResDto response = boothMapService.upsertEventMap(
                extractId(authentication),
                eventId,
                file,
                Boolean.TRUE.equals(isVisible)
        );
        return ResponseUtils.ok(response);
    }

    @Operation(summary = "Get booth map", description = "Returns the map image, confirmed booth areas, and mapping snapshot.")
    @PreAuthorize("hasRole('EVENT_ADMIN')")
    @GetMapping("/events/{eventId}")
    public ResponseEntity<BaseResponse<BoothMapResDto>> getBoothMap(
            final Authentication authentication,
            @PathVariable final Long eventId
    ) {
        final BoothMapResDto response = boothMapService.getBoothMap(extractId(authentication), eventId);
        return ResponseUtils.ok(response);
    }

    @Operation(summary = "Save mapping snapshot", description = "Stores the in-progress booth mapping snapshot.")
    @PreAuthorize("hasRole('EVENT_ADMIN')")
    @PutMapping("/events/{eventId}/snapshot")
    public ResponseEntity<BaseResponse<Void>> saveMappingSnapshot(
            final Authentication authentication,
            @PathVariable final Long eventId,
            @Valid @RequestBody final MappingSnapshotUpdateReqDto request
    ) {
        boothMapService.updateMappingSnapshot(extractId(authentication), eventId, request);
        return ResponseUtils.ok(null);
    }

    @Operation(summary = "Bulk save booth areas", description = "Saves all booth areas for the selected event map.")
    @PreAuthorize("hasRole('EVENT_ADMIN')")
    @PutMapping("/events/{eventId}/areas/bulk")
    public ResponseEntity<BaseResponse<Void>> bulkUpsertBoothMapAreas(
            final Authentication authentication,
            @PathVariable final Long eventId,
            @Valid @RequestBody final BoothMapAreaBulkUpsertReqDto request
    ) {
        boothMapService.bulkUpsertBoothMapAreas(extractId(authentication), eventId, request);
        return ResponseUtils.ok(null);
    }

    private Long extractId(final Authentication authentication) {
        return Long.valueOf(authentication.getName());
    }
}
