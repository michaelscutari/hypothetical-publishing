package edu.duke.bookpublishing.auth;

import com.auth0.jwt.exceptions.JWTVerificationException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {
  private final JwtUtil jwtUtil;
  private final UserRepository userRepository;

  @Override
  protected void doFilterInternal(
      HttpServletRequest request, HttpServletResponse response, FilterChain chain)
      throws ServletException, IOException {

    String token = extractTokenFromCookie(request);

    if (token != null) {
      try {
        JwtUtil.DecodedToken decoded = jwtUtil.validateToken(token);
        var user = userRepository.findByUsername(decoded.username());
        if (user.isPresent() && user.get().getPasswordVersion() == decoded.passwordVersion()) {
          var auth = new UsernamePasswordAuthenticationToken(decoded.username(), null, List.of());
          SecurityContextHolder.getContext().setAuthentication(auth);
        }
      } catch (JWTVerificationException e) {
        // Invalid token, continue without auth
      }
    }

    chain.doFilter(request, response);
  }

  @Override
  protected boolean shouldNotFilterErrorDispatch() {
    return false;
  }

  private String extractTokenFromCookie(HttpServletRequest request) {
    if (request.getCookies() == null) {
      return null;
    }
    return Arrays.stream(request.getCookies())
        .filter(c -> "token".equals(c.getName()))
        .map(Cookie::getValue)
        .findFirst()
        .orElse(null);
  }
}
