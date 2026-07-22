export const buildEventFilterQuery = (formvalue: Record<string, any> = {}) => {
  const filters: string[] = [];

  Object.entries(formvalue).forEach(([key, value]) => {
    if (value && typeof value === 'object' && 'id' in value && value.id) {
      filters.push(`${key}=${value.id}`);
    }
  });

  return filters;
};

export const buildEventFilterUrl = (
  start: string,
  end: string,
  formvalue: Record<string, any> = {}
) => {
  const filters = buildEventFilterQuery(formvalue);
  const query = filters.join('&');

  return `/evento/filtro/${start}/${end}${query ? `?${query}` : ''}`;
};
