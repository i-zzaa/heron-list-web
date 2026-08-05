import { expect, test } from '@playwright/test';

test('Desloga automaticamente por inatividade', async ({ page }) => {
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

    if (method === 'GET' && path === '/') {
      return json('backend-e2e-ok');
    }

    if (method === 'POST' && path === '/login') {
      return json({
        user: {
          id: 999,
          nome: 'Usuario E2E',
          login: 'usuario.teste',
          perfil: { nome: 'developer' },
          permissoes: [],
        },
        accessToken: 'e2e-token',
      });
    }

    if (method === 'GET' && path === '/logout') {
      return json({ data: { success: true } });
    }

    return json({ data: [] });
  });

  await page.addInitScript(() => {
    const nativeSetTimeout = window.setTimeout.bind(window);

    window.setTimeout = ((handler: TimerHandler, timeout?: number, ...args: any[]) => {
      const numericTimeout = typeof timeout === 'number' ? timeout : Number(timeout) || 0;
      const reducedTimeout = numericTimeout > 1500 ? 1500 : numericTimeout;

      return nativeSetTimeout(handler, reducedTimeout, ...args);
    }) as typeof window.setTimeout;
  });

  await page.goto('/');

  await page.getByTestId('username-field').locator('input').fill('usuario.teste');
  await page.getByTestId('password-field').locator('input').fill('12345678');
  await page.getByRole('button', { name: 'Entrar' }).click();

  await expect(page.getByText('Bem vindo!')).toBeVisible();

  await expect(page.getByText('Você foi deslogado por inatividade.')).toBeVisible({
    timeout: 10_000,
  });

  await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();
  await expect(page.getByTestId('username-field').locator('input')).toBeVisible();
});
