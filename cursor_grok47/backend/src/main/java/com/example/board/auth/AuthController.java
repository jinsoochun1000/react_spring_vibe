package com.example.board.auth;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.board.common.NotFoundException;
import com.example.board.security.JwtTokenProvider;
import com.example.board.user.AppUser;
import com.example.board.user.UserRepository;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

	private final AuthenticationManager authenticationManager;
	private final JwtTokenProvider jwtTokenProvider;
	private final UserRepository userRepository;

	public AuthController(
			AuthenticationManager authenticationManager,
			JwtTokenProvider jwtTokenProvider,
			UserRepository userRepository) {
		this.authenticationManager = authenticationManager;
		this.jwtTokenProvider = jwtTokenProvider;
		this.userRepository = userRepository;
	}

	@PostMapping("/login")
	public TokenResponse login(@Valid @RequestBody LoginRequest request) {
		authenticationManager.authenticate(
				new UsernamePasswordAuthenticationToken(request.username(), request.password()));
		String token = jwtTokenProvider.createToken(request.username());
		return new TokenResponse(token, "Bearer", request.username());
	}

	@GetMapping("/me")
	public MeResponse me(Authentication authentication) {
		AppUser user = userRepository.findByUsername(authentication.getName())
				.orElseThrow(() -> new NotFoundException("사용자를 찾을 수 없습니다."));
		return new MeResponse(user.getId(), user.getUsername());
	}

}
