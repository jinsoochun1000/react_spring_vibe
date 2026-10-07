package com.example.crud.auth;

import com.example.crud.security.AuthUser;
import com.example.crud.security.JwtService;
import com.example.crud.user.User;
import com.example.crud.user.UserRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    public record LoginRequest(@NotBlank(message = "아이디를 입력하세요") String username,
                               @NotBlank(message = "비밀번호를 입력하세요") String password) {}

    public record LoginResponse(String token, long expiresIn, AuthUser user) {}

    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final JwtService jwt;

    public AuthController(UserRepository users, PasswordEncoder encoder, JwtService jwt) {
        this.users = users;
        this.encoder = encoder;
        this.jwt = jwt;
    }

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest req) {
        User u = users.findByUsername(req.username())
                .filter(found -> encoder.matches(req.password(), found.getPassword()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "아이디 또는 비밀번호가 올바르지 않습니다"));
        AuthUser au = new AuthUser(u.getId(), u.getUsername(), u.getRole());
        return new LoginResponse(jwt.issue(au), jwt.expiresInSeconds(), au);
    }

    @GetMapping("/me")
    public AuthUser me(@AuthenticationPrincipal AuthUser user) {
        return user;
    }
}
