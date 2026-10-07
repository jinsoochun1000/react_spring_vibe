package com.example.crud.post;

import com.example.crud.post.PostDtos.*;
import com.example.crud.security.AuthUser;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/posts")
public class PostController {

    private final PostService service;

    public PostController(PostService service) {
        this.service = service;
    }

    @GetMapping
    public PageResponse<PostSummary> list(@RequestParam(defaultValue = "") String keyword,
                                          @RequestParam(defaultValue = "0") int page,
                                          @RequestParam(defaultValue = "10") int size) {
        return service.list(keyword, page, size);
    }

    @GetMapping("/{id}")
    public PostDetail get(@PathVariable Long id, @RequestParam(defaultValue = "true") boolean countView) {
        return service.get(id, countView);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PostDetail create(@Valid @RequestBody PostRequest req, @AuthenticationPrincipal AuthUser me) {
        return service.create(req, me);
    }

    @PutMapping("/{id}")
    public PostDetail update(@PathVariable Long id, @Valid @RequestBody PostRequest req,
                             @AuthenticationPrincipal AuthUser me) {
        return service.update(id, req, me);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id, @AuthenticationPrincipal AuthUser me) {
        service.delete(id, me);
    }
}
