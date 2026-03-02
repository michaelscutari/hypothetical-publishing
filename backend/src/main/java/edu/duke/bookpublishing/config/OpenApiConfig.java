package edu.duke.bookpublishing.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.servers.Server;
import java.util.List;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

  @Bean
  public OpenAPI bookPublishingOpenAPI() {
    return new OpenAPI()
        .info(
            new Info()
                .title("Book Publishing API")
                .description("API for the Book Publishing application")
                .version("1.0.0"))
        .servers(List.of(new Server().url("/")));
  }
}
