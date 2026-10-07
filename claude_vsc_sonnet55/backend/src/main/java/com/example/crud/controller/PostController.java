package com.example.crud.controller;

import static com.example.crud.dto.Dtos.*;

import com.example.crud.service.PostService;
import jakarta.validation.Valid;
import java.net.URI;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/posts")
public class PostController {

    private final PostService postService;

    public PostController(PostService postService) {
        this.postService = postService;
    }

    @GetMapping
    public PageResponse<PostResponse> list(@RequestParam(defaultValue = "") String keyword,
                                           @RequestParam(defaultValue = "0") int page,
                                           @RequestParam(defaultValue = "10") int size) {
        return postService.list(keyword, page, Math.min(size, 50));
    }

    @GetMapping("/{id}")
    public PostResponse get(@PathVariable Long id) {
        return postService.get(id);
    }

    @PostMapping
    public ResponseEntity<PostResponse> create(@Valid @RequestBody PostRequest req, Authentication auth) {
        PostResponse created = postService.create(req, auth.getName());
        return ResponseEntity.created(URI.create("/api/posts/" + created.id())).body(created);
    }

    @PutMapping("/{id}")
    public PostResponse update(@PathVariable Long id, @Valid @RequestBody PostRequest req, Authentication auth) {
        return postService.update(id, req, auth);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, Authentication auth) {
        postService.delete(id, auth);
        return ResponseEntity.noContent().build();
    }
}
