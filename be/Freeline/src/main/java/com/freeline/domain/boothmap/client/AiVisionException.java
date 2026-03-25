package com.freeline.domain.boothmap.client;

public class AiVisionException extends RuntimeException {
    public AiVisionException(String message) {
        super(message);
    }

    public AiVisionException(String message, Throwable cause) {
        super(message, cause);
    }
}
