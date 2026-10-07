package kr.co.tutorial.crud;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.userdetails.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;

@Configuration
public class SecurityConfig {
    @Bean PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(); }

    @Bean UserDetailsService users(JdbcTemplate jdbc) {
        return username -> jdbc.query("SELECT USERNAME,PASSWORD,ROLE FROM TB_USER WHERE USERNAME=?",
            (rs, row) -> User.withUsername(rs.getString("USERNAME"))
                .password(rs.getString("PASSWORD")).authorities(rs.getString("ROLE")).build(), username)
            .stream().findFirst().orElseThrow(() -> new UsernameNotFoundException("사용자를 찾을 수 없습니다."));
    }

    @Bean SecurityFilterChain security(HttpSecurity http) throws Exception {
        http.authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/csrf", "/api/auth/login", "/error", "/", "/index.html", "/assets/**", "/favicon.svg").permitAll()
                .anyRequest().authenticated())
            .csrf(csrf -> csrf.csrfTokenRequestHandler(new CsrfTokenRequestAttributeHandler()))
            .formLogin(form -> form.loginProcessingUrl("/api/auth/login")
                .successHandler((req, res, auth) -> res.setStatus(204))
                .failureHandler((req, res, ex) -> jsonError(res, 401, "아이디 또는 비밀번호가 올바르지 않습니다.")))
            .logout(logout -> logout.logoutUrl("/api/auth/logout")
                .logoutSuccessHandler((req, res, auth) -> res.setStatus(204))
                .deleteCookies("JSESSIONID"))
            .exceptionHandling(errors -> errors
                .authenticationEntryPoint((req, res, ex) -> jsonError(res, 401, "로그인이 필요합니다."))
                .accessDeniedHandler((req, res, ex) -> jsonError(res, 403, "요청 권한 또는 보안 토큰을 확인해 주세요.")));
        return http.build();
    }

    private static void jsonError(HttpServletResponse response, int status, String message) throws java.io.IOException {
        response.setStatus(status);
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write("{\"message\":\"" + message + "\"}");
    }
}
