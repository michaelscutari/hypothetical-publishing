package edu.duke.bookpublishing.sales;

import com.opencsv.CSVWriter;
import edu.duke.bookpublishing.sales.enums.SaleDistributor;
import edu.duke.bookpublishing.sales.enums.SaleFormat;
import edu.duke.bookpublishing.sales.enums.SaleSource;
import java.io.IOException;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;

/**
 * Exports sales records to CSV per the class data format committee spec. Writes UTF-8 with BOM, RFC
 * 4180 compliant via OpenCSV.
 */
@Component
public class SaleCsvExporter {

  private static final byte[] UTF8_BOM = {(byte) 0xEF, (byte) 0xBB, (byte) 0xBF};

  private static final String[] HEADERS = {
    "Date",
    "Title",
    "Author",
    "Source",
    "Distributor",
    "Format",
    "Quantity",
    "KENP",
    "Original Currency",
    "Pub. Revenue (Original)",
    "Pub. Revenue (USD)",
    "Author Royalty (USD)",
    "Royalty Status",
    "Comment"
  };

  private static final Map<SaleSource, String> SOURCE_NAMES =
      Map.of(
          SaleSource.DISTRIBUTOR, "Distributor",
          SaleSource.HAND_SOLD, "Handsold",
          SaleSource.KICKSTARTER, "Kickstarter");

  private static final Map<SaleDistributor, String> DISTRIBUTOR_NAMES =
      Map.of(
          SaleDistributor.INGRAM_SPARK, "Ingram Spark",
          SaleDistributor.AMAZON, "Amazon",
          SaleDistributor.OTHER, "Other");

  private static final Map<SaleFormat, String> FORMAT_NAMES =
      Map.of(
          SaleFormat.PRINT, "Print",
          SaleFormat.EBOOK, "Ebook",
          SaleFormat.KINDLE_UNLIMITED, "Kindle Unlimited");

  public void write(List<Sale> sales, OutputStream out) throws IOException {
    out.write(UTF8_BOM);

    try (CSVWriter writer = new CSVWriter(new OutputStreamWriter(out, StandardCharsets.UTF_8))) {
      writer.writeNext(HEADERS);
      for (Sale sale : sales) {
        writer.writeNext(toRow(sale));
      }
    }
  }

  private String[] toRow(Sale sale) {
    boolean isKindleUnlimited = sale.getFormat() == SaleFormat.KINDLE_UNLIMITED;
    boolean isDistributor = sale.getSaleSource() == SaleSource.DISTRIBUTOR;

    return new String[] {
      formatDate(sale.getSaleYear(), sale.getSaleMonth()),
      sale.getBook().getTitle(),
      sale.getBook().getAuthor().getName(),
      SOURCE_NAMES.getOrDefault(sale.getSaleSource(), sale.getSaleSource().name()),
      isDistributor
          ? DISTRIBUTOR_NAMES.getOrDefault(sale.getDistributor(), sale.getDistributor().name())
          : "N/A",
      FORMAT_NAMES.getOrDefault(sale.getFormat(), sale.getFormat().name()),
      isKindleUnlimited ? "N/A" : String.valueOf(sale.getQuantitySold()),
      isKindleUnlimited ? String.valueOf(sale.getKenp()) : "N/A",
      sale.getSaleCurrency().name(),
      formatRevenue(
          sale.getOriginalPublisherRevenue(), sale.getSaleCurrency().getFractionalDigits()),
      formatUsd(sale.getPublisherRevenue()),
      formatUsd(sale.getAuthorRoyalty()),
      Boolean.TRUE.equals(sale.getHasAuthorBeenPaid()) ? "Paid" : "Unpaid",
      sale.getComment() != null ? sale.getComment() : ""
    };
  }

  private String formatDate(int year, int month) {
    return String.format("%d-%02d", year, month);
  }

  private String formatRevenue(BigDecimal amount, int fractionalDigits) {
    if (amount == null) return "";
    if (fractionalDigits == 0) {
      return amount.stripTrailingZeros().toPlainString();
    }
    return amount.setScale(fractionalDigits).toPlainString();
  }

  private String formatUsd(BigDecimal amount) {
    if (amount == null) return "";
    return amount.setScale(2).toPlainString();
  }
}
