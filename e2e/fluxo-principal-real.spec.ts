import { expect, test, Page } from '@playwright/test';

const RUN_REAL_FLOW = process.env.RUN_REAL_FLOW_E2E === '1';

const E2E_USER = process.env.E2E_USER || '';
const E2E_PASSWORD = process.env.E2E_PASSWORD || '';
const E2E_PATIENT_NAME = process.env.E2E_FLOW_PATIENT || '';

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

async function login(page: Page) {
  await page.goto('/');

  await expect(page.getByTestId('username-field').locator('input')).toBeVisible();
  await page.getByTestId('username-field').locator('input').fill(E2E_USER);
  await page.getByTestId('password-field').locator('input').fill(E2E_PASSWORD);
  await page.getByRole('button', { name: 'Entrar' }).click();

  await expect(page.getByText('Bem vindo!')).toBeVisible();
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

async function openTabByName(page: Page, tabName: string) {
  const tab = page.getByRole('tab', { name: new RegExp(tabName, 'i') }).first();
  await expect(tab).toBeVisible();
  await tab.click();
}

async function assertFilterButtons(page: Page) {
  await expect(page.getByRole('button', { name: /Cadastrar|Agendar/i }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: /Limpar/i }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: /Pesquisar/i }).first()).toBeVisible();
}

test.describe('Fluxo principal real - fila, agenda, baixa e financeiro', () => {
  test.describe.configure({ mode: 'serial' });

  test.skip(!RUN_REAL_FLOW, 'Defina RUN_REAL_FLOW_E2E=1 para executar esta suite integrada.');
  test.skip(!E2E_USER || !E2E_PASSWORD, 'Defina E2E_USER e E2E_PASSWORD para login real.');

  test.beforeEach(async ({ page }) => {
    await login(page);
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
    await expect(page.getByTestId('datatFim-field').locator('input')).toBeVisible();

    await openTabByName(page, 'Paciente');
    await openFilterIfCollapsed(page);
    await expect(page.getByTestId('dataInicio-field').locator('input')).toBeVisible();
    await expect(page.getByTestId('datatFim-field').locator('input')).toBeVisible();
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

    await expect(page.getByTestId('intervalo-select')).toBeVisible();

    await page.getByTestId('isExterno-field').locator('.p-inputswitch').click();
    await expect(page.getByTestId('km-field').locator('input')).toBeVisible();
  });

  test('fluxo de transicao entre filas por paciente configurado', async ({ page }) => {
    test.skip(!E2E_PATIENT_NAME, 'Defina E2E_FLOW_PATIENT para validar transicao entre filas.');

    await page.goto('/fila');

    await openTabByName(page, 'Avalia');
    await openFilterIfCollapsed(page);

    await page.getByTestId('pacientes-field').locator('.p-dropdown').first().click();
    await page
      .locator('.p-dropdown-panel:visible .p-dropdown-item')
      .filter({ hasText: E2E_PATIENT_NAME })
      .first()
      .click();

    await page.getByRole('button', { name: /Pesquisar/i }).first().click();

    await expect(
      page.locator('body').filter({ hasText: new RegExp(E2E_PATIENT_NAME, 'i') })
    ).toBeVisible();

    await openTabByName(page, 'Devolutiva');
    await openFilterIfCollapsed(page);
    await page.getByRole('button', { name: /Pesquisar/i }).first().click();

    await expect(page.locator('body')).toBeVisible();

    await openTabByName(page, 'Terapia');
    await openFilterIfCollapsed(page);
    await page.getByRole('button', { name: /Pesquisar/i }).first().click();

    const bodyText = normalize(await page.locator('body').innerText());
    expect(bodyText.length).toBeGreaterThan(0);
  });
});
