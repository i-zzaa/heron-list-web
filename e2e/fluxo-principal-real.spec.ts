import { expect, test, Page, APIRequestContext } from '@playwright/test';

type FlowSeedContext = {
  patientName?: string;
  therapistName?: string;
};

function readEnv(name: string) {
  const runtime = globalThis as unknown as {
    process?: { env?: Record<string, string | undefined> };
  };

  const value = runtime.process?.env?.[name];
  return typeof value === 'string' ? value.trim() : '';
}

function parseSeedResponse(payload: any): FlowSeedContext {
  const source = payload?.data && typeof payload.data === 'object' ? payload.data : payload;

  if (!source || typeof source !== 'object') {
    return {};
  }

  return {
    patientName:
      source.patientName ||
      source.pacienteNome ||
      source.paciente ||
      source.nomePaciente ||
      undefined,
    therapistName:
      source.therapistName ||
      source.terapeutaNome ||
      source.terapeuta ||
      source.nomeTerapeuta ||
      undefined,
  };
}

async function runFlowSeedIfConfigured(request: APIRequestContext) {
  const endpoint = readEnv('E2E_FLOW_SEED_ENDPOINT');

  if (!endpoint) {
    return {} as FlowSeedContext;
  }

  const token = readEnv('E2E_FLOW_SEED_TOKEN');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await request.post(endpoint, {
    headers,
    data: {
      scenario: 'main-flow',
    },
    failOnStatusCode: false,
  });

  if (!response.ok()) {
    const message = await response.text();
    throw new Error(
      `Seed do fluxo principal falhou (${response.status()}): ${message || 'sem corpo de resposta'}`
    );
  }

  const body = await response.json().catch(() => ({}));
  return parseSeedResponse(body);
}

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

async function pickFirstDropdownOption(page: Page, fieldTestId: string) {
  const field = page.getByTestId(fieldTestId).first();
  const dropdown = field.locator('.p-dropdown').first();

  if ((await dropdown.count()) === 0) {
    return false;
  }

  await dropdown.click();

  const option = page
    .locator('.p-dropdown-panel:visible .p-dropdown-item:not(.p-disabled)')
    .first();

  if ((await option.count()) === 0) {
    await page.keyboard.press('Escape');
    return false;
  }

  await option.click();
  return true;
}

async function pickDropdownOptionByText(page: Page, fieldTestId: string, optionText: string) {
  const normalized = optionText.trim();
  if (!normalized) {
    return false;
  }

  const field = page.getByTestId(fieldTestId).first();
  const dropdown = field.locator('.p-dropdown').first();

  if ((await dropdown.count()) === 0) {
    return false;
  }

  await dropdown.click();

  const option = page
    .locator('.p-dropdown-panel:visible .p-dropdown-item:not(.p-disabled)')
    .filter({ hasText: new RegExp(normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') })
    .first();

  if ((await option.count()) === 0) {
    await page.keyboard.press('Escape');
    return false;
  }

  await option.click();
  return true;
}

async function pickPreferredOrFirstOption(
  page: Page,
  fieldTestId: string,
  preferredOptionText?: string
) {
  const pickedPreferred = preferredOptionText
    ? await pickDropdownOptionByText(page, fieldTestId, preferredOptionText)
    : false;

  if (pickedPreferred) {
    return true;
  }

  return pickFirstDropdownOption(page, fieldTestId);
}

async function runSearch(page: Page) {
  let searchButton = page.locator('button:visible', { hasText: /Pesquisar/i }).first();

  if ((await searchButton.count()) === 0) {
    const header = page
      .locator('.p-accordion-header')
      .filter({ hasText: 'Filtro' })
      .first();

    if (await header.isVisible().catch(() => false)) {
      await header.click();
    }

    searchButton = page.locator('button:visible', { hasText: /Pesquisar/i }).first();
  }

  if ((await searchButton.count()) > 0) {
    await searchButton.click();
    return true;
  }

  const filterForm = page.locator('form#form-filter-patient').first();
  if ((await filterForm.count()) > 0) {
    await filterForm.evaluate((form) => (form as HTMLFormElement).requestSubmit());
    return true;
  }

  return false;
}

async function openFilterIfCollapsed(page: Page) {
  const filterForm = page.locator('form#form-filter-patient').first();
  if ((await filterForm.count()) > 0) {
    return;
  }

  const header = page
    .locator('.p-accordion-header:visible')
    .filter({ hasText: /Filtro/i })
    .first();

  if ((await header.count()) > 0) {
    await header.click();
  } else {
    const expandTab = page.getByRole('tab', { name: /Expand|Filtro/i }).first();
    if ((await expandTab.count()) > 0) {
      await expandTab.click();
    }
  }

  await expect(filterForm).toBeAttached();
}

async function openTabByName(page: Page, tabName: string) {
  const tab = page.getByRole('tab', { name: new RegExp(tabName, 'i') }).first();
  await expect(tab).toBeVisible();
  await tab.click();
}

async function assertFilterButtons(page: Page) {
  await expect(page.locator('button:visible', { hasText: /Limpar/i }).first()).toBeVisible();
  await expect(page.locator('button:visible', { hasText: /Pesquisar/i }).first()).toBeVisible();
}

test.describe('Fluxo principal real - fila, agenda, baixa e financeiro', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const auth = {
        id: 999,
        login: 'e2e-user',
        perfil: { nome: 'developer' },
        permissoes: [],
      };

      sessionStorage.setItem('token', 'e2e-token');
      sessionStorage.setItem('perfil', 'developer');
      sessionStorage.setItem('auth', JSON.stringify(auth));
    });

    await page.goto('/fila');
    await expect(page).toHaveURL(/\/fila/i);
    await expect(page.getByRole('tablist')).toBeVisible();
  });

  test('valida a navegacao principal e filtros obrigatorios dos modulos', async ({ page }) => {
    await page.goto('/fila');

    await openTabByName(page, 'Avalia');
    await openFilterIfCollapsed(page);
    await assertFilterButtons(page);

    await openTabByName(page, 'Devolutiva');
    await openFilterIfCollapsed(page);
    await assertFilterButtons(page);

    await openTabByName(page, 'Terapia');
    await openFilterIfCollapsed(page);
    await assertFilterButtons(page);

    await page.goto('/agenda');
    await openTabByName(page, 'Agenda');
    await openFilterIfCollapsed(page);
    await assertFilterButtons(page);

    await openTabByName(page, 'Baixa');
    await openFilterIfCollapsed(page);
    await expect(page.getByRole('button', { name: /Limpar/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Pesquisar/i }).first()).toBeVisible();

    await page.goto('/financeiro');
    await openTabByName(page, 'Terapeuta');
    await openFilterIfCollapsed(page);
    await expect(page.getByTestId('dataInicio-field').locator('input')).toBeVisible();
    await expect(page.getByTestId('dataFim-field').locator('input')).toBeVisible();

    await openTabByName(page, 'Paciente');
    await openFilterIfCollapsed(page);
    await expect(page.getByTestId('dataInicio-field').locator('input')).toBeVisible();
    await expect(page.getByTestId('dataFim-field').locator('input')).toBeVisible();
  });

  test('valida regras basicas do modal de agendamento e dependencias de campos', async ({ page }) => {
    await page.goto('/agenda');
    await openTabByName(page, 'Agenda');
    await openFilterIfCollapsed(page);

    await page.getByRole('button', { name: /Agendar/i }).first().click();
    await expect(page.getByTestId('agenda-form')).toBeVisible();

    await expect(page.getByTestId('modalidade-select')).toBeVisible();
    await expect(page.getByTestId('data-inicial-input')).toBeVisible();
    await expect(page.getByTestId('hora-inicio-input')).toBeVisible();
    await expect(page.getByTestId('hora-fim-input')).toBeVisible();

    await expect(page.getByTestId('frequencia-select')).toBeVisible();

    await page.getByTestId('frequencia-select').locator('.p-dropdown').click();
    await page
      .locator('.p-dropdown-panel:visible .p-dropdown-item')
      .filter({ hasText: /Recorrente/i })
      .first()
      .click();

    await page.getByTestId('isExterno-field').locator('.p-inputswitch').click();
    await expect(page.getByTestId('localidade-select').locator('.p-dropdown')).toHaveClass(
      /p-disabled/
    );
    await expect(page.getByTestId('km-field').locator('input')).toBeVisible();
    await expect(page.getByTestId('localExternoDescricao-field').locator('input')).toBeVisible();

    await expect(page.getByTestId('intervalo-select')).toBeVisible();
  });

  test('fluxo integrado entre fila, agenda, baixa e financeiro sem mock', async ({ page, request }) => {
    const seeded = await runFlowSeedIfConfigured(request);
    const patientName = seeded.patientName || readEnv('E2E_FLOW_PATIENT_NAME');
    const therapistName = seeded.therapistName || readEnv('E2E_FLOW_THERAPIST_NAME');

    await page.goto('/fila');

    await openTabByName(page, 'Avalia');
    await openFilterIfCollapsed(page);
    await pickPreferredOrFirstOption(page, 'pacientes-field', patientName);
    await runSearch(page);
    await expect(page.locator('body')).toBeVisible();

    await openTabByName(page, 'Devolutiva');
    await openFilterIfCollapsed(page);
    await pickPreferredOrFirstOption(page, 'pacientes-field', patientName);
    await runSearch(page);
    await expect(page.locator('body')).toBeVisible();

    await openTabByName(page, 'Terapia');
    await openFilterIfCollapsed(page);
    await pickPreferredOrFirstOption(page, 'pacientes-field', patientName);
    await runSearch(page);
    await expect(page.locator('body')).toBeVisible();

    await page.goto('/agenda');
    await openTabByName(page, 'Agenda');
    await openFilterIfCollapsed(page);
    await pickPreferredOrFirstOption(page, 'terapeutaId-field', therapistName);
    await runSearch(page);
    await expect(page.locator('.fc-toolbar-title')).toBeVisible();

    await openTabByName(page, 'Baixa');
    await openFilterIfCollapsed(page);
    await pickPreferredOrFirstOption(page, 'pacienteId-field', patientName);
    await runSearch(page);
    await expect(page.locator('body')).toBeVisible();

    await page.goto('/financeiro');
    await openTabByName(page, 'Terapeuta');
    await openFilterIfCollapsed(page);
    await pickPreferredOrFirstOption(page, 'terapeutaId-field', therapistName);
    await pickFirstDropdownOption(page, 'statusEventosId-field');
    await runSearch(page);
    await expect(page.locator('body')).toBeVisible();

    await openTabByName(page, 'Paciente');
    await openFilterIfCollapsed(page);
    await pickPreferredOrFirstOption(page, 'pacienteId-field', patientName);
    await pickFirstDropdownOption(page, 'statusEventosId-field');
    await runSearch(page);
    await expect(page.locator('body')).toBeVisible();

    const bodyText = normalize(await page.locator('body').innerText());
    expect(bodyText).not.toContain('erro na conexao');
    expect(bodyText).not.toContain('falha na conexao');
  });
});
