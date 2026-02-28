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
  @NotBlank(message = "isbn.isRequired")
  @ISBNAny
  private String isbn;

  @CsvBindByName(column = "Title")
  @NotBlank(message = "title.isRequired")
  private String title;

  @CsvBindByName(column = "Author")
  @Pattern(regexp = "^.+?,\\s*.+$", message = "author.invalidFormat")
  private String author;

  @CsvBindByName(column = "Format")
  @NotBlank(message = "format.isRequired")
  private String format;

  @CsvBindByName(column = "Gross Qty")
  @Positive
  @NotNull(message = "grossQty.isRequired")
  private Long grossQty;

  @CsvBindByName(column = "Returned Qty")
  @PositiveOrZero
  @NotNull(message = "returnedQty.isRequired")
  private Long returnedQty;

  @CsvBindByName(column = "Net Qty")
  @Positive
  @NotNull(message = "netQty.isRequired")
  private Long netQty;

  @CsvBindByName(column = "Net Compensation")
  @DecimalMin(value = "0.00", inclusive = false, message = "netCompensation.mustBeGreaterThanZero")
  @NotNull(message = "netCompensation.isRequired")
  private BigDecimal netCompensation;

  @CsvBindByName(column = "Sales Market")
  @NotBlank(message = "salesMarket.isRequired")
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
