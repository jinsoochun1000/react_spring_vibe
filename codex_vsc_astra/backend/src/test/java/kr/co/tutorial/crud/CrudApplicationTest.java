package kr.co.tutorial.crud;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(properties={
    "spring.datasource.url=jdbc:h2:mem:crud;MODE=Oracle;DB_CLOSE_DELAY=-1",
    "spring.datasource.username=sa", "spring.datasource.password=",
    "spring.datasource.driver-class-name=org.h2.Driver", "spring.sql.init.mode=always",
    "spring.sql.init.schema-locations=classpath:schema-test.sql"})
@AutoConfigureMockMvc
class CrudApplicationTest {
    @Autowired MockMvc mvc;
    @Autowired JdbcTemplate jdbc;
    @Autowired PasswordEncoder encoder;
    @Autowired ObjectMapper mapper;
    @BeforeEach void setup() {
        jdbc.update("DELETE FROM TB_POST"); jdbc.update("DELETE FROM TB_USER");
        jdbc.update("INSERT INTO TB_USER(USER_ID,USERNAME,PASSWORD,EMAIL,ROLE) VALUES(1,'guest01',?,'guest@example.com','ROLE_USER')", encoder.encode("password123!"));
        jdbc.update("INSERT INTO TB_USER(USER_ID,USERNAME,PASSWORD,EMAIL,ROLE) VALUES(2,'other',?,'other@example.com','ROLE_USER')", encoder.encode("other-password"));
    }
    @Test void loginSessionLogoutAndWrongPassword() throws Exception {
        mvc.perform(get("/api/posts")).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/auth/login").with(csrf()).param("username","guest01").param("password","wrong")).andExpect(status().isUnauthorized());
        var result = mvc.perform(post("/api/auth/login").with(csrf()).param("username","guest01").param("password","password123!"))
            .andExpect(status().isOk()).andReturn();
        var session = (MockHttpSession) result.getRequest().getSession(false);
        mvc.perform(get("/api/auth/me").session(session)).andExpect(status().isOk()).andExpect(jsonPath("$.username").value("guest01")).andExpect(jsonPath("$.password").doesNotExist());
        mvc.perform(post("/api/auth/logout").session(session).with(csrf())).andExpect(status().isOk());
        assertTrue(session.isInvalid());
    }
    @Test void csrfAndOwnershipAreEnforced() throws Exception {
        mvc.perform(post("/api/posts").with(user("guest01")).contentType("application/json").content(body("title","body"))).andExpect(status().isForbidden());
        long id = create("다른 사람의 글", "보존할 내용");
        mvc.perform(put("/api/posts/"+id).with(user("other")).with(csrf()).contentType("application/json").content(body("hack","hack"))).andExpect(status().isForbidden());
        mvc.perform(delete("/api/posts/"+id).with(user("other")).with(csrf())).andExpect(status().isForbidden());
        assertEquals("다른 사람의 글", jdbc.queryForObject("SELECT TITLE FROM TB_POST WHERE POST_ID=?",String.class,id));
    }
    @Test void koreanCrudSearchPaginationAndViewCount() throws Exception {
        long id = create("한글 제목", "한글 본문\n두 번째 줄 🙂");
        mvc.perform(get("/api/posts").with(user("guest01")).param("q","한글").param("mine","true").param("size","1"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(1)).andExpect(jsonPath("$.items[0].title").value("한글 제목"));
        mvc.perform(get("/api/posts/"+id).with(user("guest01"))).andExpect(status().isOk()).andExpect(jsonPath("$.viewCount").value(1));
        mvc.perform(put("/api/posts/"+id).with(user("guest01")).with(csrf()).contentType("application/json").content(body("수정 제목","수정 내용")))
            .andExpect(status().isOk()).andExpect(jsonPath("$.content").value("수정 내용"));
        mvc.perform(delete("/api/posts/"+id).with(user("guest01")).with(csrf())).andExpect(status().isNoContent());
        mvc.perform(get("/api/posts/"+id).with(user("guest01"))).andExpect(status().isNotFound());
    }
    @Test void invalidInputAndLiteralSearch() throws Exception {
        for (String title : new String[]{" ", "가".repeat(67)}) mvc.perform(post("/api/posts").with(user("guest01")).with(csrf()).contentType("application/json").content(body(title,"내용"))).andExpect(status().isBadRequest());
        mvc.perform(post("/api/posts").with(user("guest01")).with(csrf()).contentType("application/json").content(body("제목","x".repeat(20001)))).andExpect(status().isBadRequest());
        create("정상 제목", "내용");
        mvc.perform(get("/api/posts").with(user("guest01")).param("q","' OR 1=1 --")).andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(0));
        mvc.perform(get("/api/posts").with(user("guest01")).param("page","-1")).andExpect(status().isBadRequest());
        mvc.perform(get("/api/posts").with(user("guest01")).param("size","100")).andExpect(status().isBadRequest());
    }
    private long create(String title, String content) throws Exception {
        String response = mvc.perform(post("/api/posts").with(user("guest01")).with(csrf()).contentType("application/json").content(body(title,content)))
            .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString(java.nio.charset.StandardCharsets.UTF_8);
        return mapper.readTree(response).get("id").asLong();
    }
    private String body(String title, String content) throws Exception { return mapper.writeValueAsString(Map.of("title",title,"content",content)); }
}
