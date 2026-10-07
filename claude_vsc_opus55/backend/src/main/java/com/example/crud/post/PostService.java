package com.example.crud.post;

import com.example.crud.common.ApiException;
import com.example.crud.common.PageResponse;
import com.example.crud.post.PostDtos.PostDetail;
import com.example.crud.post.PostDtos.PostRequest;
import com.example.crud.post.PostDtos.PostSummary;
import com.example.crud.user.User;
import com.example.crud.user.UserRepository;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@Transactional(readOnly = true)
public class PostService {

    private final PostRepository postRepository;
    private final UserRepository userRepository;

    public PostService(PostRepository postRepository, UserRepository userRepository) {
        this.postRepository = postRepository;
        this.userRepository = userRepository;
    }

    public PageResponse<PostSummary> getPosts(String keyword, Pageable pageable) {
        String normalized = StringUtils.hasText(keyword) ? keyword.trim() : null;
        return PageResponse.of(postRepository.search(normalized, pageable).map(PostSummary::from));
    }

    /** 상세 조회 + 조회수 1 증가 */
    @Transactional
    public PostDetail getPost(Long id) {
        if (postRepository.increaseViewCount(id) == 0) {
            throw notFound(id);
        }
        return PostDetail.from(findPost(id));
    }

    @Transactional
    public PostDetail create(PostRequest request, String username) {
        User author = findUser(username);
        Post saved = postRepository.save(new Post(request.title(), request.content(), author));
        return PostDetail.from(saved);
    }

    @Transactional
    public PostDetail update(Long id, PostRequest request, String username) {
        Post post = findPost(id);
        checkOwner(post, findUser(username));
        post.update(request.title(), request.content());
        postRepository.flush(); // UPDATED_AT 반영 후 응답
        return PostDetail.from(post);
    }

    @Transactional
    public void delete(Long id, String username) {
        Post post = findPost(id);
        checkOwner(post, findUser(username));
        postRepository.delete(post);
    }

    private Post findPost(Long id) {
        return postRepository.findWithAuthorById(id).orElseThrow(() -> notFound(id));
    }

    private User findUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "사용자 정보를 찾을 수 없습니다."));
    }

    /** 작성자 본인 또는 관리자만 수정/삭제 가능 */
    private void checkOwner(Post post, User user) {
        if (!post.isWrittenBy(user) && !user.isAdmin()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "작성자 또는 관리자만 수정/삭제할 수 있습니다.");
        }
    }

    private ApiException notFound(Long id) {
        return new ApiException(HttpStatus.NOT_FOUND, "게시글을 찾을 수 없습니다. (id=" + id + ")");
    }
}
