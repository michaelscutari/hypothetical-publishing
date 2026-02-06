package edu.duke.bookpublishing.support;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import edu.duke.bookpublishing.auth.User;
import edu.duke.bookpublishing.auth.UserRepository;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ErrorDispatchSecurityTest {

  @Autowired private MockMvc mockMvc;

  @Autowired private UserRepository userRepository;

  @Autowired private PasswordEncoder passwordEncoder;

  @BeforeEach
  void setUp() {
    userRepository.deleteAll();
    userRepository.save(
        User.builder().username("admin").password(passwordEncoder.encode("admin")).build());
  }

  private Cookie login() throws Exception {
    MvcResult result =
        mockMvc
            .perform(
                post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"username\":\"admin\",\"password\":\"admin\"}"))
            .andReturn();
    return result.getResponse().getCookie("token");
  }

  @Test
  void authenticatedRequestsKeepErrorStatusOnErrorDispatch() throws Exception {
    // Regression test: when a controller throws and the server forwards to /error,
    // security must not overwrite the original error status (e.g., 500) with 401.
    mockMvc
        .perform(get("/api/test/error-dispatch").cookie(login()))
        .andExpect(status().isInternalServerError());
  }
}
