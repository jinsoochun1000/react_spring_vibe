package com.example.crud.controller;

import static com.example.crud.dto.Dtos.*;

import com.example.crud.security.JwtProvider;
import jakarta.validation.Valid;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtProvider jwtProvider;

    public AuthController(AuthenticationManager authenticationManager, JwtProvider jwtProvider) {
        this.authenticationManager = authenticationManager;
        this.jwtProvider = jwtProvider;
    }

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest req) {
        Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.username(), req.password()));
        String role = auth.getAuthorities().iterator().next().getAuthority();
        return new LoginResponse(jwtProvider.create(auth.getName(), role), auth.getName(), role);
    }

    /** 토큰 유효성 확인용 */
    @GetMapping("/me")
    public LoginResponse me(Authentication auth) {
        return new LoginResponse(null, auth.getName(), auth.getAuthorities().iterator().next().getAuthority());
    }
}
