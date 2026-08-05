import { expect, test } from '@playwright/test';
import {
  bootstrapCadastroPage,
  clickFirstEditAction,
  clickFirstTrashAction,
  acceptConfirm,
  fillInVisibleModal,
  openCrudModal,
  openTab,
  saveCrudModal,
  setDropdownInVisibleModal,
} from './cadastros/support';

test.describe('Cadastro - Funcao', () => {
  test('deve criar uma funcao', async ({ page }) => {
    await bootstrapCadastroPage(page);

    await openTab(page, 'Função');
    await openCrudModal(page, 'cadastro-add-funcao', 'crud-form-funcao');

    await fillInVisibleModal(page, 'nome-field', 'Funcao E2E');
    await setDropdownInVisibleModal(page, 'especialidadeId-field', 'Fono');

    await saveCrudModal(page, 'crud-save-funcao');

    await expect(page.getByText('Funcao E2E').first()).toBeVisible();
  });

  test('deve editar uma funcao', async ({ page }) => {
    const state = await bootstrapCadastroPage(page);

    await openTab(page, 'Função');
    await clickFirstEditAction(page);
    await fillInVisibleModal(page, 'nome-field', 'Funcao Editada');
    await saveCrudModal(page, 'crud-save-funcao');

    await expect
      .poll(() => state.funcao.some((item) => item.nome === 'Funcao Editada'))
      .toBeTruthy();
  });

  test('deve excluir (inativar) uma funcao', async ({ page }) => {
    const state = await bootstrapCadastroPage(page);

    await openTab(page, 'Função');
    await clickFirstTrashAction(page);
    await acceptConfirm(page);

    await expect
      .poll(() => state.funcao.some((item) => item.ativo === false))
      .toBeTruthy();
  });
});
