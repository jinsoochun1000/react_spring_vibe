package com.example.board.user;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class UserSeed implements ApplicationRunner {

	private static final Logger log = LoggerFactory.getLogger(UserSeed.class);

	private final UserRepository userRepository;
	private final PasswordEncoder passwordEncoder;

	public UserSeed(UserRepository userRepository, PasswordEncoder passwordEncoder) {
		this.userRepository = userRepository;
		this.passwordEncoder = passwordEncoder;
	}

	@Override
	public void run(ApplicationArguments args) {
		if (userRepository.existsByUsername("guest01")) {
			return;
		}
		AppUser user = new AppUser();
		user.setUsername("guest01");
		user.setPassword(passwordEncoder.encode("password123!"));
		user.setRole("USER");
		userRepository.save(user);
		log.info("Seeded user guest01");
	}

}
