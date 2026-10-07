package com.example.crud.user;

/** TB_USER.ROLE 컬럼 값 (Spring Security 권한명과 동일하게 ROLE_ 접두사 사용). */
public final class Role {

    public static final String USER = "ROLE_USER";
    public static final String ADMIN = "ROLE_ADMIN";

    private Role() {
    }
}
