package kr.co.tutorial.crud;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Map;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.csrf.HttpSessionCsrfTokenRepository;

@Configuration
public class SecurityConfig {
    @Bean PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(); }

    @Bean UserDetailsService users(JdbcTemplate jdbc) {
        return username -> jdbc.query("SELECT USERNAME, PASSWORD, ROLE FROM TB_USER WHERE USERNAME = ?",
            (rs, n) -> User.withUsername(rs.getString("USERNAME")).password(rs.getString("PASSWORD"))
                .authorities(rs.getString("ROLE")).build(), username).stream().findFirst()
            .orElseThrow(() -> new UsernameNotFoundException("사용자를 찾을 수 없습니다."));
    }

    @Bean SecurityFilterChain security(HttpSecurity http, ObjectMapper mapper) throws Exception {
        http.authorizeHttpRequests(a -> a.requestMatchers("/api/auth/csrf", "/api/health", "/error").permitAll()
            .requestMatchers("/api/**").authenticated().anyRequest().permitAll())
            .csrf(c -> c.csrfTokenRepository(new HttpSessionCsrfTokenRepository()))
            .requestCache(c -> c.disable())
            .formLogin(f -> f.loginProcessingUrl("/api/auth/login")
                .successHandler((req, res, auth) -> json(mapper, res, 200, "로그인되었습니다."))
                .failureHandler((req, res, ex) -> json(mapper, res, 401, "아이디 또는 비밀번호를 확인해 주세요.")).permitAll())
            .logout(l -> l.logoutUrl("/api/auth/logout").invalidateHttpSession(true).deleteCookies("RECORD_SESSION")
                .logoutSuccessHandler((req, res, auth) -> json(mapper, res, 200, "로그아웃되었습니다.")))
            .exceptionHandling(e -> e.authenticationEntryPoint((req, res, ex) -> json(mapper, res, 401, "로그인이 필요합니다."))
                .accessDeniedHandler((req, res, ex) -> json(mapper, res, 403, "요청 권한 또는 보안 토큰을 확인해 주세요.")));
        return http.build();
    }

    private static void json(ObjectMapper mapper, HttpServletResponse res, int status, String message) throws IOException {
        res.setStatus(status); res.setContentType("application/json;charset=UTF-8");
        mapper.writeValue(res.getWriter(), Map.of("message", message));
    }
}
