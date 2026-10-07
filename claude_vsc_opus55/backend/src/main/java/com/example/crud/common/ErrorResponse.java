package com.example.crud.common;

import java.time.LocalDateTime;
import java.util.Map;

/** 모든 오류 응답의 공통 형식 */
public record ErrorResponse(
        int status,
        String message,
        Map<String, String> fieldErrors,
        LocalDateTime timestamp
) {
    public static ErrorResponse of(int status, String message) {
        return new ErrorResponse(status, message, Map.of(), LocalDateTime.now());
    }

    public static ErrorResponse of(int status, String message, Map<String, String> fieldErrors) {
        return new ErrorResponse(status, message, fieldErrors, LocalDateTime.now());
    }
}
