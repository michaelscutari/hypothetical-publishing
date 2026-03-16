import * as React from 'react';
import type { GridPaginationModel } from '@mui/x-data-grid';

const SHOW_ALL_SIZE = -1;

export interface UseServerDataGridOptions<T> {
  /**
   * Fetches a page of data. Must be wrapped in `React.useCallback` by the caller —
   * the hook re-fetches whenever `fetchFn` identity changes. When filters or
   * search terms change, update the React.useCallback deps so a new reference is
   * created, which triggers a re-fetch and resets pagination to page 0.
   */
  fetchFn: (params: {
    page: number;
    pageSize: number;
    showAll: boolean;
  }) => Promise<{ content?: T[]; totalElements?: number }>;
  initialPageSize?: number;
}

export interface UseServerDataGridResult<T> {
  rows: T[];
  rowCount: number;
  isLoading: boolean;
  error: Error | null;
  paginationModel: GridPaginationModel;
  onPaginationModelChange: (model: GridPaginationModel) => void;
  refresh: () => void;
  setIsLoading: (loading: boolean) => void;
}

export function useServerDataGrid<T>({
  fetchFn,
  initialPageSize = 10,
}: UseServerDataGridOptions<T>): UseServerDataGridResult<T> {
  const [rows, setRows] = React.useState<T[]>([]);
  const [rowCount, setRowCount] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);
  const [paginationModel, setPaginationModel] = React.useState<GridPaginationModel>({
    page: 0,
    pageSize: initialPageSize,
  });

  // Track fetchFn identity to reset page on filter changes
  const prevFetchFnRef = React.useRef(fetchFn);

  React.useEffect(() => {
    if (prevFetchFnRef.current !== fetchFn) {
      prevFetchFnRef.current = fetchFn;
      setPaginationModel((p) => (p.page === 0 ? p : { ...p, page: 0 }));
    }
  }, [fetchFn]);

  const showAll = paginationModel.pageSize === SHOW_ALL_SIZE;

  const loadData = React.useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      const response = await fetchFn({
        page: showAll ? 0 : paginationModel.page,
        pageSize: showAll ? 1000 : paginationModel.pageSize,
        showAll,
      });
      setRows(response.content ?? []);
      setRowCount(response.totalElements ?? 0);
    } catch (fetchError) {
      setError(fetchError as Error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchFn, paginationModel, showAll]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const refresh = React.useCallback(() => {
    if (!isLoading) loadData();
  }, [isLoading, loadData]);

  return {
    rows,
    rowCount,
    isLoading,
    error,
    paginationModel,
    onPaginationModelChange: setPaginationModel,
    refresh,
    setIsLoading,
  };
}
