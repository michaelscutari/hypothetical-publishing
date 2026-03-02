package edu.duke.bookpublishing.auth;

import edu.duke.bookpublishing.auth.dto.ChangePasswordRequest;
import edu.duke.bookpublishing.auth.dto.LoginRequest;
import edu.duke.bookpublishing.auth.dto.UserResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.security.Principal;
import java.time.Duration;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Auth", description = "Authentication endpoints")
public class AuthController {

  private static final String TOKEN_COOKIE_NAME = "token";

  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;
  private final JwtUtil jwtUtil;

  @Value("${app.jwt-expiration-hours:8}")
  private long expirationHours;

  @Value("${app.cookie-secure:false}")
  private boolean cookieSecure;

  @Operation(operationId = "login", summary = "Authenticate user and set session cookie")
  @PostMapping("/login")
  public ResponseEntity<Void> login(
      @Valid @RequestBody LoginRequest request, jakarta.servlet.http.HttpServletResponse response) {

    User user =
        userRepository
            .findByUsername(request.username())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));

    if (!passwordEncoder.matches(request.password(), user.getPassword())) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
    }

    String token = jwtUtil.generateToken(user.getUsername(), user.getPasswordVersion());

    response.addHeader(
        HttpHeaders.SET_COOKIE,
        buildAuthCookie(token, Duration.ofHours(expirationHours)).toString());
    return ResponseEntity.ok().build();
  }

  @Operation(operationId = "logout", summary = "Clear session cookie and log out")
  @PostMapping("/logout")
  public ResponseEntity<Void> logout(jakarta.servlet.http.HttpServletResponse response) {
    response.addHeader(HttpHeaders.SET_COOKIE, buildAuthCookie("", Duration.ZERO).toString());
    return ResponseEntity.ok().build();
  }

  @Operation(operationId = "getCurrentUser", summary = "Get current authenticated user")
  @GetMapping("/me")
  public ResponseEntity<UserResponse> me(Principal principal) {
    if (principal == null) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }
    return ResponseEntity.ok(new UserResponse(principal.getName()));
  }

  @Operation(operationId = "changePassword", summary = "Change current user password")
  @PutMapping("/password")
  public ResponseEntity<Void> changePassword(
      @Valid @RequestBody ChangePasswordRequest request,
      Principal principal,
      jakarta.servlet.http.HttpServletResponse response) {

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
    user.setPasswordVersion(user.getPasswordVersion() + 1);
    userRepository.save(user);

    String token = jwtUtil.generateToken(user.getUsername(), user.getPasswordVersion());
    response.addHeader(
        HttpHeaders.SET_COOKIE,
        buildAuthCookie(token, Duration.ofHours(expirationHours)).toString());

    return ResponseEntity.ok().build();
  }

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
