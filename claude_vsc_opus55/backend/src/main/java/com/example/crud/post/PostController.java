package com.example.crud.post;

import com.example.crud.common.PageResponse;
import com.example.crud.post.PostDtos.PostDetail;
import com.example.crud.post.PostDtos.PostRequest;
import com.example.crud.post.PostDtos.PostSummary;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;

@RestController
@RequestMapping("/api/posts")
public class PostController {

    private final PostService postService;

    public PostController(PostService postService) {
        this.postService = postService;
    }

    @GetMapping
    public PageResponse<PostSummary> list(
            @RequestParam(required = false) String keyword,
            @PageableDefault(size = 10, sort = "id", direction = Sort.Direction.DESC) Pageable pageable) {
        return postService.getPosts(keyword, pageable);
    }

    @GetMapping("/{id}")
    public PostDetail get(@PathVariable Long id) {
        return postService.getPost(id);
    }

    @PostMapping
    public ResponseEntity<PostDetail> create(@Valid @RequestBody PostRequest request,
                                             @AuthenticationPrincipal UserDetails principal) {
        PostDetail created = postService.create(request, principal.getUsername());
        return ResponseEntity.created(URI.create("/api/posts/" + created.id())).body(created);
    }

    @PutMapping("/{id}")
    public PostDetail update(@PathVariable Long id, @Valid @RequestBody PostRequest request,
                             @AuthenticationPrincipal UserDetails principal) {
        return postService.update(id, request, principal.getUsername());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, @AuthenticationPrincipal UserDetails principal) {
        postService.delete(id, principal.getUsername());
        return ResponseEntity.noContent().build();
    }
}
