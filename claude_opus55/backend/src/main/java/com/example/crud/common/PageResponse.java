package com.example.crud.common;

import java.util.List;
import java.util.function.Function;
import org.springframework.data.domain.Page;

/** Spring Data Page 를 프론트엔드가 쓰기 쉬운 고정 JSON 구조로 변환 */
public record PageResponse<T>(List<T> content, int page, int size, long totalElements, int totalPages) {

    public static <E, T> PageResponse<T> of(Page<E> page, Function<E, T> mapper) {
        return new PageResponse<>(page.getContent().stream().map(mapper).toList(),
            page.getNumber(), page.getSize(), page.getTotalElements(), page.getTotalPages());
    }
}
