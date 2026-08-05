import { expect, test, Page } from '@playwright/test';

type Item = { id: number; nome: string; cobrar?: boolean };

const terapeutas: Item[] = [{ id: 27, nome: 'ALDA CARRARA' }];
const pacientes: Item[] = [{ id: 123, nome: 'Paciente E2E Financeiro' }];
const statusEventos: Item[] = [
  { id: 6, nome: 'Atendido', cobrar: true },
  { id: 4, nome: 'Falta', cobrar: true },
  { id: 11, nome: 'Cancelado s/ Antecedência', cobrar: true },
  { id: 3, nome: 'Atestado', cobrar: false },
  { id: 5, nome: 'Confirmado', cobrar: false },
  { id: 12, nome: 'Cancelado Clínica', cobrar: false },
];

function getBody(request: any): Record<string, any> {
  try {
    return request.postDataJSON();
  } catch {
    const raw = request.postData() || '{}';
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
}

function moneyRegex(value: number) {
  const formatted = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);

  const escaped = formatted.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
  return new RegExp(escaped.replace(/\s+/g, '\\s*'));
}

async function openFilterIfCollapsed(page: Page) {
  const header = page
    .locator('.p-accordion-header')
    .filter({ hasText: 'Filtro' })
    .first();

  if (await header.isVisible().catch(() => false)) {
    await header.click();
  }
}

async function setDropdown(page: Page, fieldTestId: string, option: string) {
  const field = page.getByTestId(fieldTestId).first();
  await field.locator('.p-dropdown').first().click();

  const item = page
    .locator('.p-dropdown-panel:visible .p-dropdown-item')
    .filter({ hasText: option })
    .first();

  await expect(item).toBeVisible();
  await item.click();
}

async function bootstrapFinancialPage(page: Page) {
  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();
    const path = url.pathname.replace('/api', '');

    const json = (body: unknown, status = 200) =>
      route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(body),
      });

    if (method === 'GET' && path === '/logout') {
      return json({ data: { success: true } });
    }

    if (method === 'GET' && path === '/terapeuta/dropdown') {
      return json(terapeutas);
    }

    if (method === 'GET' && path === '/paciente/dropdown') {
      return json(pacientes);
    }

    if (method === 'GET' && path === '/status-eventos/dropdown') {
      return json(statusEventos);
    }

    if (method === 'POST' && path === '/financeiro/terapeuta') {
      const body = getBody(request);
      const statusId = Number(body.statusEventosId);

      if (statusId === 6 || statusId === 4 || statusId === 11) {
        return json({
          geral: {
            nome: 'ALDA CARRARA',
            especialidade: 'Psicologia',
            horas: '02:00:00',
            valorKm: 20,
            valorTotal: 320,
          },
          data: {
            Psicologia: [
              {
                data: '2026-08-01',
                horas: '01:00:00',
                status: 'Atendido',
                km: 5,
                valorKm: 10,
                sessao: 150,
                valorSessao: 150,
                valorTotal: 160,
              },
              {
                data: '2026-08-02',
                horas: '01:00:00',
                status: 'Falta',
                km: 5,
                valorKm: 10,
                sessao: 150,
                valorSessao: 150,
                valorTotal: 160,
              },
            ],
          },
        });
      }

      return json({
        geral: {
          nome: 'ALDA CARRARA',
          especialidade: 'Psicologia',
          horas: '00:00:00',
          valorKm: 0,
          valorTotal: 0,
        },
        data: {
          Psicologia: [
            {
              data: '2026-08-03',
              horas: '01:00:00',
              status: 'Atestado',
              km: 0,
              valorKm: 0,
              sessao: 150,
              valorSessao: 0,
              valorTotal: 0,
            },
          ],
        },
      });
    }

    if (method === 'POST' && path === '/financeiro/paciente') {
      const body = getBody(request);
      const statusId = Number(body.statusEventosId);

      if (statusId === 6 || statusId === 4 || statusId === 11) {
        return json({
          geral: {
            horas: '02:00:00',
            valorKm: 20,
            valorTotal: 320,
            especialidadeSessoes: {
              Psicologia: '02:00:00',
            },
          },
          data: {
            Psicologia: [
              {
                data: '2026-08-01',
                horas: '01:00:00',
                status: 'Atendido',
                km: 5,
                valorKm: 10,
                valorSessao: 150,
                valorTotal: 160,
              },
              {
                data: '2026-08-02',
                horas: '01:00:00',
                status: 'Falta',
                km: 5,
                valorKm: 10,
                valorSessao: 150,
                valorTotal: 160,
              },
            ],
          },
        });
      }

      return json({
        geral: {
          horas: '00:00:00',
          valorKm: 0,
          valorTotal: 0,
          especialidadeSessoes: {
            Psicologia: '01:00:00',
          },
        },
        data: {
          Psicologia: [
            {
              data: '2026-08-03',
              horas: '01:00:00',
              status: 'Atestado',
              km: 0,
              valorKm: 0,
              valorSessao: 0,
              valorTotal: 0,
            },
          ],
        },
      });
    }

    return json({ data: [] });
  });

  await page.addInitScript(() => {
    const auth = {
      id: 999,
      login: 'e2e-admin',
      perfil: { nome: 'developer' },
      permissoes: [],
    };

    sessionStorage.setItem('token', 'e2e-token');
    sessionStorage.setItem('perfil', 'developer');
    sessionStorage.setItem('auth', JSON.stringify(auth));
  });

  await page.goto('/financeiro');
  await expect(page.getByRole('tablist')).toBeVisible();
}

test.describe('Financeiro - Regras de cobrança por status', () => {
  test('terapeuta: status cobravel compoe total e status nao cobravel zera total', async ({ page }) => {
    await bootstrapFinancialPage(page);

    await openFilterIfCollapsed(page);
    await setDropdown(page, 'terapeutaId-field', 'ALDA CARRARA');
    await setDropdown(page, 'statusEventosId-field', 'Atendido');
    await page.getByRole('button', { name: /Pesquisar/i }).first().click();

    await expect(page.getByText(moneyRegex(320))).toBeVisible();
    await expect(page.getByText('Atendido')).toBeVisible();

    await openFilterIfCollapsed(page);
    await setDropdown(page, 'statusEventosId-field', 'Atestado');
    await page.getByRole('button', { name: /Pesquisar/i }).first().click();

    await expect(page.getByText(moneyRegex(0))).toBeVisible();
    await expect(page.getByText('Atestado')).toBeVisible();
  });

  test('paciente: agrupamento por especialidade respeita status cobravel e nao cobravel', async ({ page }) => {
    await bootstrapFinancialPage(page);

    await page.getByRole('tab', { name: /Paciente/i }).first().click();
    await openFilterIfCollapsed(page);

    await setDropdown(page, 'pacienteId-field', 'Paciente E2E Financeiro');
    await setDropdown(page, 'statusEventosId-field', 'Atendido');
    await page.getByRole('button', { name: /Pesquisar/i }).first().click();

    await expect(page.getByText('Psicologia')).toBeVisible();
    await expect(page.getByText(moneyRegex(320))).toBeVisible();

    await openFilterIfCollapsed(page);
    await setDropdown(page, 'statusEventosId-field', 'Atestado');
    await page.getByRole('button', { name: /Pesquisar/i }).first().click();

    await expect(page.getByText('Psicologia')).toBeVisible();
    await expect(page.getByText(moneyRegex(0))).toBeVisible();
  });
});
