package com.example.crud.common;

import org.springframework.http.HttpStatus;

/** 비즈니스 예외. GlobalExceptionHandler 가 status/message 로 응답을 만든다. */
public class ApiException extends RuntimeException {

    private final HttpStatus status;

    public ApiException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
