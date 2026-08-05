import { expect, test } from '@playwright/test';
import {
  acceptConfirm,
  bootstrapCadastroPage,
  clickFirstEditAction,
  clickFirstTrashAction,
  fillInVisibleModal,
  setDropdownInVisibleModal,
  setMultiSelectInVisibleModal,
} from './cadastros/support';

test.describe('Cadastro - Paciente', () => {
  test('deve abrir formulario e cadastrar paciente basico', async ({ page }) => {
    await bootstrapCadastroPage(page);

    await page.getByRole('tab', { name: /Pacientes/i }).first().click();
    await page.getByRole('tab', { name: /Expand/i }).first().click();

    const btnAdd = page.locator('[data-testid="patient-add"]:visible').first();
    await expect(btnAdd).toBeVisible();
    await btnAdd.click();

    await expect(page.getByTestId('patient-form')).toBeVisible();

    await fillInVisibleModal(page, 'nome-field', 'Paciente Teste');
    await fillInVisibleModal(page, 'carteirinha-field', 'ABC12345');
    await fillInVisibleModal(page, 'dataNascimento-field', '2000-01-01');
    await fillInVisibleModal(page, 'responsavel-field', 'Responsavel Legal');
    await fillInVisibleModal(page, 'telefone-field', '11999998888');
    await setDropdownInVisibleModal(page, 'convenioId-field', 'Particular');
    await setMultiSelectInVisibleModal(page, 'especialidades-field', 'Fono');

    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes('/api/paciente') &&
        response.request().method() === 'POST'
    );
    await page
      .locator('.p-dialog:visible [data-testid="patient-save"]')
      .first()
      .click({ force: true });
    await responsePromise;

    await expect(page.getByText('Paciente Teste').first()).toBeVisible();
  });

  test('deve editar um paciente', async ({ page }) => {
    const state = await bootstrapCadastroPage(page);

    await page.getByRole('tab', { name: /Pacientes/i }).first().click();
    await clickFirstEditAction(page);
    await expect(page.getByTestId('patient-form')).toBeVisible();

    await fillInVisibleModal(page, 'nome-field', 'Paciente Editado');
    await fillInVisibleModal(page, 'carteirinha-field', 'EDIT12345');
    await fillInVisibleModal(page, 'dataNascimento-field', '2001-01-01');
    await fillInVisibleModal(page, 'responsavel-field', 'Responsavel Editado');
    await fillInVisibleModal(page, 'telefone-field', '11911112222');
    await setDropdownInVisibleModal(page, 'convenioId-field', 'Particular');
    await setMultiSelectInVisibleModal(page, 'especialidades-field', 'Fono');

    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes('/api/paciente') &&
        response.request().method() === 'PUT'
    );
    await page
      .locator('.p-dialog:visible [data-testid="patient-save"]')
      .first()
      .click({ force: true });
    await responsePromise;

    await expect
      .poll(() => state.pacientes.some((item) => item.nome === 'Paciente Editado'))
      .toBeTruthy();
  });

  test('deve excluir (inativar) um paciente', async ({ page }) => {
    const state = await bootstrapCadastroPage(page);

    await page.getByRole('tab', { name: /Pacientes/i }).first().click();
    await clickFirstTrashAction(page);
    await acceptConfirm(page);

    await expect
      .poll(() => state.pacientes.some((item) => item.disabled === true))
      .toBeTruthy();
  });
});
