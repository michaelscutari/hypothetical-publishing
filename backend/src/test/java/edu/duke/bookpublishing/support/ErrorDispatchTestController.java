package edu.duke.bookpublishing.support;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ErrorDispatchTestController {

  @GetMapping("/api/test/error-dispatch")
  public void triggerError() {
    throw new IllegalStateException("intentional test error");
  }
}
