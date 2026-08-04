import { expect, test } from '@playwright/test';
import {
  acceptConfirm,
  bootstrapCadastroPage,
  clickFirstEditAction,
  clickFirstTrashAction,
  fillInVisibleModal,
  openCrudModal,
  openTab,
  saveCrudModal,
} from './cadastros/support';

test.describe('Cadastro - Especialidade', () => {
  test('deve criar uma especialidade', async ({ page }) => {
    await bootstrapCadastroPage(page);

    await openTab(page, 'Especialidade');
    await openCrudModal(
      page,
      'cadastro-add-especialidade',
      'crud-form-especialidade'
    );

    await fillInVisibleModal(page, 'nome-field', 'Especialidade E2E');
    await saveCrudModal(page, 'crud-save-especialidade');

    await expect(page.getByText('Especialidade E2E').first()).toBeVisible();
  });

  test('deve editar uma especialidade', async ({ page }) => {
    const state = await bootstrapCadastroPage(page);

    await openTab(page, 'Especialidade');
    await clickFirstEditAction(page);
    await fillInVisibleModal(page, 'nome-field', 'Especialidade Editada');
    await saveCrudModal(page, 'crud-save-especialidade');

    await expect
      .poll(() =>
        state.especialidade.some((item) => item.nome === 'Especialidade Editada')
      )
      .toBeTruthy();
  });

  test('deve excluir (inativar) uma especialidade', async ({ page }) => {
    const state = await bootstrapCadastroPage(page);

    await openTab(page, 'Especialidade');
    await clickFirstTrashAction(page);
    await acceptConfirm(page);

    await expect
      .poll(() => state.especialidade.some((item) => item.ativo === false))
      .toBeTruthy();
  });
});
