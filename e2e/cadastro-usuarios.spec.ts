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
  setDropdownInVisibleModal,
} from './cadastros/support';

test.describe('Cadastro - Usuarios', () => {
  test('deve criar um usuario basico', async ({ page }) => {
    await bootstrapCadastroPage(page);

    await openTab(page, 'Usuários');
    await openCrudModal(page, 'cadastro-add-usuarios', 'crud-form-usuarios');

    await fillInVisibleModal(page, 'nome-field', 'Usuario Teste');
    await fillInVisibleModal(page, 'login-field', 'usuario.teste');
    await setDropdownInVisibleModal(page, 'perfilId-field', 'Developer');
    await setDropdownInVisibleModal(page, 'grupoPermissaoId-field', 'Admin');

    await saveCrudModal(page, 'crud-save-usuarios');

    await expect(page.getByText('Usuario Teste').first()).toBeVisible();
    await expect(page.getByText('usuario.teste').first()).toBeVisible();
  });

  test('deve editar um usuario', async ({ page }) => {
    const state = await bootstrapCadastroPage(page);

    await openTab(page, 'Usuários');
    await clickFirstEditAction(page);
    await fillInVisibleModal(page, 'nome-field', 'Usuario Editado');
    await fillInVisibleModal(page, 'login-field', 'usuario.editado');
    await saveCrudModal(page, 'crud-save-usuarios');

    await expect
      .poll(
        () =>
          state.usuarios.some(
            (item) => item.nome === 'Usuario Editado' && item.login === 'usuario.editado'
          )
      )
      .toBeTruthy();
  });

  test('deve excluir (inativar) um usuario', async ({ page }) => {
    const state = await bootstrapCadastroPage(page);

    await openTab(page, 'Usuários');
    await clickFirstTrashAction(page);
    await acceptConfirm(page);

    await expect
      .poll(() => state.usuarios.some((item) => item.ativo === false))
      .toBeTruthy();
  });
});
