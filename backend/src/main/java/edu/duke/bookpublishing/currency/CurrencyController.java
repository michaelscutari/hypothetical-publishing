package edu.duke.bookpublishing.currency;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/currency")
@RequiredArgsConstructor
@Validated
@Tag(name = "Currency", description = "Currency conversion endpoints")
public class CurrencyController {

  private final CurrencyService currencyService;

  @Operation(operationId = "convertCurrency", summary = "Convert an amount between currencies")
  @GetMapping("/convert")
  public CurrencyConversionResponse convertCurrency(
      @RequestParam @NotBlank String from,
      @RequestParam @NotBlank String to,
      @RequestParam @NotNull BigDecimal amount) {
    BigDecimal convertedAmount = currencyService.convert(from, to, amount);
    return new CurrencyConversionResponse(convertedAmount);
  }

  public record CurrencyConversionResponse(
      @Schema(description = "Converted amount", example = "12.34") BigDecimal convertedAmount) {}
}

