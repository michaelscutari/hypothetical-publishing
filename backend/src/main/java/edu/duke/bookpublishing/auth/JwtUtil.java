package edu.duke.bookpublishing.auth;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTVerificationException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class JwtUtil {

  @Value("${app.jwt-secret:default-secret-change-in-production}")
  private String secret;

  @Value("${app.jwt-expiration-hours:24}")
  private long expirationHours;

  public String generateToken(String username) {
    return JWT.create()
        .withSubject(username)
        .withIssuedAt(Instant.now())
        .withExpiresAt(Instant.now().plus(expirationHours, ChronoUnit.HOURS))
        .sign(Algorithm.HMAC256(secret));
  }

  public String validateTokenAndGetUsername(String token) throws JWTVerificationException {
    return JWT.require(Algorithm.HMAC256(secret)).build().verify(token).getSubject();
  }
}
