export const normalizeFilterValue = (value: any) => {
  if (value === '' || value === null || value === undefined) {
    return undefined;
  }

  if (typeof value === 'object' && 'target' in value && value.target?.value !== undefined) {
    return value.target.value;
  }

  if (typeof value === 'object' && 'value' in value && value.value !== undefined) {
    return value.value;
  }

  if (typeof value === 'object' && 'id' in value) {
    return value.id;
  }

  return value;
};

export const buildQueryString = (
  filterData: Record<string, any> = {},
  extras: Record<string, any> = {}
) => {
  const params = new URLSearchParams();

  Object.entries({ ...filterData, ...extras }).forEach(([key, value]) => {
    const normalizedValue = normalizeFilterValue(value);

    if (normalizedValue === undefined) {
      return;
    }

    params.append(key, String(normalizedValue));
  });

  return params.toString();
};

export const getApiPayload = (response: any, fallback: any = []) => {
  const payload = response?.data?.data ?? response?.data ?? fallback;
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && typeof payload === 'object') {
    if (Array.isArray(payload.items)) {
      return payload.items;
    }
    if (Array.isArray(payload.data)) {
      return payload.data;
    }
  }

  return fallback;
};

export const getPaginationMeta = (
  response: any,
  fallbackPage = 1,
  fallbackPageSize = 10,
  fallbackTotal = 0
) => {
  const metrics = response?.pagination ?? response?.meta ?? response?.data?.pagination ?? response?.data?.meta ?? {};
  const totalItems = Number(metrics.total ?? metrics.totalItems ?? fallbackTotal ?? 0);
  const pageSize = Number(metrics.limit ?? metrics.pageSize ?? fallbackPageSize);
  const currentPage = Number(metrics.page ?? metrics.currentPage ?? fallbackPage);
  const totalPages = Number(
    metrics.totalPages || Math.ceil(totalItems / (pageSize || fallbackPageSize)) || 0
  );

  return {
    metrics,
    totalItems,
    pageSize,
    currentPage,
    totalPages,
  };
};

export const normalizeDropdownItem = (item: any) => {
  if (typeof item === 'string') {
    return { id: item, nome: item };
  }

  return item;
};

export const normalizeDropdownList = (items: any[] = []) => {
  return Array.isArray(items) ? items.map(normalizeDropdownItem) : [];
};
