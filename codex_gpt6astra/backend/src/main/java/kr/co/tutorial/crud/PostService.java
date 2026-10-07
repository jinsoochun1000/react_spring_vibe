package kr.co.tutorial.crud;

import java.nio.charset.StandardCharsets;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PostService {
    private final PostRepository repository;
    public PostService(PostRepository repository) { this.repository = repository; }
    public PostRepository.Post get(long id) {
        return repository.find(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "게시글을 찾을 수 없습니다."));
    }
    @Transactional public PostRepository.Post create(String username, PostController.PostInput input) {
        validate(input);
        return get(repository.create(input.title().strip(), input.content().strip(), repository.account(username).id()));
    }
    @Transactional public PostRepository.Post update(long id, String username, PostController.PostInput input) {
        validate(input);
        long userId = repository.account(username).id();
        requireOwner(get(id), userId);
        if (repository.update(id, userId, input.title().strip(), input.content().strip()) != 1) throw missing();
        return get(id);
    }
    @Transactional public void delete(long id, String username) {
        long userId = repository.account(username).id();
        requireOwner(get(id), userId);
        if (repository.delete(id, userId) != 1) throw missing();
    }
    @Transactional public PostRepository.Post view(long id) {
        if (repository.view(id) != 1) throw missing();
        return get(id);
    }
    private void requireOwner(PostRepository.Post post, long userId) {
        if (post.userId() != userId) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "본인이 작성한 게시글만 변경할 수 있습니다.");
    }
    private ResponseStatusException missing() { return new ResponseStatusException(HttpStatus.NOT_FOUND, "게시글을 찾을 수 없습니다."); }
    private void validate(PostController.PostInput input) {
        if (input.title().strip().getBytes(StandardCharsets.UTF_8).length > 200)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "제목은 UTF-8 기준 200바이트 이하여야 합니다.");
    }
}
