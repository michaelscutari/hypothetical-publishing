package edu.duke.bookpublishing.auth;

import static org.junit.jupiter.api.Assertions.*;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTVerificationException;
import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class JwtUtilTest {

  @Autowired private JwtUtil jwtUtil;

  @Test
  void generateAndValidateToken() {
    String token = jwtUtil.generateToken("alice", 0);
    JwtUtil.DecodedToken decoded = jwtUtil.validateToken(token);

    assertEquals("alice", decoded.username());
    assertEquals(0, decoded.passwordVersion());
  }

  @Test
  void tokenContainsPasswordVersion() {
    String token = jwtUtil.generateToken("bob", 5);
    JwtUtil.DecodedToken decoded = jwtUtil.validateToken(token);

    assertEquals("bob", decoded.username());
    assertEquals(5, decoded.passwordVersion());
  }

  @Test
  void tamperedTokenIsRejected() {
    String token = jwtUtil.generateToken("alice", 0);
    String tampered = token.substring(0, token.length() - 4) + "xxxx";

    assertThrows(JWTVerificationException.class, () -> jwtUtil.validateToken(tampered));
  }

  @Test
  void tokenSignedWithWrongSecretIsRejected() {
    String forged =
        JWT.create()
            .withSubject("alice")
            .withClaim("pwv", 0)
            .withIssuedAt(Instant.now())
            .withExpiresAt(Instant.now().plusSeconds(3600))
            .sign(Algorithm.HMAC256("wrong-secret"));

    assertThrows(JWTVerificationException.class, () -> jwtUtil.validateToken(forged));
  }

  @Test
  void expiredTokenIsRejected() {
    String expired =
        JWT.create()
            .withSubject("alice")
            .withClaim("pwv", 0)
            .withIssuedAt(Instant.now().minusSeconds(7200))
            .withExpiresAt(Instant.now().minusSeconds(3600))
            .sign(Algorithm.HMAC256("default-secret-change-in-production"));

    assertThrows(JWTVerificationException.class, () -> jwtUtil.validateToken(expired));
  }

  @Test
  void garbageTokenIsRejected() {
    assertThrows(JWTVerificationException.class, () -> jwtUtil.validateToken("not.a.jwt"));
  }
}
