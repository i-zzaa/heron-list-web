export const normalizeFormValues = (values: Record<string, any> = {}) => {
  const normalized: Record<string, any> = {};

  Object.entries(values || {}).forEach(([key, value]) => {
    if (value === '' || value === null || value === undefined) {
      return;
    }

    if (value && typeof value === 'object' && 'id' in value) {
      normalized[key] = value.id;
      return;
    }

    if (value && typeof value === 'object' && 'target' in value && value.target?.value !== undefined) {
      normalized[key] = value.target.value;
      return;
    }

    if (value && typeof value === 'object' && 'value' in value && value.value !== undefined) {
      normalized[key] = value.value;
      return;
    }

    normalized[key] = value;
  });

  return normalized;
};

export const mapFormValuesToPayload = (
  values: Record<string, any> = {},
  options: { exclude?: string[]; idKeys?: string[] } = {}
) => {
  const payload = normalizeFormValues(values);
  const { exclude = [], idKeys = [] } = options;

  const excludedKeys = new Set(exclude);

  Object.keys(payload).forEach((key) => {
    if (excludedKeys.has(key)) {
      delete payload[key];
      return;
    }

    if (idKeys.some((idKey) => key === idKey || key.endsWith(idKey))) {
      const value = payload[key];
      payload[key] = Array.isArray(value) ? value.map((item: any) => item?.id || item) : value?.id || value;
    }
  });

  return payload;
};
