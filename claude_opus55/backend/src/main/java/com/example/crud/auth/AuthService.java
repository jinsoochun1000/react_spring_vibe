package com.example.crud.auth;

import com.example.crud.auth.AuthDtos.LoginRequest;
import com.example.crud.auth.AuthDtos.SignupRequest;
import com.example.crud.auth.AuthDtos.TokenResponse;
import com.example.crud.auth.AuthDtos.UserResponse;
import com.example.crud.common.ApiException;
import com.example.crud.config.JwtProperties;
import com.example.crud.user.User;
import com.example.crud.user.UserRepository;
import java.time.Instant;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtEncoder jwtEncoder;
    private final JwtProperties jwtProperties;

    public TokenResponse login(LoginRequest req) {
        User user = userRepository.findByUsername(req.username())
            .filter(u -> passwordEncoder.matches(req.password(), u.getPassword()))
            .orElseThrow(() -> new BadCredentialsException("invalid credentials"));
        return issueToken(user);
    }

    @Transactional
    public UserResponse signup(SignupRequest req) {
        if (userRepository.existsByUsername(req.username())) {
            throw ApiException.conflict("이미 사용 중인 아이디입니다.");
        }
        if (userRepository.existsByEmail(req.email())) {
            throw ApiException.conflict("이미 사용 중인 이메일입니다.");
        }
        User user = User.builder()
            .username(req.username())
            .password(passwordEncoder.encode(req.password()))
            .email(req.email())
            .role("ROLE_USER")
            .build();
        return UserResponse.from(userRepository.save(user));
    }

    public UserResponse me(String username) {
        return userRepository.findByUsername(username)
            .map(UserResponse::from)
            .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "사용자를 찾을 수 없습니다."));
    }

    /** sub=username, uid=USER_ID, roles=[ROLE] 클레임을 담은 HS256 토큰 발급 */
    private TokenResponse issueToken(User user) {
        Instant now = Instant.now();
        long expiresIn = jwtProperties.expirationMinutes() * 60;
        JwtClaimsSet claims = JwtClaimsSet.builder()
            .issuer("crud-tutorial")
            .issuedAt(now)
            .expiresAt(now.plusSeconds(expiresIn))
            .subject(user.getUsername())
            .claim("uid", user.getId())
            .claim("roles", List.of(user.getRole()))
            .build();
        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        String token = jwtEncoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
        return new TokenResponse(token, "Bearer", expiresIn, UserResponse.from(user));
    }
}
