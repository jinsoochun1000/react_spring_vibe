package kr.co.tutorial.crud;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import java.util.Map;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CrudApiTest {
    @Autowired MockMvc mvc;
    @Autowired JdbcTemplate jdbc;
    @Autowired PasswordEncoder passwords;
    @Autowired ObjectMapper json;
    @BeforeEach void seed() {
        jdbc.update("DELETE FROM TB_POST"); jdbc.update("DELETE FROM TB_USER");
        jdbc.update("INSERT INTO TB_USER(USER_ID,USERNAME,PASSWORD,EMAIL) VALUES(?,?,?,?)", 1, "guest01", passwords.encode("test-only-password"), "guest@test.local");
        jdbc.update("INSERT INTO TB_USER(USER_ID,USERNAME,PASSWORD,EMAIL) VALUES(?,?,?,?)", 2, "other", passwords.encode("other-password"), "other@test.local");
    }
    String body(String title, String content) throws Exception { return json.writeValueAsString(Map.of("title", title, "content", content)); }
    long create(String title) throws Exception {
        var response = mvc.perform(post("/api/posts").with(user("guest01")).with(csrf()).contentType("application/json").content(body(title, "한글 내용\n두 번째 줄")))
            .andExpect(status().isCreated()).andExpect(jsonPath("$.username").value("guest01")).andReturn().getResponse();
        return json.readTree(response.getContentAsString()).get("id").asLong();
    }
    @Test void loginSessionAndLogout() throws Exception {
        mvc.perform(get("/api/posts")).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/auth/login").with(csrf()).param("username", "guest01").param("password", "wrong"))
            .andExpect(status().isUnauthorized());
        var session = (MockHttpSession) mvc.perform(post("/api/auth/login").with(csrf()).param("username", "guest01").param("password", "test-only-password"))
            .andExpect(status().isNoContent()).andReturn().getRequest().getSession(false);
        assertNotNull(session);
        mvc.perform(get("/api/auth/me").session(session)).andExpect(status().isOk()).andExpect(jsonPath("$.username").value("guest01")).andExpect(jsonPath("$.password").doesNotExist());
        mvc.perform(post("/api/auth/logout").session(session).with(csrf())).andExpect(status().isNoContent());
        assertTrue(session.isInvalid());
    }
    @Test void koreanCrudAndViews() throws Exception {
        long id = create("한글 CRUD 테스트");
        mvc.perform(get("/api/posts/"+id).with(user("guest01"))).andExpect(jsonPath("$.content").value("한글 내용\n두 번째 줄")).andExpect(jsonPath("$.viewCount").value(0));
        mvc.perform(post("/api/posts/"+id+"/view").with(user("guest01")).with(csrf())).andExpect(jsonPath("$.viewCount").value(1));
        mvc.perform(put("/api/posts/"+id).with(user("guest01")).with(csrf()).contentType("application/json").content(body("수정한 한글 제목", "수정한 내용")))
            .andExpect(status().isOk()).andExpect(jsonPath("$.title").value("수정한 한글 제목"));
        mvc.perform(delete("/api/posts/"+id).with(user("guest01")).with(csrf())).andExpect(status().isNoContent());
        mvc.perform(get("/api/posts/"+id).with(user("guest01"))).andExpect(status().isNotFound());
    }
    @Test void forbidsOtherAuthorsAndMissingCsrf() throws Exception {
        long id = create("소유권 테스트");
        mvc.perform(put("/api/posts/"+id).with(user("other")).with(csrf()).contentType("application/json").content(body("변경 시도", "내용"))).andExpect(status().isForbidden());
        mvc.perform(delete("/api/posts/"+id).with(user("other")).with(csrf())).andExpect(status().isForbidden());
        mvc.perform(delete("/api/posts/"+id).with(user("guest01"))).andExpect(status().isForbidden());
        assertEquals(1, jdbc.queryForObject("SELECT COUNT(*) FROM TB_POST WHERE POST_ID=?", Integer.class,id));
    }
    @Test void validatesUtf8LengthBlankContentAndPaging() throws Exception {
        mvc.perform(post("/api/posts").with(user("guest01")).with(csrf()).contentType("application/json").content(body("한".repeat(67), "내용"))).andExpect(status().isBadRequest());
        mvc.perform(post("/api/posts").with(user("guest01")).with(csrf()).contentType("application/json").content(body("제목", "   "))).andExpect(status().isBadRequest());
        mvc.perform(get("/api/posts?page=0").with(user("guest01"))).andExpect(status().isBadRequest());
        mvc.perform(get("/api/posts?size=5000").with(user("guest01"))).andExpect(status().isBadRequest());
        mvc.perform(get("/api/posts?sort=bad").with(user("guest01"))).andExpect(status().isBadRequest());
        create("한".repeat(66));
    }
    @Test void searchPaginationMineAndLiteralWildcards() throws Exception {
        create("한글 100% 기록"); create("다른 한글 기록");
        mvc.perform(get("/api/posts").param("query", "한글").param("size", "1").param("page", "2").with(user("guest01")))
            .andExpect(jsonPath("$.total").value(2)).andExpect(jsonPath("$.items.length()").value(1)).andExpect(jsonPath("$.totalPages").value(2));
        mvc.perform(get("/api/posts").param("query", "%").with(user("guest01"))).andExpect(jsonPath("$.total").value(1));
        mvc.perform(get("/api/posts?mine=true").with(user("other"))).andExpect(jsonPath("$.total").value(0));
        mvc.perform(get("/api/posts/stats").with(user("guest01"))).andExpect(jsonPath("$.total").value(2)).andExpect(jsonPath("$.mine").value(2));
    }
}
