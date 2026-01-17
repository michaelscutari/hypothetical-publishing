package edu.duke.bookpublishing;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@SpringBootApplication
@RestController
@RequestMapping("/api")
public class BookPublishingApplication {
    
    public static void main(String[] args) {
        SpringApplication.run(BookPublishingApplication.class, args);
    }
    
    @GetMapping("/test")
    public Map<String, String> test() {
        return Map.of(
            "status", "Backend is working!",
            "message", "Hypothetical Publishing API",
            "timestamp", java.time.LocalDateTime.now().toString()
        );
    }
    
    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "UP");
    }
}