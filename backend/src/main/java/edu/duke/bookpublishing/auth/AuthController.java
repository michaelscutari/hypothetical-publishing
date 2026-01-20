package edu.duke.bookpublishing.auth;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.security.Principal;
import java.time.Duration;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

  private static final String TOKEN_COOKIE_NAME = "token";

  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;
  private final JwtUtil jwtUtil;

  @Value("${app.jwt-expiration-hours:24}")
  private long expirationHours;

  @Value("${app.cookie-secure:false}")
  private boolean cookieSecure;

  @PostMapping("/login")
  public ResponseEntity<?> login(
      @Valid @RequestBody LoginRequest request, jakarta.servlet.http.HttpServletResponse response) {

    User user =
        userRepository
            .findByUsername(request.username())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));

    if (!passwordEncoder.matches(request.password(), user.getPassword())) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
    }

    String token = jwtUtil.generateToken(user.getUsername());

    response.addHeader(
        HttpHeaders.SET_COOKIE,
        buildAuthCookie(token, Duration.ofHours(expirationHours)).toString());
    return ResponseEntity.ok().build();
  }

  @PostMapping("/logout")
  public ResponseEntity<?> logout(jakarta.servlet.http.HttpServletResponse response) {
    response.addHeader(
        HttpHeaders.SET_COOKIE, buildAuthCookie("", Duration.ZERO).toString());
    return ResponseEntity.ok().build();
  }

  @GetMapping("/me")
  public ResponseEntity<?> me(Principal principal) {
    if (principal == null) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }
    return ResponseEntity.ok(new UserResponse(principal.getName()));
  }

  @PutMapping("/password")
  public ResponseEntity<?> changePassword(
      @Valid @RequestBody ChangePasswordRequest request, Principal principal) {

    if (principal == null) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }

    User user =
        userRepository
            .findByUsername(principal.getName())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

    if (!passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Current password incorrect");
    }

    if (!request.newPassword().equals(request.confirmPassword())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Passwords do not match");
    }

    user.setPassword(passwordEncoder.encode(request.newPassword()));
    userRepository.save(user);
    return ResponseEntity.ok().build();
  }

  // DTOs as records
  record LoginRequest(@NotBlank String username, @NotBlank String password) {}

  record ChangePasswordRequest(
      @NotBlank String currentPassword,
      @NotBlank String newPassword,
      @NotBlank String confirmPassword) {}

  record UserResponse(String username) {}

  private ResponseCookie buildAuthCookie(String token, Duration maxAge) {
    return ResponseCookie.from(TOKEN_COOKIE_NAME, token)
        .httpOnly(true)
        .secure(cookieSecure)
        .path("/")
        .maxAge(maxAge)
        .sameSite("Strict")
        .build();
  }
}
