import { expect, test, APIRequestContext } from '@playwright/test';

type FinancialContext = {
  baseUrl: string;
  accessToken: string;
  login: string;
  profile: string;
  therapistName?: string;
  patientName?: string;
  chargeableStatusName: string;
  nonChargeableStatusName: string;
  periodStart: string;
  periodEnd: string;
};

type DropdownItem = { id: number; nome: string; cobrar?: boolean };

function readEnv(name: string) {
  const runtime = globalThis as unknown as {
    process?: { env?: Record<string, string | undefined> };
  };

  const value = runtime.process?.env?.[name];
  return typeof value === 'string' ? value.trim() : '';
}

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function assertContextFields(context: Partial<FinancialContext>) {
  if (!context.baseUrl || !context.accessToken || !context.login) {
    throw new Error('Contexto financeiro invalido: baseUrl, accessToken e login sao obrigatorios.');
  }

  if (!context.chargeableStatusName || !context.nonChargeableStatusName) {
    throw new Error('Contexto financeiro invalido: informe status cobravel e nao cobravel.');
  }

  if (!context.periodStart || !context.periodEnd) {
    throw new Error('Contexto financeiro invalido: informe data inicial e final do periodo.');
  }
}

function mapSeedContext(payload: any): Partial<FinancialContext> {
  const source = payload?.data && typeof payload.data === 'object' ? payload.data : payload;

  if (!source || typeof source !== 'object') {
    throw new Error('Seed financeiro invalido: resposta vazia ou em formato inesperado.');
  }

  return {
    baseUrl: source.baseUrl || source.apiUrl || readEnv('E2E_API_URL'),
    accessToken: source.accessToken || source.token || source.bearerToken || source.authToken,
    login: source.login || source.username || source.userLogin,
    profile: String(source.profile || source.perfil || source.profileName || 'developer').toLowerCase(),
    therapistName:
      source.therapistName || source.terapeutaNome || source.terapeuta || source.nomeTerapeuta,
    patientName:
      source.patientName || source.pacienteNome || source.paciente || source.nomePaciente,
    chargeableStatusName:
      source.chargeableStatusName || source.statusCobravel || source.statusCobravelNome || 'Atendido',
    nonChargeableStatusName:
      source.nonChargeableStatusName ||
      source.statusNaoCobravel ||
      source.statusNaoCobravelNome ||
      'Atestado',
    periodStart: source.periodStart || source.dataInicio || readEnv('E2E_FINANCIAL_PERIOD_START') || '2026-01-01',
    periodEnd: source.periodEnd || source.datatFim || readEnv('E2E_FINANCIAL_PERIOD_END') || '2026-12-31',
  };
}

async function resolveBySeed(request: APIRequestContext): Promise<FinancialContext | null> {
  const endpoint = readEnv('E2E_FINANCIAL_SEED_ENDPOINT');
  if (!endpoint) {
    return null;
  }

  const token = readEnv('E2E_FINANCIAL_SEED_TOKEN');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await request.post(endpoint, {
    headers,
    data: { scenario: 'financial-status' },
    failOnStatusCode: false,
  });

  if (!response.ok()) {
    const message = await response.text();
    throw new Error(`Seed financeiro falhou (${response.status()}): ${message || 'sem corpo de resposta'}`);
  }

  const payload = await response.json().catch(() => ({}));
  const context = mapSeedContext(payload);
  assertContextFields(context);
  return context as FinancialContext;
}

async function resolveByLogin(request: APIRequestContext): Promise<FinancialContext> {
  const baseUrl = readEnv('E2E_API_URL');
  const login = readEnv('E2E_LOGIN');
  const password = readEnv('E2E_PASSWORD');

  if (!baseUrl || !login || !password) {
    throw new Error(
      'Configure E2E_API_URL, E2E_LOGIN e E2E_PASSWORD para executar a suite integrada de financeiro.'
    );
  }

  const parsedPassword = Number(password);
  const loginResponse = await request.post(`${baseUrl}/login`, {
    headers: { 'Content-Type': 'application/json' },
    data: {
      username: login,
      password: Number.isFinite(parsedPassword) ? parsedPassword : password,
    },
    failOnStatusCode: false,
  });

  if (!loginResponse.ok()) {
    const message = await loginResponse.text();
    throw new Error(`Falha no login de fallback (${loginResponse.status()}): ${message || 'sem corpo de resposta'}`);
  }

  const payload = await loginResponse.json().catch(() => ({}));
  const user = payload?.user || payload?.data || {};
  const accessToken = payload?.accessToken || payload?.data?.accessToken;

  const context: Partial<FinancialContext> = {
    baseUrl,
    accessToken,
    login,
    profile: String(user?.perfil?.nome || user?.perfil || readEnv('E2E_PROFILE') || 'developer').toLowerCase(),
    therapistName: readEnv('E2E_FINANCIAL_THERAPIST_NAME') || undefined,
    patientName: readEnv('E2E_FINANCIAL_PATIENT_NAME') || undefined,
    chargeableStatusName: readEnv('E2E_FINANCIAL_CHARGEABLE_STATUS') || 'Atendido',
    nonChargeableStatusName: readEnv('E2E_FINANCIAL_NONCHARGEABLE_STATUS') || 'Atestado',
    periodStart: readEnv('E2E_FINANCIAL_PERIOD_START') || '2026-01-01',
    periodEnd: readEnv('E2E_FINANCIAL_PERIOD_END') || '2026-12-31',
  };

  assertContextFields(context);
  return context as FinancialContext;
}

async function resolveContext(request: APIRequestContext): Promise<FinancialContext> {
  const fromSeed = await resolveBySeed(request);
  if (fromSeed) {
    return fromSeed;
  }

  return resolveByLogin(request);
}

async function getDropdown(
  request: APIRequestContext,
  context: FinancialContext,
  resource: 'status-eventos' | 'terapeuta' | 'paciente'
): Promise<DropdownItem[]> {
  const response = await request.get(`${context.baseUrl}/${resource}/dropdown`, {
    headers: {
      Authorization: `Bearer ${context.accessToken}`,
      login: context.login,
    },
    failOnStatusCode: false,
  });

  if (!response.ok()) {
    const message = await response.text();
    throw new Error(`Falha ao carregar dropdown ${resource} (${response.status()}): ${message || 'sem corpo'}`);
  }

  const payload = await response.json().catch(() => []);
  return (payload?.data || payload || []) as DropdownItem[];
}

function findByName(list: DropdownItem[], name?: string) {
  if (!name) {
    return null;
  }

  const normalized = normalize(name);
  return list.find((item) => normalize(String(item.nome || '')) === normalized) || null;
}

async function fetchFinancial(
  request: APIRequestContext,
  context: FinancialContext,
  module: 'terapeuta' | 'paciente',
  payload: Record<string, any>
) {
  const response = await request.post(`${context.baseUrl}/financeiro/${module}`, {
    headers: {
      Authorization: `Bearer ${context.accessToken}`,
      login: context.login,
      'Content-Type': 'application/json',
    },
    data: payload,
    failOnStatusCode: false,
  });

  if (!response.ok()) {
    const message = await response.text();
    throw new Error(`Falha financeiro/${module} (${response.status()}): ${message || 'sem corpo'}`);
  }

  const body = await response.json().catch(() => ({}));
  expect(typeof body).toBe('object');
  expect(body).toHaveProperty('geral');
  expect(body).toHaveProperty('data');

  const total = Number(body?.geral?.valorTotal ?? 0);
  return {
    total,
    body,
  };
}

function assertStatusMatrix(statusList: DropdownItem[]) {
  const expected: Array<{ name: string; cobrar: boolean }> = [
    { name: 'Atendido', cobrar: true },
    { name: 'Falta', cobrar: true },
    { name: 'Cancelado s/ Antecedência', cobrar: true },
    { name: 'Atestado', cobrar: false },
    { name: 'Confirmado', cobrar: false },
    { name: 'Cancelado Clínica', cobrar: false },
    { name: 'Cancelado Terapeuta', cobrar: false },
    { name: 'Feriado', cobrar: false },
  ];

  for (const rule of expected) {
    const item = findByName(statusList, rule.name);
    expect(item, `Status ausente no dropdown: ${rule.name}`).not.toBeNull();
    expect(Boolean(item?.cobrar), `Flag cobrar divergente para status: ${rule.name}`).toBe(rule.cobrar);
  }
}

test.describe('Financeiro - Regras de cobranca por status (integrado/API)', () => {
  test('terapeuta: valida matriz de status e consulta integrada cobravel vs nao cobravel', async ({
    request,
  }) => {
    const context = await resolveContext(request);

    const [statusList, therapists] = await Promise.all([
      getDropdown(request, context, 'status-eventos'),
      getDropdown(request, context, 'terapeuta'),
    ]);

    assertStatusMatrix(statusList);

    const therapist = findByName(therapists, context.therapistName) || therapists[0];
    expect(therapist, 'Nenhuma terapeuta encontrada para consulta financeira.').not.toBeNull();

    const chargeableStatus = findByName(statusList, context.chargeableStatusName);
    const nonChargeableStatus = findByName(statusList, context.nonChargeableStatusName);

    expect(chargeableStatus, 'Status cobravel nao encontrado no dropdown.').not.toBeNull();
    expect(nonChargeableStatus, 'Status nao cobravel nao encontrado no dropdown.').not.toBeNull();

    const chargeable = await fetchFinancial(request, context, 'terapeuta', {
      dataInicio: context.periodStart,
      datatFim: context.periodEnd,
      terapeutaId: therapist!.id,
      statusEventosId: chargeableStatus!.id,
    });

    const nonChargeable = await fetchFinancial(request, context, 'terapeuta', {
      dataInicio: context.periodStart,
      datatFim: context.periodEnd,
      terapeutaId: therapist!.id,
      statusEventosId: nonChargeableStatus!.id,
    });

    expect(typeof chargeable.total).toBe('number');
    expect(typeof nonChargeable.total).toBe('number');
  });

  test('paciente: valida matriz de status e consulta integrada cobravel vs nao cobravel', async ({
    request,
  }) => {
    const context = await resolveContext(request);

    const [statusList, patients] = await Promise.all([
      getDropdown(request, context, 'status-eventos'),
      getDropdown(request, context, 'paciente'),
    ]);

    assertStatusMatrix(statusList);

    const patient = findByName(patients, context.patientName) || patients[0];
    expect(patient, 'Nenhum paciente encontrado para consulta financeira.').not.toBeNull();

    const chargeableStatus = findByName(statusList, context.chargeableStatusName);
    const nonChargeableStatus = findByName(statusList, context.nonChargeableStatusName);

    expect(chargeableStatus, 'Status cobravel nao encontrado no dropdown.').not.toBeNull();
    expect(nonChargeableStatus, 'Status nao cobravel nao encontrado no dropdown.').not.toBeNull();

    const chargeable = await fetchFinancial(request, context, 'paciente', {
      dataInicio: context.periodStart,
      datatFim: context.periodEnd,
      pacienteId: patient!.id,
      statusEventosId: chargeableStatus!.id,
    });

    const nonChargeable = await fetchFinancial(request, context, 'paciente', {
      dataInicio: context.periodStart,
      datatFim: context.periodEnd,
      pacienteId: patient!.id,
      statusEventosId: nonChargeableStatus!.id,
    });

    expect(typeof chargeable.total).toBe('number');
    expect(typeof nonChargeable.total).toBe('number');
  });
});
