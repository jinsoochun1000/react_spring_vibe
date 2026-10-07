package com.example.crud.common;

import org.springframework.data.domain.Page;

import java.util.List;

/** Spring Page 를 프론트에서 쓰기 쉬운 고정 형태로 변환 (page 는 0부터 시작) */
public record PageResponse<T>(
        List<T> content,
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean first,
        boolean last
) {
    public static <T> PageResponse<T> of(Page<T> page) {
        return new PageResponse<>(page.getContent(), page.getNumber(), page.getSize(),
                page.getTotalElements(), page.getTotalPages(), page.isFirst(), page.isLast());
    }
}
