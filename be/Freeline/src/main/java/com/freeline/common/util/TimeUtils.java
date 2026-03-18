package com.freeline.common.util;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

import org.springframework.stereotype.Component;

@Component
public class TimeUtils {

    public static LocalDateTime now() {
        return LocalDateTime.now();
    }

    public static LocalDateTime nowDateTime() {
        return LocalDateTime.now();
    }

    public static LocalDate today() {
        return LocalDate.now();
    }

    public static LocalTime nowTime() {
        return LocalTime.now();
    }
}
