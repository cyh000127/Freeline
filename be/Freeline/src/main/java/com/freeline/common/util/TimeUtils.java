package com.freeline.common.util;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

import lombok.experimental.UtilityClass;

@UtilityClass
public class TimeUtils {
    public LocalDateTime nowDateTime() {
        return LocalDateTime.now();
    }

    public LocalDate today() {
        return LocalDate.now();
    }

    public LocalTime nowTime() {
        return LocalTime.now();
    }
}
