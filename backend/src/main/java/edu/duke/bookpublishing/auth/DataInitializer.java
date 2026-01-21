package edu.duke.bookpublishing.auth;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;

  @Value("${ADMIN_PASSWORD:admin}")
  private String adminPassword;

  @Override
  public void run(String... args) {
    if (userRepository.findByUsername("admin").isEmpty()) {
      User admin =
          User.builder().username("admin").password(passwordEncoder.encode(adminPassword)).build();
      userRepository.save(admin);
      log.info("Created default admin user");
    }
  }
}
