package com.example.board.post;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.board.common.ForbiddenException;
import com.example.board.common.NotFoundException;
import com.example.board.user.AppUser;
import com.example.board.user.UserRepository;

@Service
@Transactional(readOnly = true)
public class PostService {

	private final PostRepository postRepository;
	private final UserRepository userRepository;

	public PostService(PostRepository postRepository, UserRepository userRepository) {
		this.postRepository = postRepository;
		this.userRepository = userRepository;
	}

	public PostPageResponse list(int page, int size) {
		Page<BoardPost> result = postRepository.findAll(
				PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
		List<PostResponse> content = result.getContent().stream().map(this::toResponse).toList();
		return new PostPageResponse(content, result.getNumber(), result.getSize(), result.getTotalElements(),
				result.getTotalPages());
	}

	public PostResponse get(Long id) {
		return toResponse(getPost(id));
	}

	@Transactional
	public PostResponse create(PostRequest request, String username) {
		BoardPost post = new BoardPost();
		post.setTitle(request.title().trim());
		post.setContent(request.content().trim());
		post.setAuthor(findUser(username));
		return toResponse(postRepository.save(post));
	}

	@Transactional
	public PostResponse update(Long id, PostRequest request, String username) {
		BoardPost post = getPost(id);
		assertAuthor(post, username);
		post.setTitle(request.title().trim());
		post.setContent(request.content().trim());
		return toResponse(postRepository.save(post));
	}

	@Transactional
	public void delete(Long id, String username) {
		BoardPost post = getPost(id);
		assertAuthor(post, username);
		postRepository.delete(post);
	}

	private BoardPost getPost(Long id) {
		return postRepository.findById(id)
				.orElseThrow(() -> new NotFoundException("글을 찾을 수 없습니다."));
	}

	private AppUser findUser(String username) {
		return userRepository.findByUsername(username)
				.orElseThrow(() -> new NotFoundException("사용자를 찾을 수 없습니다."));
	}

	private void assertAuthor(BoardPost post, String username) {
		if (!post.getAuthor().getUsername().equals(username)) {
			throw new ForbiddenException("본인 글만 수정하거나 삭제할 수 있습니다.");
		}
	}

	private PostResponse toResponse(BoardPost post) {
		return new PostResponse(
				post.getId(),
				post.getTitle(),
				post.getContent(),
				post.getAuthor().getUsername(),
				post.getCreatedAt(),
				post.getUpdatedAt());
	}

}
