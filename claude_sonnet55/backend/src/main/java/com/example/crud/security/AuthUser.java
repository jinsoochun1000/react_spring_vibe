package com.example.crud.security;

/** JWT 에서 복원한 로그인 사용자 (SecurityContext 의 principal). */
public record AuthUser(Long id, String username, String role) {
    public boolean isAdmin() {
        return "ROLE_ADMIN".equals(role);
    }
}
