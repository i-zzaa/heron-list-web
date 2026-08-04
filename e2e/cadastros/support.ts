import { expect, Page } from '@playwright/test';

type Option = { id: number; nome: string };

type Usuario = {
  id: number;
  nome: string;
  login: string;
  perfil: Option;
  grupoPermissao: Option;
  ativo: boolean;
};

type Funcao = {
  id: number;
  nome: string;
  especialidade?: Option | null;
  ativo: boolean;
};

type Especialidade = {
  id: number;
  nome: string;
  ativo: boolean;
};

type Localidade = {
  id: number;
  casa: string;
  sala: string;
  ativo: boolean;
};

type StatusEvento = {
  id: number;
  nome: string;
  cobrar: boolean;
  ativo: boolean;
};

type GrupoPermissao = {
  id: number;
  nome: string;
  permissoesId: number[];
  ativo: boolean;
};

type Paciente = {
  id: number;
  nome: string;
  disabled?: boolean;
};

type MockState = {
  usuarios: Usuario[];
  especialidade: Especialidade[];
  funcao: Funcao[];
  localidade: Localidade[];
  'status-eventos': StatusEvento[];
  'grupo-permissoes': GrupoPermissao[];
  pacientes: Paciente[];
};

const perfis: Option[] = [
  { id: 1, nome: 'Developer' },
  { id: 2, nome: 'Terapeuta' },
];

const permissoes: Option[] = [
  { id: 1, nome: 'CADASTRO_USUARIOS' },
  { id: 2, nome: 'CADASTRO_STATUS_EVENTOS' },
  { id: 3, nome: 'CADASTRO_PACIENTES' },
];

const especialidades: Option[] = [
  { id: 1, nome: 'Fono' },
  { id: 2, nome: 'Psicologia' },
];

const gruposPermissao: Option[] = [
  { id: 1, nome: 'Admin' },
  { id: 2, nome: 'Atendente' },
];

const convenios: Option[] = [{ id: 1, nome: 'Particular' }];
const periodos: Option[] = [{ id: 1, nome: 'Integral' }];
const tiposSessao: Option[] = [{ id: 1, nome: 'Terapeuta' }];
const statusPaciente: Option[] = [{ id: 1, nome: 'Padrão' }];

function paginatedResponse<T>(items: T[]) {
  return {
    data: items,
    pagination: {
      currentPage: 1,
      pageSize: 10,
      totalPages: 1,
    },
  };
}

function getBody(request: any): Record<string, any> {
  try {
    return request.postDataJSON();
  } catch {
    const raw = request.postData() || '{}';
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
}

export function createMockState(): MockState {
  return {
    usuarios: [
      {
        id: 1,
        nome: 'Usuario Base',
        login: 'usuario.base',
        perfil: perfis[0],
        grupoPermissao: gruposPermissao[0],
        ativo: true,
      },
    ],
    especialidade: [
      {
        id: 1,
        nome: 'Fono',
        ativo: true,
      },
    ],
    funcao: [
      {
        id: 1,
        nome: 'Funcao Base',
        especialidade: especialidades[0],
        ativo: true,
      },
    ],
    localidade: [
      {
        id: 1,
        casa: 'Casa Base',
        sala: 'Sala Base',
        ativo: true,
      },
    ],
    'status-eventos': [
      {
        id: 1,
        nome: 'Avisar',
        cobrar: false,
        ativo: true,
      },
    ],
    'grupo-permissoes': [
      {
        id: 1,
        nome: 'Grupo Base',
        permissoesId: [1],
        ativo: true,
      },
    ],
    pacientes: [
      {
        id: 1,
        nome: 'Paciente Base',
        disabled: false,
      },
    ],
  };
}

export function createCrudRouteHandler(state: MockState) {
  const counters = {
    usuarios: 100,
    especialidade: 100,
    funcao: 100,
    localidade: 100,
    'status-eventos': 100,
    'grupo-permissoes': 100,
    pacientes: 100,
  };

  return async (route: any) => {
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

    if (method === 'GET' && path === '/logout') {
      return json({ data: { success: true } });
    }

    if (method === 'GET' && path === '/funcao/dropdown') {
      return json(state.funcao.map((item) => ({ id: item.id, nome: item.nome })));
    }

    if (method === 'GET' && path === '/especialidade/dropdown') {
      return json(state.especialidade.map((item) => ({ id: item.id, nome: item.nome })));
    }

    if (method === 'GET' && path === '/perfil/dropdown') {
      return json(perfis);
    }

    if (method === 'GET' && path === '/permissao/dropdown') {
      return json(permissoes);
    }

    if (method === 'GET' && path === '/grupo-permissoes/dropdown') {
      return json(gruposPermissao);
    }

    if (method === 'GET' && path === '/convenio/dropdown') {
      return json(convenios);
    }

    if (method === 'GET' && path === '/periodo/dropdown') {
      return json(periodos);
    }

    if (method === 'GET' && path === '/tipo-sessao/dropdown') {
      return json(tiposSessao);
    }

    if (method === 'GET' && path.startsWith('/status')) {
      return json(statusPaciente);
    }

    if (method === 'GET' && path === '/paciente/dropdown') {
      return json(state.pacientes.map((item) => ({ id: item.id, nome: item.nome })));
    }

    if (method === 'GET' && path === '/funcao/especialidade/dropdown') {
      return json(state.funcao.map((item) => ({ id: item.id, nome: item.nome })));
    }

    if (method === 'POST' && path === '/paciente/filtro') {
      return json(paginatedResponse(state.pacientes));
    }

    if (
      method === 'GET' &&
      /^\/(usuarios|especialidade|funcao|localidade|status-eventos|grupo-permissoes)$/.test(path)
    ) {
      const key = path.slice(1) as keyof MockState;
      return json(paginatedResponse(state[key] as any[]));
    }

    if (method === 'GET' && path.startsWith('/usuarios/reset-senha/')) {
      return json({ message: 'Senha resetada com sucesso' });
    }

    if (
      method === 'POST' &&
      /^\/(usuarios|especialidade|funcao|localidade|status-eventos|grupo-permissoes)$/.test(path)
    ) {
      const key = path.slice(1) as keyof MockState;
      const body = getBody(request);
      const id = counters[key as keyof typeof counters]++;

      if (key === 'especialidade') {
        const nova: Especialidade = {
          id,
          nome: body.nome,
          ativo: true,
        };
        state.especialidade.push(nova);
      }

      if (key === 'usuarios') {
        const novo: Usuario = {
          id,
          nome: body.nome,
          login: body.login,
          perfil: perfis.find((item) => item.id === body.perfilId) || perfis[0],
          grupoPermissao:
            gruposPermissao.find((item) => item.id === body.grupoPermissaoId) ||
            gruposPermissao[0],
          ativo: true,
        };
        state.usuarios.push(novo);
      }

      if (key === 'funcao') {
        const nova: Funcao = {
          id,
          nome: body.nome,
          especialidade:
            state.especialidade.find((item) => item.id === body.especialidadeId) || null,
          ativo: true,
        };
        state.funcao.push(nova);
      }

      if (key === 'localidade') {
        const nova: Localidade = {
          id,
          casa: body.casa,
          sala: body.sala,
          ativo: true,
        };
        state.localidade.push(nova);
      }

      if (key === 'status-eventos') {
        const novo: StatusEvento = {
          id,
          nome: body.nome,
          cobrar: Boolean(body.cobrar),
          ativo: true,
        };
        state['status-eventos'].push(novo);
      }

      if (key === 'grupo-permissoes') {
        const novo: GrupoPermissao = {
          id,
          nome: body.nome,
          permissoesId: Array.isArray(body.permissoesId) ? body.permissoesId : [],
          ativo: true,
        };
        state['grupo-permissoes'].push(novo);
      }

      return json({ data: { id } }, 201);
    }

    if (method === 'POST' && path === '/paciente') {
      const body = getBody(request);
      const id = counters.pacientes++;
      state.pacientes.push({
        id,
        nome: body.nome || `Paciente ${id}`,
        disabled: false,
      });
      return json({ data: { id } }, 201);
    }

    if (
      method === 'PUT' &&
      /^\/(usuarios|especialidade|funcao|localidade|status-eventos|grupo-permissoes)$/.test(path)
    ) {
      const key = path.slice(1) as keyof MockState;
      const body = getBody(request);
      const list = state[key] as any[];
      const target = list.find((item) => item.id === body.id);
      if (target) {
        Object.assign(target, body);
      }
      return json({ data: { success: true } });
    }

    if (method === 'PUT' && path === '/paciente') {
      const body = getBody(request);
      const target = state.pacientes.find(
        (item) => Number(item.id) === Number(body.id)
      );
      if (target) {
        Object.assign(target, body);
      }
      return json({ data: { success: true } });
    }

    if (method === 'PUT' && path === '/paciente/desabilitar') {
      const body = getBody(request);
      const target = state.pacientes.find((item) => item.id === body.id);
      if (target) {
        target.disabled = Boolean(body.disabled);
      }
      return json({ data: { success: true, message: 'Paciente atualizado' } });
    }

    return json({ data: [] });
  };
}

export async function bootstrapCadastroPage(page: Page) {
  const state = createMockState();
  await page.route('**/api/**', createCrudRouteHandler(state));

  await page.addInitScript(() => {
    const auth = {
      id: 999,
      login: 'e2e-admin',
      perfil: { nome: 'developer' },
      permissoes: [],
    };

    sessionStorage.setItem('token', 'e2e-token');
    sessionStorage.setItem('perfil', 'developer');
    sessionStorage.setItem('auth', JSON.stringify(auth));
  });

  await page.goto('/cadastro');
  await expect(page.getByRole('tablist')).toBeVisible();

  return state;
}

export async function openTab(page: Page, tabName: string) {
  const byRole = page.getByRole('tab', { name: new RegExp(tabName, 'i') }).first();

  if ((await byRole.count()) > 0) {
    await expect(byRole).toBeVisible();
    await byRole.click();
    return;
  }

  const byNavText = page
    .locator('.p-tabview-nav a:visible')
    .filter({ hasText: tabName })
    .first();
  await expect(byNavText).toBeVisible();
  await byNavText.click();
}

export async function openCrudModal(page: Page, addTestId: string, formTestId: string) {
  const addButton = page.locator(`[data-testid="${addTestId}"]:visible`).first();
  await expect(addButton).toBeVisible();
  await addButton.click();

  await expect(page.getByTestId(formTestId)).toBeVisible();
}

export async function setDropdownInVisibleModal(
  page: Page,
  fieldTestId: string,
  option: string
) {
  const modal = page.locator('.p-dialog:visible').last();
  const wrapper = modal.getByTestId(fieldTestId).first();
  await wrapper.locator('.p-dropdown').first().click();

  const item = page
    .locator('.p-dropdown-panel:visible .p-dropdown-item')
    .filter({ hasText: option })
    .first();
  await expect(item).toBeVisible();
  await item.click();
}

export async function setMultiSelectInVisibleModal(
  page: Page,
  fieldTestId: string,
  option: string
) {
  const modal = page.locator('.p-dialog:visible').last();
  const wrapper = modal.getByTestId(fieldTestId).first();
  await wrapper.locator('.p-multiselect').first().click();

  const item = page
    .locator('.p-multiselect-panel:visible .p-multiselect-item')
    .filter({ hasText: option })
    .first();
  await expect(item).toBeVisible();
  await item.click();

  await page.keyboard.press('Escape');
}

export async function fillInVisibleModal(page: Page, fieldTestId: string, value: string) {
  const modal = page.locator('.p-dialog:visible').last();
  const input = modal.getByTestId(fieldTestId).locator('input, textarea').first();
  await input.fill('');
  await input.fill(value);
}

export async function saveCrudModal(page: Page, saveTestId: string) {
  const modal = page.locator('.p-dialog:visible').last();
  await modal.getByTestId(saveTestId).click();
}

export async function clickFirstEditAction(page: Page) {
  const button = page
    .locator(
      '.p-tabview-panels .p-tabview-panel:not([aria-hidden="true"]) button:has(.pi-pencil):visible'
    )
    .first();
  await expect(button).toBeVisible();
  await button.click();
}

export async function clickFirstTrashAction(page: Page) {
  const button = page
    .locator(
      '.p-tabview-panels .p-tabview-panel:not([aria-hidden="true"]) button:has(.pi-trash):visible'
    )
    .first();
  await expect(button).toBeVisible();
  await button.click();
}

export async function acceptConfirm(page: Page) {
  const acceptButton = page
    .locator('.p-confirm-dialog:visible .p-confirm-dialog-accept')
    .first();
  await expect(acceptButton).toBeVisible();
  await acceptButton.click();
}
