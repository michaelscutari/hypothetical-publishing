package edu.duke.bookpublishing;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.Map;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.*;

@SpringBootApplication
@Tag(name = "System", description = "System and health endpoints")
@RestController
@RequestMapping("/api")
public class BookPublishingApplication {

  public static void main(String[] args) {
    SpringApplication.run(BookPublishingApplication.class, args);
  }

  @Operation(operationId = "getTest")
  @GetMapping("/test")
  public Map<String, String> test() {
    return Map.of(
        "status", "Backend is working!",
        "message", "Hypothetical Publishing API",
        "timestamp", java.time.LocalDateTime.now().toString());
  }

  @Operation(operationId = "getHealth")
  @GetMapping("/health")
  public Map<String, String> health() {
    return Map.of("status", "UP");
  }
}
