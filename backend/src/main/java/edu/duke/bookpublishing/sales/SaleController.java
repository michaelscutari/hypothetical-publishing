package edu.duke.bookpublishing.sales;

import edu.duke.bookpublishing.common.SortUtils;
import edu.duke.bookpublishing.common.dto.PagedResponse;
import edu.duke.bookpublishing.sales.dto.AuthorPaymentGroupResponse;
import edu.duke.bookpublishing.sales.dto.FinancialReportFile;
import edu.duke.bookpublishing.sales.dto.MarkAllPaidRequest;
import edu.duke.bookpublishing.sales.dto.MarkAllPaidResponse;
import edu.duke.bookpublishing.sales.dto.RoyaltyReportResponse;
import edu.duke.bookpublishing.sales.dto.SaleRequest;
import edu.duke.bookpublishing.sales.dto.SaleResponse;
import edu.duke.bookpublishing.sales.dto.SalesImportRequest;
import edu.duke.bookpublishing.sales.dto.SalesImportResponse;
import edu.duke.bookpublishing.sales.enums.SaleDistributor;
import edu.duke.bookpublishing.sales.enums.SaleFormat;
import edu.duke.bookpublishing.sales.enums.SaleSource;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import java.io.IOException;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * Rest Controller for Sale CRUD Operations
 *
 * @author Daniel Rodriguez-Florido
 */
@RestController
@RequestMapping("/api/sales")
@RequiredArgsConstructor
@Tag(name = "Sales", description = "Sale management endpoints")
public class SaleController {

  private final SaleService saleService;
  private final SaleCsvExporter saleCsvExporter;

  // ------- GET MAPPINGS -------

  @Operation(operationId = "getSales", summary = "Retrieves all sales, paginated")
  @GetMapping
  public PagedResponse<SaleResponse> getSales(
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "25") int size,
      @RequestParam(defaultValue = "false") boolean showAll,
      @RequestParam(required = false) List<String> sortField,
      @RequestParam(required = false) List<String> sortDirection,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
          LocalDate startDate,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
          LocalDate endDate,
      @RequestParam(required = false) Long authorId,
      @RequestParam(required = false) SaleSource saleSource,
      @RequestParam(required = false) SaleDistributor distributor,
      @RequestParam(required = false) SaleFormat format,
      @RequestParam(required = false) String query,
      @RequestParam(required = false) Long bookId) {

    Sort sort = SortUtils.buildSort(sortField, sortDirection, Sort.unsorted());

    if (showAll) {
      List<Sale> sales =
          saleService.getAllSales(
              startDate, endDate, authorId, bookId, saleSource, distributor, format, query, sort);
      return PagedResponse.unpaged(sales, SaleResponse::from);
    }

    Pageable pageable = PageRequest.of(page, size, sort);
    Page<Sale> sales =
        saleService.getPagedSales(
            startDate, endDate, authorId, bookId, saleSource, distributor, format, query, pageable);
    return PagedResponse.paged(sales, SaleResponse::from);
  }

  @Operation(operationId = "exportSalesCsv", summary = "Exports filtered sales as CSV")
  @GetMapping("/export")
  public void exportSalesCsv(
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
          LocalDate startDate,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
          LocalDate endDate,
      @RequestParam(required = false) Long authorId,
      @RequestParam(required = false) SaleSource saleSource,
      @RequestParam(required = false) SaleDistributor distributor,
      @RequestParam(required = false) SaleFormat format,
      @RequestParam(required = false) String query,
      @RequestParam(required = false) Long bookId,
      HttpServletResponse response)
      throws IOException {

    List<Sale> sales =
        saleService.getAllSales(
            startDate,
            endDate,
            authorId,
            bookId,
            saleSource,
            distributor,
            format,
            query,
            Sort.unsorted());

    response.setContentType("text/csv; charset=UTF-8");
    response.setHeader("Content-Disposition", "attachment; filename=\"sales-export.csv\"");
    saleCsvExporter.write(sales, response.getOutputStream());
  }

  @Operation(operationId = "getAuthorPayments", summary = "Gets grouped author payments view")
  @GetMapping("/author-payments")
  public PagedResponse<AuthorPaymentGroupResponse> getAuthorPayments(
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "25") int size,
      @RequestParam(defaultValue = "false") boolean showAll,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
          LocalDate startDate,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
          LocalDate endDate,
      @RequestParam(required = false) String query) {

    // Build the full grouped list in required order, then paginate at the author-group level.
    List<AuthorPaymentGroupResponse> groups =
        saleService.getAuthorPaymentGroups(startDate, endDate, query);

    if (showAll) {
      return PagedResponse.unpaged(groups);
    }

    int totalElements = groups.size();
    int totalPages = size > 0 ? (int) Math.ceil((double) totalElements / size) : 0;
    int fromIndex = Math.min(page * size, totalElements);
    int toIndex = Math.min(fromIndex + size, totalElements);
    List<AuthorPaymentGroupResponse> content =
        fromIndex >= toIndex ? List.of() : groups.subList(fromIndex, toIndex);

    return new PagedResponse<>(content, page, size, totalElements, totalPages, true);
  }

  @Operation(
      operationId = "getRoyaltyReport",
      summary = "Generates an author royalty report for a quarter range")
  @GetMapping("/royalty-report")
  public RoyaltyReportResponse getRoyaltyReport(
      @RequestParam Long authorId,
      @RequestParam int startQuarter,
      @RequestParam int startYear,
      @RequestParam int endQuarter,
      @RequestParam int endYear,
      @RequestParam(defaultValue = "false") boolean includeEmptyQuarters) {
    return saleService.generateRoyaltyReport(
        authorId, startQuarter, startYear, endQuarter, endYear, includeEmptyQuarters);
  }

  @Operation(
      operationId = "exportAllAuthorsRoyaltyReport",
      summary = "Exports all authors royalty totals by quarter range as XLSX")
  @GetMapping("/reports/all-authors-royalty")
  public void exportAllAuthorsRoyaltyReport(
      @RequestParam int startQuarter,
      @RequestParam int startYear,
      @RequestParam int endQuarter,
      @RequestParam int endYear,
      HttpServletResponse response)
      throws IOException {
    FinancialReportFile reportFile =
        saleService.exportAllAuthorsRoyaltyReport(startQuarter, startYear, endQuarter, endYear);
    writeFileResponse(response, reportFile);
  }

  @Operation(
      operationId = "exportPublisherProfitReport",
      summary = "Exports publisher profit totals by quarter range as XLSX")
  @GetMapping("/reports/publisher-profit")
  public void exportPublisherProfitReport(
      @RequestParam int startQuarter,
      @RequestParam int startYear,
      @RequestParam int endQuarter,
      @RequestParam int endYear,
      HttpServletResponse response)
      throws IOException {
    FinancialReportFile reportFile =
        saleService.exportPublisherProfitReport(startQuarter, startYear, endQuarter, endYear);
    writeFileResponse(response, reportFile);
  }

  @Operation(
      operationId = "exportAmazonSalesReport",
      summary = "Exports Amazon lifetime sales data as XLSX")
  @GetMapping("/reports/amazon-sales")
  public void exportAmazonSalesReport(HttpServletResponse response) throws IOException {
    FinancialReportFile reportFile = saleService.exportAmazonSalesReport();
    writeFileResponse(response, reportFile);
  }

  @Operation(operationId = "getSaleById", summary = "Gets a sale by its ID")
  @GetMapping("/{id}")
  public SaleResponse getSale(@PathVariable Long id) {
    return SaleResponse.from(saleService.getSaleById(id));
  }

  // ------- POST MAPPINGS -------

  @Operation(operationId = "createSale", summary = "Creates a new sale")
  @PostMapping
  public SaleResponse createSale(@Valid @RequestBody SaleRequest sale) {
    return SaleResponse.from(saleService.createSale(sale));
  }

  @Operation(operationId = "importCsv", summary = "Imports or previews a CSV file")
  @PostMapping(path = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  @Transactional
  public SalesImportResponse importSales(
      @Valid @ModelAttribute SalesImportRequest salesImportRequest) {
    return saleService.importSales(salesImportRequest);
  }

  // ------- PUT MAPPINGS -------

  @Operation(operationId = "updateSale", summary = "Updates an existing sale")
  @PutMapping("/{id}")
  public SaleResponse updateSale(@PathVariable Long id, @Valid @RequestBody SaleRequest sale) {
    return SaleResponse.from(saleService.updateSale(id, sale));
  }

  @Operation(
      operationId = "markAuthorPaymentsPaid",
      summary = "Marks all unpaid sales for an author as paid")
  @PutMapping("/author-payments/mark-paid")
  public MarkAllPaidResponse markAuthorPaymentsPaid(
      @Valid @RequestBody MarkAllPaidRequest request) {
    int updatedCount = saleService.markAllPaidByAuthorId(request.authorId());
    return new MarkAllPaidResponse(request.authorId(), updatedCount);
  }

  // ------- DELETE MAPPINGS -------

  @Operation(operationId = "deleteSale", summary = "Deletes an existing sale")
  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void deleteSale(@PathVariable Long id) {
    saleService.deleteById(id);
  }

  private void writeFileResponse(HttpServletResponse response, FinancialReportFile reportFile)
      throws IOException {
    response.setContentType(reportFile.contentType());
    response.setHeader(
        "Content-Disposition", "attachment; filename=\"" + reportFile.filename() + "\"");
    response.getOutputStream().write(reportFile.content());
    response.flushBuffer();
  }
}
