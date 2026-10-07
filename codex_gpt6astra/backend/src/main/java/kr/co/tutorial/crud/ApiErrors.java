package kr.co.tutorial.crud;

import java.util.Map;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
public class ApiErrors {
    private static final Logger log = LoggerFactory.getLogger(ApiErrors.class);
    @ExceptionHandler(ResponseStatusException.class) ResponseEntity<?> status(ResponseStatusException e) {
        return ResponseEntity.status(e.getStatusCode()).body(Map.of("message", e.getReason() == null ? "요청을 처리할 수 없습니다." : e.getReason()));
    }
    @ExceptionHandler(MethodArgumentNotValidException.class) ResponseEntity<?> invalid(MethodArgumentNotValidException e) {
        return ResponseEntity.badRequest().body(Map.of("message", e.getBindingResult().getAllErrors().get(0).getDefaultMessage()));
    }
    @ExceptionHandler({ConstraintViolationException.class, HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class})
    ResponseEntity<?> invalidRequest(Exception e) { return ResponseEntity.badRequest().body(Map.of("message", "입력값 또는 조회 조건을 확인해 주세요.")); }
    @ExceptionHandler(DataAccessException.class) ResponseEntity<?> database(DataAccessException e) {
        log.error("Database operation failed: {}", e.getClass().getSimpleName());
        return ResponseEntity.status(503).body(Map.of("message", "데이터베이스 연결 또는 처리에 실패했습니다. 잠시 후 다시 시도해 주세요."));
    }
}
