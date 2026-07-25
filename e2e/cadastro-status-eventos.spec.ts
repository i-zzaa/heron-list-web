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

test.describe('Cadastro - Status Eventos', () => {
  test('deve criar um status de evento', async ({ page }) => {
    const state = await bootstrapCadastroPage(page);

    await openTab(page, 'Status eventos');
    await openCrudModal(page, 'cadastro-add-status-eventos', 'crud-form-status-eventos');

    await fillInVisibleModal(page, 'nome-field', 'Confirmado');
    await saveCrudModal(page, 'crud-save-status-eventos');

    await expect
      .poll(() =>
        state['status-eventos'].some((item) => item.nome === 'Confirmado')
      )
      .toBeTruthy();
    await expect(page.getByTestId('crud-form-status-eventos')).toHaveCount(0);
  });

  test('deve editar um status de evento', async ({ page }) => {
    const state = await bootstrapCadastroPage(page);

    await openTab(page, 'Status eventos');
    await clickFirstEditAction(page);
    await fillInVisibleModal(page, 'nome-field', 'Reagendado');
    await saveCrudModal(page, 'crud-save-status-eventos');

    await expect
      .poll(() => state['status-eventos'].some((item) => item.nome === 'Reagendado'))
      .toBeTruthy();
  });

  test('deve excluir (inativar) um status de evento', async ({ page }) => {
    const state = await bootstrapCadastroPage(page);

    await openTab(page, 'Status eventos');
    await clickFirstTrashAction(page);
    await acceptConfirm(page);

    await expect
      .poll(() => state['status-eventos'].some((item) => item.ativo === false))
      .toBeTruthy();
  });
});
