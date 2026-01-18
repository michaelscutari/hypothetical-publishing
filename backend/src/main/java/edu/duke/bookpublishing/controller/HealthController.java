package edu.duke.bookpublishing.controller;

import java.time.LocalDateTime;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class HealthController {

  @GetMapping("/test")
  public Map<String, String> test() {
    return Map.of(
        "status", "Backend is working!",
        "message", "Hypothetical Publishing API",
        "timestamp", LocalDateTime.now().toString());
  }

  @GetMapping("/health")
  public Map<String, String> health() {
    return Map.of("status", "UP");
  }
}
