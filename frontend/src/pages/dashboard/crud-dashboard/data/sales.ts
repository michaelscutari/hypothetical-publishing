import {
  SalesService,
  type PagedResponseSaleResponse,
  type SaleRequest,
  type SaleResponse,
} from '../../../../api';
import type { GridPaginationModel, GridSortModel } from '@mui/x-data-grid';

export type Sale = SaleResponse;


export async function getMany({
  paginationModel,
  sortModel,
  showAll = false,
}: {
  paginationModel: GridPaginationModel;
  sortModel: GridSortModel;
  showAll?: boolean;
}): Promise<{ items: Sale[]; itemCount: number }> {
  const sortField = sortModel?.[0]?.field;
  const sortDirection = sortModel?.[0]?.sort ?? 'asc';

  const response: PagedResponseSaleResponse = await SalesService.getSales(
    paginationModel.page,
    paginationModel.pageSize,
    showAll,
    sortField,
    sortDirection,
  );

  return {
    items: response.content ?? [],
    itemCount: response.totalElements ?? 0,
  };
}

export async function getForBook(bookId: number): Promise<Sale[]> {
  const response: PagedResponseSaleResponse = await SalesService.getSales(
    0,
    1000,
    true,
    'saleYear',
    'desc',
  );

  return (response.content ?? []).filter((sale) => sale.bookId === bookId);
}

export async function getOne(saleId: number): Promise<Sale> {
  return SalesService.getSaleById(saleId);
}

export async function createOne(data: SaleRequest): Promise<Sale> {
  return SalesService.createSale({
    bookId: data.bookId,
    saleMonth: data.saleMonth,
    saleYear: data.saleYear,
    quantitySold: data.quantitySold,
    publisherRevenue: data.publisherRevenue,
    hasAuthorBeenPaid: data.hasAuthorBeenPaid ?? false,
  });
}

export async function updateOne(
  saleId: number,
  data: Partial<SaleRequest>,
): Promise<Sale> {
  const request: SaleRequest = {
    bookId: data.bookId ?? 0,
    saleMonth: data.saleMonth ?? 1,
    saleYear: data.saleYear ?? new Date().getFullYear(),
    quantitySold: data.quantitySold ?? 0,
    publisherRevenue: data.publisherRevenue ?? 0,
    hasAuthorBeenPaid: data.hasAuthorBeenPaid ?? false,
  };

  return SalesService.updateSale(saleId, request);
}

export async function deleteOne(saleId: number): Promise<void> {
  return SalesService.deleteSale(saleId);
}
