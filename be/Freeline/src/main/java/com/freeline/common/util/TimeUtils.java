package com.freeline.common.util;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;

import lombok.experimental.UtilityClass;

@UtilityClass
public class TimeUtils {

    public static final String ASIA_SEOUL_ZONE_ID = "Asia/Seoul";
    private static final ZoneId ASIA_SEOUL = ZoneId.of(ASIA_SEOUL_ZONE_ID);
    private static final Clock ASIA_SEOUL_CLOCK = Clock.system(ASIA_SEOUL);

    public ZoneId zoneId() {
        return ASIA_SEOUL;
    }

    public Clock clock() {
        return ASIA_SEOUL_CLOCK;
    }

    public ZonedDateTime now() {
        return ZonedDateTime.now(ASIA_SEOUL_CLOCK);
    }

    public LocalDateTime nowDateTime() {
        return LocalDateTime.now(ASIA_SEOUL_CLOCK);
    }

    public LocalDate today() {
        return LocalDate.now(ASIA_SEOUL_CLOCK);
    }

    public LocalTime nowTime() {
        return LocalTime.now(ASIA_SEOUL_CLOCK);
    }
}