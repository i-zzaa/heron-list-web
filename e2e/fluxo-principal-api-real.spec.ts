import { expect, test, APIRequestContext } from '@playwright/test';

type AuthContext = {
  baseUrl: string;
  login: string;
  token: string;
};

function readEnv(name: string) {
  const runtime = globalThis as unknown as {
    process?: { env?: Record<string, string | undefined> };
  };

  const value = runtime.process?.env?.[name];
  return typeof value === 'string' ? value.trim() : '';
}

async function resolveAuth(request: APIRequestContext): Promise<AuthContext> {
  const baseUrl = readEnv('E2E_API_URL');
  const login = readEnv('E2E_LOGIN');
  const password = readEnv('E2E_PASSWORD');

  if (!baseUrl || !login || !password) {
    throw new Error('Configure E2E_API_URL, E2E_LOGIN e E2E_PASSWORD para executar o fluxo integrado API.');
  }

  const parsedPassword = Number(password);
  const response = await request.post(`${baseUrl}/login`, {
    headers: { 'Content-Type': 'application/json' },
    data: {
      username: login,
      password: Number.isFinite(parsedPassword) ? parsedPassword : password,
    },
    failOnStatusCode: false,
  });

  if (!response.ok()) {
    const body = await response.text();
    throw new Error(`Falha no login API (${response.status()}): ${body || 'sem corpo'}`);
  }

  const payload = await response.json().catch(() => ({}));
  const token = payload?.accessToken || payload?.data?.accessToken;

  if (!token) {
    throw new Error('Falha no login API: accessToken ausente na resposta.');
  }

  return {
    baseUrl,
    login,
    token,
  };
}

async function apiPost(
  request: APIRequestContext,
  auth: AuthContext,
  path: string,
  body: Record<string, any>,
  query = ''
) {
  const url = `${auth.baseUrl}${path}${query}`;
  const response = await request.post(url, {
    headers: {
      Authorization: `Bearer ${auth.token}`,
      login: auth.login,
      'Content-Type': 'application/json',
    },
    data: body,
    failOnStatusCode: false,
  });

  if (!response.ok()) {
    const payload = await response.text();
    throw new Error(`Falha ${path} (${response.status()}): ${payload || 'sem corpo'}`);
  }

  return response.json().catch(() => ({}));
}

function assertFinancialShape(payload: any, label: string) {
  expect(payload, `${label} sem payload`).toBeTruthy();

  const hasDefaultShape = payload?.geral !== undefined && payload?.data !== undefined;
  const hasLegacyShape = payload?.valorTotal !== undefined && payload?.data !== undefined;

  expect(hasDefaultShape || hasLegacyShape, `${label} em formato invalido`).toBe(true);
}

async function apiGet(request: APIRequestContext, auth: AuthContext, path: string) {
  const response = await request.get(`${auth.baseUrl}${path}`, {
    headers: {
      Authorization: `Bearer ${auth.token}`,
      login: auth.login,
    },
    failOnStatusCode: false,
  });

  if (!response.ok()) {
    const payload = await response.text();
    throw new Error(`Falha ${path} (${response.status()}): ${payload || 'sem corpo'}`);
  }

  return response.json().catch(() => ({}));
}

function assertPaginatedList(payload: any, label: string) {
  expect(payload, `${label} sem payload`).toBeTruthy();
  expect(Array.isArray(payload?.data), `${label} sem lista data`).toBe(true);
}

function assertBaixaList(payload: any) {
  expect(payload, 'baixa sem payload').toBeTruthy();

  const list = Array.isArray(payload?.data)
    ? payload.data
    : Array.isArray(payload?.data?.data)
    ? payload.data.data
    : null;

  expect(Array.isArray(list), 'baixa sem lista data').toBe(true);
}

test.describe('Fluxo principal integrado por API', () => {
  test('fila avaliacao/devolutiva/terapia, baixa e financeiro respondem com contrato valido', async ({
    request,
  }) => {
    const auth = await resolveAuth(request);

    const [queueAvaliation, queueDevolutiva, queueTherapy, therapy, baixa] = await Promise.all([
      apiPost(request, auth, '/paciente/filtro', { statusPacienteCod: 'queue_avaliation' }, '?page=1&pageSize=5'),
      apiPost(request, auth, '/paciente/filtro', { statusPacienteCod: 'queue_devolutiva' }, '?page=1&pageSize=5'),
      apiPost(request, auth, '/paciente/filtro', { statusPacienteCod: 'queue_therapy' }, '?page=1&pageSize=5'),
      apiPost(request, auth, '/paciente/filtro', { statusPacienteCod: 'therapy' }, '?page=1&pageSize=5'),
      apiPost(request, auth, '/baixa/filtro', {}, '?page=1&pageSize=5'),
    ]);

    assertPaginatedList(queueAvaliation, 'queue_avaliation');
    assertPaginatedList(queueDevolutiva, 'queue_devolutiva');
    assertPaginatedList(queueTherapy, 'queue_therapy');
    assertPaginatedList(therapy, 'therapy');
    assertBaixaList(baixa);

    const firstTherapyPatient = (therapy?.data || [])[0];
    expect(firstTherapyPatient, 'Nenhum paciente encontrado em therapy para fluxo financeiro.').toBeTruthy();

    const [statusList, therapists] = await Promise.all([
      apiGet(request, auth, '/status-eventos/dropdown'),
      apiGet(request, auth, '/terapeuta/dropdown'),
    ]);

    const statusArray = (statusList?.data || statusList || []) as Array<any>;
    const therapistArray = (therapists?.data || therapists || []) as Array<any>;

    expect(statusArray.length).toBeGreaterThan(0);
    expect(therapistArray.length).toBeGreaterThan(0);

    const financialPayload = {
      dataInicio: readEnv('E2E_FINANCIAL_PERIOD_START') || '2026-01-01',
      datatFim: readEnv('E2E_FINANCIAL_PERIOD_END') || '2026-12-31',
      terapeutaId: therapistArray[0].id,
      statusEventosId: statusArray[0].id,
    };

    const financialTherapist = await apiPost(request, auth, '/financeiro/terapeuta', financialPayload);
    const financialPatient = await apiPost(request, auth, '/financeiro/paciente', {
      dataInicio: financialPayload.dataInicio,
      datatFim: financialPayload.datatFim,
      pacienteId: firstTherapyPatient.id,
      statusEventosId: statusArray[0].id,
    });

    assertFinancialShape(financialTherapist, 'financeiro terapeuta');
    assertFinancialShape(financialPatient, 'financeiro paciente');
  });
});
