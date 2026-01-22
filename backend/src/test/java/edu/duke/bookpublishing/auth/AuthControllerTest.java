package edu.duke.bookpublishing.auth;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

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
class AuthControllerTest {

  @Autowired private MockMvc mockMvc;

  @Autowired private UserRepository userRepository;

  @Autowired private PasswordEncoder passwordEncoder;

  @BeforeEach
  void setUp() {
    userRepository.deleteAll();
    userRepository.save(
        User.builder().username("admin").password(passwordEncoder.encode("admin")).build());
  }

  @Test
  void loginWithValidCredentials() throws Exception {
    MvcResult result =
        mockMvc
            .perform(
                post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"username\":\"admin\",\"password\":\"admin\"}"))
            .andExpect(status().isOk())
            .andReturn();

    Cookie tokenCookie = result.getResponse().getCookie("token");
    assertNotNull(tokenCookie);
    assertTrue(tokenCookie.isHttpOnly());
  }

  @Test
  void loginWithInvalidPassword() throws Exception {
    mockMvc
        .perform(
            post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"admin\",\"password\":\"wrong\"}"))
        .andExpect(status().isUnauthorized());
  }

  @Test
  void loginWithInvalidUsername() throws Exception {
    mockMvc
        .perform(
            post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"nonexistent\",\"password\":\"admin\"}"))
        .andExpect(status().isUnauthorized());
  }

  @Test
  void meEndpointRequiresAuth() throws Exception {
    mockMvc.perform(get("/api/auth/me")).andExpect(status().isUnauthorized());
  }

  @Test
  void meEndpointReturnsUsername() throws Exception {
    Cookie token = login();
    mockMvc
        .perform(get("/api/auth/me").cookie(token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.username").value("admin"));
  }

  @Test
  void logoutClearsCookie() throws Exception {
    Cookie token = login();
    MvcResult result = mockMvc.perform(post("/api/auth/logout").cookie(token)).andReturn();

    Cookie clearedCookie = result.getResponse().getCookie("token");
    assertNotNull(clearedCookie);
    assertEquals(0, clearedCookie.getMaxAge());
  }

  @Test
  void logoutWithoutAuthClearsCookie() throws Exception {
    MvcResult result = mockMvc.perform(post("/api/auth/logout")).andReturn();

    Cookie clearedCookie = result.getResponse().getCookie("token");
    assertNotNull(clearedCookie);
    assertEquals(0, clearedCookie.getMaxAge());
  }

  @Test
  void protectedEndpointRequiresAuth() throws Exception {
    mockMvc.perform(get("/api/test")).andExpect(status().isUnauthorized());
  }

  @Test
  void protectedEndpointWithAuth() throws Exception {
    Cookie token = login();
    mockMvc.perform(get("/api/test").cookie(token)).andExpect(status().isOk());
  }

  @Test
  void protectedEndpointWithInvalidToken() throws Exception {
    Cookie invalidToken = new Cookie("token", "not-a-valid-jwt");
    mockMvc.perform(get("/api/test").cookie(invalidToken)).andExpect(status().isUnauthorized());
  }

  @Test
  void changePasswordRejectsWrongCurrentPassword() throws Exception {
    Cookie token = login();
    mockMvc
        .perform(
            put("/api/auth/password")
                .cookie(token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    "{\"currentPassword\":\"wrong\",\"newPassword\":\"newpass\",\"confirmPassword\":\"newpass\"}"))
        .andExpect(status().isBadRequest());
  }

  @Test
  void changePasswordRejectsMismatchedPasswords() throws Exception {
    Cookie token = login();
    mockMvc
        .perform(
            put("/api/auth/password")
                .cookie(token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    "{\"currentPassword\":\"admin\",\"newPassword\":\"newpass\",\"confirmPassword\":\"different\"}"))
        .andExpect(status().isBadRequest());
  }

  @Test
  void changePasswordUpdatesPassword() throws Exception {
    Cookie token = login();
    mockMvc
        .perform(
            put("/api/auth/password")
                .cookie(token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    "{\"currentPassword\":\"admin\",\"newPassword\":\"newpass\",\"confirmPassword\":\"newpass\"}"))
        .andExpect(status().isOk());

    mockMvc
        .perform(
            post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"admin\",\"password\":\"newpass\"}"))
        .andExpect(status().isOk());
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
}
