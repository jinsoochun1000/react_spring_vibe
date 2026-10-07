package kr.co.tutorial.crud;

import java.security.Principal;
import java.util.Map;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final PostRepository repository;
    public AuthController(PostRepository repository) { this.repository = repository; }
    @GetMapping("/csrf") public Map<String, String> csrf(CsrfToken token) {
        return Map.of("token", token.getToken(), "headerName", token.getHeaderName());
    }
    @GetMapping("/me") public PostRepository.Account me(Principal principal) {
        return repository.account(principal.getName());
    }
}
