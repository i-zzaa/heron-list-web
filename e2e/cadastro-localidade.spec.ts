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
} from './cadastros/support';

test.describe('Cadastro - Localidade', () => {
  test('deve criar uma localidade', async ({ page }) => {
    await bootstrapCadastroPage(page);

    await openTab(page, 'Localidade');
    await openCrudModal(page, 'cadastro-add-localidade', 'crud-form-localidade');

    await fillInVisibleModal(page, 'casa-field', 'Casa E2E');
    await fillInVisibleModal(page, 'sala-field', 'Sala E2E');

    await saveCrudModal(page, 'crud-save-localidade');

    await expect(page.getByText('Casa E2E').first()).toBeVisible();
    await expect(page.getByText('Sala E2E').first()).toBeVisible();
  });

  test('deve editar uma localidade', async ({ page }) => {
    const state = await bootstrapCadastroPage(page);

    await openTab(page, 'Localidade');
    await clickFirstEditAction(page);
    await fillInVisibleModal(page, 'casa-field', 'Casa Editada');
    await fillInVisibleModal(page, 'sala-field', 'Sala Editada');
    await saveCrudModal(page, 'crud-save-localidade');

    await expect
      .poll(
        () =>
          state.localidade.some(
            (item) => item.casa === 'Casa Editada' && item.sala === 'Sala Editada'
          )
      )
      .toBeTruthy();
  });

  test('deve excluir (inativar) uma localidade', async ({ page }) => {
    const state = await bootstrapCadastroPage(page);

    await openTab(page, 'Localidade');
    await clickFirstTrashAction(page);
    await acceptConfirm(page);

    await expect
      .poll(() => state.localidade.some((item) => item.ativo === false))
      .toBeTruthy();
  });
});
