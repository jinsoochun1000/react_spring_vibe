package kr.co.tutorial.crud;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.nio.charset.StandardCharsets;
import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.SqlParameterValue;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.sql.Types;

@RestController
@RequestMapping("/api/posts")
public class PostController {
    private final JdbcTemplate jdbc;
    private static final String SELECT = "SELECT p.POST_ID, p.TITLE, p.CONTENT, p.USER_ID, u.USERNAME, p.VIEW_COUNT, p.CREATED_AT, p.UPDATED_AT FROM TB_POST p JOIN TB_USER u ON u.USER_ID = p.USER_ID ";
    private static final RowMapper<Post> MAPPER = (r, n) -> new Post(r.getLong("POST_ID"), r.getString("TITLE"), r.getString("CONTENT"), r.getLong("USER_ID"), r.getString("USERNAME"), r.getLong("VIEW_COUNT"), r.getTimestamp("CREATED_AT").toLocalDateTime(), r.getTimestamp("UPDATED_AT").toLocalDateTime());
    public PostController(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    @GetMapping public Page list(@RequestParam(defaultValue="") String q,
        @RequestParam(defaultValue="0") int page, @RequestParam(defaultValue="8") int size,
        @RequestParam(defaultValue="false") boolean mine, Principal principal) {
        if (page < 0 || page > 1000000 || size < 1 || size > 50 || q.length() > 100) throw bad("검색 조건을 확인해 주세요.");
        long userId = userId(principal);
        String where = "WHERE (INSTR(LOWER(p.TITLE), LOWER(?)) > 0 OR INSTR(LOWER(u.USERNAME), LOWER(?)) > 0 OR ? IS NULL)" + (mine ? " AND p.USER_ID = " + userId : "");
        String keyword = q.strip();
        long count = jdbc.queryForObject("SELECT COUNT(*) FROM TB_POST p JOIN TB_USER u ON u.USER_ID=p.USER_ID " + where, Long.class, keyword, keyword, keyword);
        List<Post> posts = jdbc.query(SELECT + where + " ORDER BY p.POST_ID DESC OFFSET ? ROWS FETCH NEXT ? ROWS ONLY", MAPPER, keyword, keyword, keyword, (long)page * size, size);
        long total = jdbc.queryForObject("SELECT COUNT(*) FROM TB_POST", Long.class);
        long myCount = jdbc.queryForObject("SELECT COUNT(*) FROM TB_POST WHERE USER_ID=?", Long.class, userId);
        long authors = jdbc.queryForObject("SELECT COUNT(DISTINCT USER_ID) FROM TB_POST", Long.class);
        return new Page(posts, count, page, size, (int)((count + size - 1)/size), total, myCount, authors);
    }

    @GetMapping("/{id}") @Transactional public Post detail(@PathVariable long id) {
        if (jdbc.update("UPDATE TB_POST SET VIEW_COUNT=VIEW_COUNT+1 WHERE POST_ID=?", id) == 0) throw missing();
        return find(id);
    }

    @PostMapping @ResponseStatus(HttpStatus.CREATED) @Transactional
    public Post create(@Valid @RequestBody PostInput input, Principal principal) {
        validate(input); long userId = userId(principal);
        var key = new GeneratedKeyHolder();
        jdbc.update(c -> {
            var s = c.prepareStatement("INSERT INTO TB_POST (TITLE, CONTENT, USER_ID) VALUES (?, ?, ?)", new String[]{"POST_ID"});
            s.setString(1, input.title().strip());
            s.setClob(2, new java.io.StringReader(input.content()));
            s.setLong(3, userId); return s;
        }, key);
        return find(key.getKey().longValue());
    }

    @PutMapping("/{id}") @Transactional public Post update(@PathVariable long id, @Valid @RequestBody PostInput input, Principal principal) {
        validate(input); assertOwner(id, principal);
        jdbc.update("UPDATE TB_POST SET TITLE=?, CONTENT=?, UPDATED_AT=SYSTIMESTAMP WHERE POST_ID=?",
            input.title().strip(), new SqlParameterValue(Types.CLOB, input.content()), id);
        return find(id);
    }

    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) @Transactional
    public void delete(@PathVariable long id, Principal principal) {
        assertOwner(id, principal); jdbc.update("DELETE FROM TB_POST WHERE POST_ID=?", id);
    }
    private void assertOwner(long id, Principal principal) {
        if (find(id).userId() != userId(principal)) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "작성자만 수정하거나 삭제할 수 있습니다.");
    }
    private long userId(Principal p) { return jdbc.queryForObject("SELECT USER_ID FROM TB_USER WHERE USERNAME=?", Long.class, p.getName()); }
    private Post find(long id) { return jdbc.query(SELECT + "WHERE p.POST_ID=?", MAPPER, id).stream().findFirst().orElseThrow(PostController::missing); }
    private static void validate(PostInput input) {
        if (input.title().strip().getBytes(StandardCharsets.UTF_8).length > 200) throw bad("제목은 UTF-8 기준 200바이트 이내로 입력해 주세요.");
    }
    private static ResponseStatusException bad(String message) { return new ResponseStatusException(HttpStatus.BAD_REQUEST, message); }
    private static ResponseStatusException missing() { return new ResponseStatusException(HttpStatus.NOT_FOUND, "게시글을 찾을 수 없습니다."); }
    public record PostInput(@NotBlank(message="제목을 입력해 주세요.") @Size(max=200) String title,
        @NotBlank(message="내용을 입력해 주세요.") @Size(max=20000, message="내용은 20,000자 이내로 입력해 주세요.") String content) {}
    public record Post(long id, String title, String content, long userId, String author, long viewCount, LocalDateTime createdAt, LocalDateTime updatedAt) {}
    public record Page(List<Post> items, long totalElements, int page, int size, int totalPages, long totalPosts, long myPosts, long authors) {}
}
