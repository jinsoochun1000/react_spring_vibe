package com.example.crud.service;

import static com.example.crud.dto.Dtos.*;

import com.example.crud.entity.Post;
import com.example.crud.repository.PostRepository;
import com.example.crud.repository.UserRepository;
import java.util.NoSuchElementException;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class PostService {

    private final PostRepository postRepository;
    private final UserRepository userRepository;

    public PostService(PostRepository postRepository, UserRepository userRepository) {
        this.postRepository = postRepository;
        this.userRepository = userRepository;
    }

    public PageResponse<PostResponse> list(String keyword, int page, int size) {
        var pageable = PageRequest.of(Math.max(page, 0), Math.max(size, 1), Sort.by(Sort.Direction.DESC, "id"));
        var result = keyword.isBlank()
                ? postRepository.findAll(pageable)
                : postRepository.findByTitleContainingIgnoreCase(keyword.trim(), pageable);
        return PageResponse.of(result.map(PostResponse::of));
    }

    /** 상세 조회 시 조회수 1 증가 */
    @Transactional
    public PostResponse get(Long id) {
        if (postRepository.increaseViewCount(id) == 0) throw notFound(id);
        return PostResponse.of(postRepository.findWithAuthorById(id).orElseThrow(() -> notFound(id)));
    }

    @Transactional
    public PostResponse create(PostRequest req, String username) {
        var author = userRepository.findByUsername(username).orElseThrow();
        Post saved = postRepository.save(new Post(req.title(), req.content(), author));
        return PostResponse.of(postRepository.findWithAuthorById(saved.getId()).orElseThrow());
    }

    @Transactional
    public PostResponse update(Long id, PostRequest req, Authentication auth) {
        Post post = postRepository.findWithAuthorById(id).orElseThrow(() -> notFound(id));
        checkOwner(post, auth);
        post.update(req.title(), req.content());
        postRepository.flush();
        return PostResponse.of(post);
    }

    @Transactional
    public void delete(Long id, Authentication auth) {
        Post post = postRepository.findWithAuthorById(id).orElseThrow(() -> notFound(id));
        checkOwner(post, auth);
        postRepository.delete(post);
    }

    /** 작성자 본인 또는 ROLE_ADMIN 만 수정/삭제 가능 */
    private void checkOwner(Post post, Authentication auth) {
        boolean admin = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (!admin && !post.getAuthor().getUsername().equals(auth.getName())) {
            throw new AccessDeniedException("작성자 본인 또는 관리자만 수정/삭제할 수 있습니다.");
        }
    }

    private NoSuchElementException notFound(Long id) {
        return new NoSuchElementException("게시글을 찾을 수 없습니다. id=" + id);
    }
}
