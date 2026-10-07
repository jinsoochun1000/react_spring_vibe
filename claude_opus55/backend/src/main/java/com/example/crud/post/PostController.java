package com.example.crud.post;

import com.example.crud.common.PageResponse;
import com.example.crud.post.PostDtos.PostDetail;
import com.example.crud.post.PostDtos.PostRequest;
import com.example.crud.post.PostDtos.PostSummary;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;

    @GetMapping
    public PageResponse<PostSummary> list(@RequestParam(defaultValue = "0") int page,
                                          @RequestParam(defaultValue = "10") int size,
                                          @RequestParam(required = false) String keyword) {
        return postService.list(page, size, keyword);
    }

    /** increaseView=false 는 수정 화면처럼 조회수를 올리지 않아야 할 때 사용 */
    @GetMapping("/{id}")
    public PostDetail get(@PathVariable Long id, @RequestParam(defaultValue = "true") boolean increaseView) {
        return postService.get(id, increaseView);
    }

    @PostMapping
    public ResponseEntity<PostDetail> create(@Valid @RequestBody PostRequest req, @AuthenticationPrincipal Jwt jwt) {
        PostDetail created = postService.create(req, userId(jwt));
        return ResponseEntity.created(URI.create("/api/posts/" + created.id())).body(created);
    }

    @PutMapping("/{id}")
    public PostDetail update(@PathVariable Long id, @Valid @RequestBody PostRequest req,
                             @AuthenticationPrincipal Jwt jwt) {
        return postService.update(id, req, userId(jwt), isAdmin(jwt));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        postService.delete(id, userId(jwt), isAdmin(jwt));
        return ResponseEntity.noContent().build();
    }

    private static Long userId(Jwt jwt) {
        return ((Number) jwt.getClaim("uid")).longValue();
    }

    private static boolean isAdmin(Jwt jwt) {
        List<String> roles = jwt.getClaimAsStringList("roles");
        return roles != null && roles.contains("ROLE_ADMIN");
    }
}
