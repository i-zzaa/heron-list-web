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

export const resolveResponsePagination = (response: any, fallback = {}) => {
  return response?.pagination || response?.data?.pagination || fallback;
};

export const resolveResponseData = (response: any) => {
  if (Array.isArray(response)) {
    return response;
  }

  return response?.data?.data || response?.data || [];
};
