/** Paginacao por cursor — padrao para todas as listagens */
export interface CursorPaginationQuery {
  cursor?: string;
  limit?: number;
}

export interface CursorPaginatedResponse<T> {
  data: T[];
  meta: {
    cursor: string | null;
    hasMore: boolean;
  };
}

/** Resposta de erro padrao */
export interface ErrorResponse {
  statusCode: number;
  code: string;
  message: string;
  details?: Record<string, string[]>;
}
