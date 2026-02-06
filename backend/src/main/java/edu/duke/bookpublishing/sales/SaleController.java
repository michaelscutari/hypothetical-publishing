package edu.duke.bookpublishing.sales;

import edu.duke.bookpublishing.common.dto.PagedResponse;
import edu.duke.bookpublishing.sales.dto.AuthorPaymentGroupResponse;
import edu.duke.bookpublishing.sales.dto.MarkAllPaidRequest;
import edu.duke.bookpublishing.sales.dto.MarkAllPaidResponse;
import edu.duke.bookpublishing.sales.dto.SaleRequest;
import edu.duke.bookpublishing.sales.dto.SaleResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
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

  // ------- GET MAPPINGS -------

  @Operation(operationId = "getSales", summary = "Retrieves all sales, paginated")
  @GetMapping
  public PagedResponse<SaleResponse> getSales(
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "25") int size,
      @RequestParam(defaultValue = "false") boolean showAll,
      @RequestParam(required = false) String sortField,
      @RequestParam(defaultValue = "asc") String sortDirection,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
          LocalDate startDate,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
          LocalDate endDate,
      @RequestParam(required = false) String query) {

    Sort sort =
        sortField != null
            ? Sort.by(Sort.Direction.fromString(sortDirection), sortField)
            : Sort.unsorted();

    if (showAll) {
      List<Sale> sales = saleService.getAllSales(startDate, endDate, query, sort);
      return PagedResponse.unpaged(sales, SaleResponse::from);
    }

    Pageable pageable = PageRequest.of(page, size, sort);
    Page<Sale> sales = saleService.getPagedSales(startDate, endDate, query, pageable);
    return PagedResponse.paged(sales, SaleResponse::from);
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
    int updatedCount = saleService.markAllPaidByAuthor(request.author());
    return new MarkAllPaidResponse(request.author(), updatedCount);
  }

  // ------- DELETE MAPPINGS -------

  @Operation(operationId = "deleteSale", summary = "Deletes an existing sale")
  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void deleteSale(@PathVariable Long id) {
    saleService.deleteById(id);
  }
}
