export const normalizeProfileName = (value?: string | null) => (value || '').trim().toLowerCase();

export const isProfile = (value?: string | null, expected?: string | null) =>
  normalizeProfileName(value) === normalizeProfileName(expected);

export const hasPermissionRule = (permissions: string[] = [], rule?: string, perfil?: string | null, developerOverride = false) => {
  if (!rule) {
    return false;
  }

  if (rule === '*') {
    return true;
  }

  if (developerOverride && isProfile(perfil, 'developer')) {
    return true;
  }

  return permissions.includes(rule.toUpperCase());
};
