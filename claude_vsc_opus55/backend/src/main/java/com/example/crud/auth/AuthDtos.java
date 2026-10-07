package com.example.crud.auth;

import com.example.crud.user.User;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public final class AuthDtos {

    private AuthDtos() {
    }

    public record LoginRequest(
            @NotBlank(message = "아이디를 입력하세요.") String username,
            @NotBlank(message = "비밀번호를 입력하세요.") String password
    ) {
    }

    public record SignupRequest(
            @NotBlank(message = "아이디를 입력하세요.")
            @Pattern(regexp = "^[a-zA-Z0-9_]{4,50}$", message = "아이디는 영문/숫자/_ 4~50자입니다.")
            String username,

            @NotBlank(message = "비밀번호를 입력하세요.")
            @Size(min = 8, max = 100, message = "비밀번호는 8자 이상입니다.")
            String password,

            @NotBlank(message = "이메일을 입력하세요.")
            @Email(message = "이메일 형식이 올바르지 않습니다.")
            @Size(max = 100)
            String email
    ) {
    }

    public record TokenResponse(String accessToken, String tokenType, long expiresIn, UserResponse user) {
    }

    public record UserResponse(Long id, String username, String email, String role) {
        public static UserResponse from(User user) {
            return new UserResponse(user.getId(), user.getUsername(), user.getEmail(), user.getRole());
        }
    }
}
