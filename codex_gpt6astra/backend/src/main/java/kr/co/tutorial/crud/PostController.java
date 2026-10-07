package kr.co.tutorial.crud;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.net.URI;
import java.security.Principal;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/posts")
@Validated
public class PostController {
    public record PostInput(@NotBlank(message="제목을 입력해 주세요.") @Size(max=200) String title,
                            @NotBlank(message="내용을 입력해 주세요.") @Size(max=20000, message="내용은 20,000자 이하여야 합니다.") String content) {}
    private final PostRepository repository;
    private final PostService service;
    public PostController(PostRepository repository, PostService service) { this.repository=repository; this.service=service; }
    @GetMapping public PostRepository.Page list(Principal user,
        @RequestParam(defaultValue="") @Size(max=100) String query,
        @RequestParam(defaultValue="false") boolean mine,
        @RequestParam(defaultValue="1") @Min(1) @Max(1000000) int page,
        @RequestParam(defaultValue="8") @Min(1) @Max(50) int size,
        @RequestParam(defaultValue="latest") @Pattern(regexp="latest|views") String sort) {
        return repository.list(query.strip(), mine, repository.account(user.getName()).id(), page, size, sort);
    }
    @GetMapping("/stats") public PostRepository.Stats stats(Principal user) { return repository.stats(repository.account(user.getName()).id()); }
    @GetMapping("/{id}") public PostRepository.Post get(@PathVariable long id) { return service.get(id); }
    @PostMapping("/{id}/view") public PostRepository.Post view(@PathVariable long id) { return service.view(id); }
    @PostMapping public ResponseEntity<PostRepository.Post> create(Principal user, @Valid @RequestBody PostInput input) {
        var post = service.create(user.getName(), input);
        return ResponseEntity.created(URI.create("/api/posts/"+post.id())).body(post);
    }
    @PutMapping("/{id}") public PostRepository.Post update(@PathVariable long id, Principal user, @Valid @RequestBody PostInput input) {
        return service.update(id, user.getName(), input);
    }
    @DeleteMapping("/{id}") public ResponseEntity<Void> delete(@PathVariable long id, Principal user) {
        service.delete(id,user.getName()); return ResponseEntity.noContent().build();
    }
}
