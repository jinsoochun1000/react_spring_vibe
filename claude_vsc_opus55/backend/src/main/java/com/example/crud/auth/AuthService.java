package com.example.crud.auth;

import com.example.crud.auth.AuthDtos.LoginRequest;
import com.example.crud.auth.AuthDtos.SignupRequest;
import com.example.crud.auth.AuthDtos.TokenResponse;
import com.example.crud.auth.AuthDtos.UserResponse;
import com.example.crud.common.ApiException;
import com.example.crud.security.JwtTokenProvider;
import com.example.crud.user.Role;
import com.example.crud.user.User;
import com.example.crud.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder,
                       JwtTokenProvider jwtTokenProvider) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    public TokenResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.username())
                .filter(u -> passwordEncoder.matches(request.password(), u.getPassword()))
                .orElseThrow(() -> new BadCredentialsException("invalid credentials"));
        return issueToken(user);
    }

    @Transactional
    public UserResponse signup(SignupRequest request) {
        if (userRepository.existsByUsername(request.username())) {
            throw new ApiException(HttpStatus.CONFLICT, "이미 사용 중인 아이디입니다.");
        }
        if (userRepository.existsByEmail(request.email())) {
            throw new ApiException(HttpStatus.CONFLICT, "이미 사용 중인 이메일입니다.");
        }
        User user = new User(request.username(), passwordEncoder.encode(request.password()),
                request.email(), Role.USER);
        return UserResponse.from(userRepository.save(user));
    }

    public UserResponse me(String username) {
        return userRepository.findByUsername(username)
                .map(UserResponse::from)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "사용자 정보를 찾을 수 없습니다."));
    }

    private TokenResponse issueToken(User user) {
        String token = jwtTokenProvider.createToken(user.getUsername(), user.getRole());
        return new TokenResponse(token, "Bearer", jwtTokenProvider.getExpirationMs() / 1000,
                UserResponse.from(user));
    }
}
