package com.example.crud.post;

import com.example.crud.common.ApiException;
import com.example.crud.common.PageResponse;
import com.example.crud.post.PostDtos.PostDetail;
import com.example.crud.post.PostDtos.PostRequest;
import com.example.crud.post.PostDtos.PostSummary;
import com.example.crud.user.User;
import com.example.crud.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PostService {

    private static final int MAX_PAGE_SIZE = 50;

    private final PostRepository postRepository;
    private final UserRepository userRepository;

    /** Read (목록) - 최신순, 페이지네이션, 제목 검색 */
    public PageResponse<PostSummary> list(int page, int size, String keyword) {
        PageRequest pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), MAX_PAGE_SIZE),
            Sort.by(Sort.Direction.DESC, "id"));
        Page<Post> result = StringUtils.hasText(keyword)
            ? postRepository.searchByTitle(keyword.trim(), pageable)
            : postRepository.findAllWithAuthor(pageable);
        return PageResponse.of(result, PostSummary::from);
    }

    /** Read (상세) - increaseView=true 이면 조회수 +1 */
    @Transactional
    public PostDetail get(Long id, boolean increaseView) {
        if (increaseView && postRepository.increaseViewCount(id) == 0) {
            throw ApiException.notFound("게시글을 찾을 수 없습니다.");
        }
        return PostDetail.from(findPost(id));
    }

    /** Create */
    @Transactional
    public PostDetail create(PostRequest req, Long userId) {
        User author = userRepository.findById(userId)
            .orElseThrow(() -> ApiException.notFound("사용자를 찾을 수 없습니다."));
        Post post = postRepository.saveAndFlush(Post.builder()
            .title(req.title().trim())
            .content(req.content())
            .author(author)
            .build());
        return PostDetail.from(post);
    }

    /** Update - 작성자 또는 ADMIN 만 */
    @Transactional
    public PostDetail update(Long id, PostRequest req, Long userId, boolean isAdmin) {
        Post post = findPost(id);
        checkOwner(post, userId, isAdmin);
        post.update(req.title().trim(), req.content());
        postRepository.flush(); // UPDATED_AT 을 응답에 반영하기 위해 즉시 flush
        return PostDetail.from(post);
    }

    /** Delete - 작성자 또는 ADMIN 만 */
    @Transactional
    public void delete(Long id, Long userId, boolean isAdmin) {
        Post post = findPost(id);
        checkOwner(post, userId, isAdmin);
        postRepository.delete(post);
    }

    private Post findPost(Long id) {
        return postRepository.findWithAuthorById(id)
            .orElseThrow(() -> ApiException.notFound("게시글을 찾을 수 없습니다."));
    }

    private void checkOwner(Post post, Long userId, boolean isAdmin) {
        if (!isAdmin && !post.isWrittenBy(userId)) {
            throw ApiException.forbidden("본인이 작성한 게시글만 수정/삭제할 수 있습니다.");
        }
    }
}
