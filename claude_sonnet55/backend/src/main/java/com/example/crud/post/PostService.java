package com.example.crud.post;

import com.example.crud.post.PostDtos.*;
import com.example.crud.security.AuthUser;
import com.example.crud.user.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional
public class PostService {

    private final PostRepository posts;
    private final UserRepository users;

    public PostService(PostRepository posts, UserRepository users) {
        this.posts = posts;
        this.users = users;
    }

    @Transactional(readOnly = true)
    public PageResponse<PostSummary> list(String keyword, int page, int size) {
        var pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 50),
                Sort.by(Sort.Direction.DESC, "createdAt", "id"));
        return PageResponse.of(posts.findByTitleContainingIgnoreCase(keyword == null ? "" : keyword.trim(), pageable),
                PostSummary::from);
    }

    /** 상세 조회 시 조회수 +1 (수정 화면 로딩 등은 countView=false). */
    public PostDetail get(Long id, boolean countView) {
        if (countView && posts.increaseViewCount(id) == 0) throw notFound();
        return PostDetail.from(posts.findWithAuthorById(id).orElseThrow(PostService::notFound));
    }

    public PostDetail create(PostRequest req, AuthUser me) {
        var author = users.getReferenceById(me.id());
        Post saved = posts.saveAndFlush(new Post(req.title(), req.content(), author));
        return PostDetail.from(posts.findWithAuthorById(saved.getId()).orElseThrow(PostService::notFound));
    }

    public PostDetail update(Long id, PostRequest req, AuthUser me) {
        Post post = owned(id, me);
        post.update(req.title(), req.content());
        posts.flush();
        return PostDetail.from(post);
    }

    public void delete(Long id, AuthUser me) {
        posts.delete(owned(id, me));
    }

    /** 작성자 본인 또는 관리자만 수정/삭제 가능. */
    private Post owned(Long id, AuthUser me) {
        Post post = posts.findWithAuthorById(id).orElseThrow(PostService::notFound);
        if (!me.isAdmin() && !post.getAuthor().getId().equals(me.id())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "작성자만 수정/삭제할 수 있습니다");
        }
        return post;
    }

    private static ResponseStatusException notFound() {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, "게시글을 찾을 수 없습니다");
    }
}
