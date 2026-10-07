package kr.co.tutorial.crud;

import java.security.Principal;
import java.util.Map;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AuthController {
    private final JdbcTemplate jdbc;
    public AuthController(JdbcTemplate jdbc) { this.jdbc = jdbc; }
    @GetMapping("/api/auth/csrf") public Map<String, String> csrf(CsrfToken token) {
        return Map.of("token", token.getToken(), "headerName", token.getHeaderName());
    }
    @GetMapping("/api/auth/me") public CurrentUser me(Principal principal) {
        return jdbc.queryForObject("SELECT USER_ID, USERNAME, EMAIL, ROLE FROM TB_USER WHERE USERNAME = ?",
            (r, n) -> new CurrentUser(r.getLong(1), r.getString(2), r.getString(3), r.getString(4)), principal.getName());
    }
    @GetMapping("/api/health") public Map<String, String> health() {
        jdbc.queryForObject("SELECT 1 FROM DUAL", Integer.class);
        return Map.of("status", "UP", "database", "connected");
    }
    public record CurrentUser(long id, String username, String email, String role) {}
}
