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

test.describe('Cadastro - Grupo Permissoes', () => {
  test('deve criar um grupo de permissoes', async ({ page }) => {
    await bootstrapCadastroPage(page);

    await openTab(page, 'Grupo Permissões');
    await openCrudModal(
      page,
      'cadastro-add-grupo-permissoes',
      'crud-form-grupo-permissoes'
    );

    await fillInVisibleModal(page, 'nome-field', 'Grupo Novo');

    await saveCrudModal(page, 'crud-save-grupo-permissoes');

    await expect(page.getByText('Grupo Novo').first()).toBeVisible();
  });

  test('deve editar um grupo de permissoes', async ({ page }) => {
    const state = await bootstrapCadastroPage(page);

    await openTab(page, 'Grupo Permissões');
    await clickFirstEditAction(page);
    await fillInVisibleModal(page, 'nome-field', 'Grupo Editado');
    await saveCrudModal(page, 'crud-save-grupo-permissoes');

    await expect
      .poll(() => state['grupo-permissoes'].some((item) => item.nome === 'Grupo Editado'))
      .toBeTruthy();
  });

  test('deve excluir (inativar) um grupo de permissoes', async ({ page }) => {
    const state = await bootstrapCadastroPage(page);

    await openTab(page, 'Grupo Permissões');
    await clickFirstTrashAction(page);
    await acceptConfirm(page);

    await expect
      .poll(() => state['grupo-permissoes'].some((item) => item.ativo === false))
      .toBeTruthy();
  });
});
