package kr.co.tutorial.crud;

import java.time.LocalDateTime;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.stereotype.Repository;

@Repository
public class PostRepository {
    public record Account(long id, String username, String email, String role) {}
    public record Post(long id, String title, String content, long userId, String username,
                       long viewCount, LocalDateTime createdAt, LocalDateTime updatedAt) {}
    public record Page(List<Post> items, long total, int page, int size, long totalPages) {}
    public record Stats(long total, long mine, long views) {}
    private final JdbcTemplate jdbc;
    private static final String SELECT = "SELECT p.*,u.USERNAME FROM TB_POST p JOIN TB_USER u ON u.USER_ID=p.USER_ID ";
    private static final RowMapper<Post> MAPPER = (rs, row) -> new Post(rs.getLong("POST_ID"), rs.getString("TITLE"),
        rs.getString("CONTENT"), rs.getLong("USER_ID"), rs.getString("USERNAME"), rs.getLong("VIEW_COUNT"),
        rs.getTimestamp("CREATED_AT").toLocalDateTime(), rs.getTimestamp("UPDATED_AT").toLocalDateTime());
    public PostRepository(JdbcTemplate jdbc) { this.jdbc = jdbc; }
    public Account account(String username) {
        return jdbc.queryForObject("SELECT USER_ID,USERNAME,EMAIL,ROLE FROM TB_USER WHERE USERNAME=?",
            (rs, row) -> new Account(rs.getLong(1), rs.getString(2), rs.getString(3), rs.getString(4)), username);
    }
    public Page list(String query, boolean mine, long userId, int page, int size, String sort) {
        String where = " WHERE (LOWER(p.TITLE) LIKE ? ESCAPE '\\' OR LOWER(u.USERNAME) LIKE ? ESCAPE '\\')";
        String pattern = "%" + query.toLowerCase(Locale.ROOT).replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%";
        List<Object> args = new ArrayList<>(List.of(pattern, pattern));
        if (mine) { where += " AND p.USER_ID=?"; args.add(userId); }
        Long total = jdbc.queryForObject("SELECT COUNT(*) FROM TB_POST p JOIN TB_USER u ON u.USER_ID=p.USER_ID" + where, Long.class, args.toArray());
        String order = "views".equals(sort) ? "p.VIEW_COUNT DESC,p.POST_ID DESC" : "p.POST_ID DESC";
        args.add((page - 1) * size); args.add(size);
        String listSelect = "SELECT p.POST_ID,p.TITLE,NULL AS CONTENT,p.USER_ID,p.VIEW_COUNT,p.CREATED_AT,p.UPDATED_AT,u.USERNAME FROM TB_POST p JOIN TB_USER u ON u.USER_ID=p.USER_ID";
        // Avoid fetching CLOBs at all when listing posts.
        var items = jdbc.query(listSelect + where + " ORDER BY " + order + " OFFSET ? ROWS FETCH NEXT ? ROWS ONLY", MAPPER, args.toArray());
        return new Page(items, total, page, size, (total + size - 1) / size);
    }
    public Optional<Post> find(long id) { return jdbc.query(SELECT + " WHERE p.POST_ID=?", MAPPER, id).stream().findFirst(); }
    public Stats stats(long userId) {
        return jdbc.queryForObject("SELECT COUNT(*),COALESCE(SUM(CASE WHEN USER_ID=? THEN 1 ELSE 0 END),0),COALESCE(SUM(VIEW_COUNT),0) FROM TB_POST",
            (rs, row) -> new Stats(rs.getLong(1), rs.getLong(2), rs.getLong(3)), userId);
    }
    public long create(String title, String content, long userId) {
        var key = new GeneratedKeyHolder();
        jdbc.update(connection -> {
            var ps = connection.prepareStatement("INSERT INTO TB_POST(TITLE,CONTENT,USER_ID) VALUES(?,?,?)", new String[]{"POST_ID"});
            ps.setString(1, title); ps.setCharacterStream(2, new java.io.StringReader(content), content.length()); ps.setLong(3, userId);
            return ps;
        }, key);
        return Objects.requireNonNull(key.getKey()).longValue();
    }
    public int update(long id, long userId, String title, String content) {
        return jdbc.update(connection -> {
            var ps = connection.prepareStatement("UPDATE TB_POST SET TITLE=?,CONTENT=?,UPDATED_AT=SYSTIMESTAMP WHERE POST_ID=? AND USER_ID=?");
            ps.setString(1,title); ps.setCharacterStream(2,new java.io.StringReader(content),content.length()); ps.setLong(3,id); ps.setLong(4,userId);
            return ps;
        });
    }
    public int delete(long id, long userId) { return jdbc.update("DELETE FROM TB_POST WHERE POST_ID=? AND USER_ID=?", id, userId); }
    public int view(long id) { return jdbc.update("UPDATE TB_POST SET VIEW_COUNT=VIEW_COUNT+1 WHERE POST_ID=?", id); }
}
