package edu.duke.bookpublishing.sales.parser;

import com.opencsv.bean.CsvBindByName;
import edu.duke.bookpublishing.books.validation.ISBNAny;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import java.math.BigDecimal;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class IngramCsvEntry {

  @CsvBindByName(column = "ISBN")
  @NotBlank
  @ISBNAny
  private String isbn;

  @CsvBindByName(column = "Title")
  @NotBlank
  private String title;

  @CsvBindByName(column = "Author")
  @NotBlank
  @Pattern(regexp = "^.+?,\\s*.+$", message = "author.invalidFormat")
  private String author;

  @CsvBindByName(column = "Format")
  @NotBlank
  private String format;

  @CsvBindByName(column = "Gross Qty")
  @Positive
  @NotNull
  private Long grossQty;

  @CsvBindByName(column = "Returned Qty")
  @PositiveOrZero
  @NotNull
  private Long returnedQty;

  @CsvBindByName(column = "Net Qty")
  @Positive
  @NotNull
  private Long netQty;

  @CsvBindByName(column = "Net Compensation")
  @DecimalMin("0.00")
  @NotNull
  private BigDecimal netCompensation;

  @CsvBindByName(column = "Sales Market")
  @NotBlank
  @Pattern(regexp = "^[A-Z]{2}.*$", message = "salesMarket.invalidFormat")
  private String salesMarket;

  // --------- Cross-Field Validation ---------

  @AssertTrue(message = "returnedQty.mustBeZero")
  @Schema(hidden = true)
  public boolean isReturnedQtyZero() {
    if (returnedQty == null) {
      // Let not null tag handle above
      return true;
    }
    return returnedQty == 0;
  }

  @AssertTrue(message = "grossQty.mustEqual.netQty")
  @Schema(hidden = true)
  public boolean isGrossQtyEqualNetQty() {
    if (grossQty == null || netQty == null) {
      // Let not null tag handle above
      return true;
    }
    return grossQty.equals(netQty);
  }
}
