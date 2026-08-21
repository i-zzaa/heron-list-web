export const buildPaginationState = (
  currentPage = 1,
  pageSize = 10,
  totalPages = 0
) => ({
  currentPage,
  pageSize,
  totalPages,
});

export const resolvePagination = (pagination: any, currentPage: number) => ({
  ...pagination,
  currentPage,
});

export const resolveResponsePagination = (response: any, fallback: any = {}) => {
  const raw = response?.pagination || response?.data?.pagination;
  if (!raw) return fallback;

  // Alguns endpoints (ex: /baixa/filtro) devolvem a página atual em `page`
  // em vez de `currentPage` — normaliza pra manter o mesmo contrato em
  // todas as telas que consomem essa função.
  return {
    ...raw,
    currentPage: raw.currentPage ?? raw.page ?? fallback?.currentPage ?? 1,
    pageSize: raw.pageSize ?? fallback?.pageSize ?? 10,
    totalPages: raw.totalPages ?? fallback?.totalPages ?? 0,
  };
};

export const resolveResponseData = (response: any) => {
  if (Array.isArray(response)) {
    return response;
  }

  return response?.data?.data || response?.data || [];
};
