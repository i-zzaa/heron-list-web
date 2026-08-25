import { expect, test } from '@playwright/test';
import { AgendaPage } from './pages/AgendaPage';
import {
  ESPECIALIDADES,
  FREQUENCIAS,
  FUNCOES,
  INTERVALOS,
  LOCALIDADES,
  MODALIDADES,
  PACIENTES,
  STATUS_EVENTOS,
  TERAPEUTAS,
} from './helpers/agenda-data';

// Regressão do bug: ao abrir o modal de edição de um evento, campos como
// Paciente/Especialidade apareciam vazios mesmo com o valor correto salvo no
// formulário. Causa: o <Dropdown> (componente select do Input) comparava o
// valor vindo da API com os itens de `options` campo a campo — e o objeto do
// evento sempre traz campos a mais (paciente.convenio, especialidade.codigo/
// ativo etc.) que a lista de opções não tem, então a comparação falhava e o
// Dropdown renderizava em branco. Por isso cada objeto "rico" abaixo imita de
// propósito esse formato (id/nome + campos extras) — é o que reproduz o bug
// quando o fix (`dataKey="id"` no Dropdown) não está aplicado.
const PACIENTE_RICO = {
  ...PACIENTES[0],
  convenio: { id: 1, nome: 'Unimed Intercâmbio' },
};

const ESPECIALIDADE_RICA = {
  ...ESPECIALIDADES[0],
  codigo: 'PSI',
  ativo: true,
};

const TERAPEUTA_RICO = {
  ...TERAPEUTAS[0],
  cor: '#685ec5',
};

const FUNCAO_RICA = {
  ...FUNCOES[0],
  codigo: 'ACT',
};

const LOCALIDADE_RICA = {
  ...LOCALIDADES[0],
  tipo: 'interna',
};

const STATUS_INICIAL_RICO = {
  ...STATUS_EVENTOS.find((status) => status.nome === 'Avisar')!,
  codigo: 'avisar',
};

const MODALIDADE_RICA = { ...MODALIDADES[2], codigo: 'terapia' }; // Terapia
const FREQUENCIA_RICA = { ...FREQUENCIAS[0] }; // Recorrente
const INTERVALO_RICO = { ...INTERVALOS[0] }; // Todas Semanas

const DATA_EVENTO = '2026-08-25'; // terça-feira -> diasFrequencia = [2] ('T')
const OBSERVACAO_EVENTO = 'Observação preenchida via e2e';

function criarApiMock(evento: Record<string, any>) {
  const updatePayloads: Record<string, any>[] = [];

  const routeHandler = async (route: any) => {
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

    if (method === 'GET' && path === '/paciente/dropdown') return json(PACIENTES);
    if (method === 'GET' && path === '/status-eventos/dropdown') return json(STATUS_EVENTOS);
    if (method === 'GET' && path === '/modalidade/dropdown') return json(MODALIDADES);
    if (method === 'GET' && path === '/frequencia/dropdown') return json(FREQUENCIAS);
    if (method === 'GET' && path === '/localidade/dropdown') return json(LOCALIDADES);
    if (method === 'GET' && path === '/funcao/dropdown') return json(FUNCOES);
    if (method === 'GET' && path === '/terapeuta/dropdown') return json(TERAPEUTAS);
    if (method === 'GET' && path === '/especialidade/dropdown') return json(ESPECIALIDADES);
    if (method === 'GET' && path === '/intervalo/dropdown') return json(INTERVALOS);
    if (method === 'GET' && path === '/paciente/especialidade/dropdown') return json(ESPECIALIDADES);
    if (method === 'GET' && path === '/terapeuta/especialidade/dropdown') return json(TERAPEUTAS);
    if (method === 'GET' && path === '/funcao/terapeuta/dropdown') return json(FUNCOES);

    if (method === 'GET' && path.startsWith('/evento/filtro/')) {
      return json({ data: [evento] });
    }

    if (method === 'PUT' && /^\/evento\/?$/.test(path)) {
      const payload = request.postDataJSON();
      updatePayloads.push(payload);
      return json({ data: { success: true } });
    }

    if (method === 'GET' && path === '/logout') return json({ data: { success: true } });

    return json({ data: [] });
  };

  return { updatePayloads, routeHandler };
}

function montarEvento(overrides: Record<string, any> = {}) {
  return {
    id: 777,
    // O campo Frequência (e por tabela Intervalo/Dias da semana) só é
    // renderizado quando o evento é a "raiz" do grupo recorrente
    // (id === groupId) — ver CalendarForm.tsx.
    groupId: 777,
    dataInicio: DATA_EVENTO,
    dataFim: DATA_EVENTO,
    date: DATA_EVENTO,
    start: '08:00',
    end: '09:00',
    startTime: '08:00',
    endTime: '09:00',
    exdate: [],
    daysOfWeek: [2],
    diasFrequencia: ['2'],
    title: PACIENTE_RICO.nome,
    paciente: PACIENTE_RICO,
    modalidade: MODALIDADE_RICA,
    frequencia: FREQUENCIA_RICA,
    intervalo: INTERVALO_RICO,
    statusEventos: STATUS_INICIAL_RICO,
    localidade: LOCALIDADE_RICA,
    terapeuta: TERAPEUTA_RICO,
    funcao: FUNCAO_RICA,
    especialidade: ESPECIALIDADE_RICA,
    isExterno: false,
    km: '',
    localExternoDescricao: '',
    observacao: OBSERVACAO_EVENTO,
    canDelete: true,
    color: '#3b82f6',
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
    ...overrides,
  };
}

async function autenticar(page: any) {
  await page.addInitScript(() => {
    const auth = {
      id: 999,
      login: 'e2e-user',
      perfil: { nome: 'developer' },
      permissoes: [],
    };

    sessionStorage.setItem('token', 'e2e-token');
    sessionStorage.setItem('perfil', 'developer');
    sessionStorage.setItem('auth', JSON.stringify(auth));
  });
}

async function abrirEdicaoDoEvento(page: any) {
  const agendaPage = new AgendaPage(page);
  await agendaPage.abrirAgenda();
  // A visão inicial (Semana) nem sempre deixa o slot na área visível/rolada
  // da grade — navegar pela visão de Mês (mesma estratégia usada pelo resto
  // da suíte, ver AgendaPage.selecionarEventoPorDataHora) garante o clique.
  await agendaPage.selecionarEventoPorDataHora(DATA_EVENTO, '08:00');

  const dialog = page.locator('.p-dialog:visible').last();
  await expect(dialog).toBeVisible();
  await dialog.locator('button:has(.pi-pencil)').click();

  await expect(page.getByTestId('agenda-form')).toBeVisible();
}

// Confere o rótulo selecionado exibido pelo Dropdown (PrimeReact) de um
// campo `select`, identificado pelo testId do <Input />.
async function validarDropdownSelecionado(
  page: any,
  testId: string,
  nomeEsperado: string
) {
  const label = page.getByTestId(testId).locator('.p-dropdown-label');
  await expect(label).toHaveText(nomeEsperado);
}

test.describe('Agenda | modal de edição preenche todos os tipos de campo', () => {
  test('preenche selects, data, horários, frequência, intervalo, dias da semana, local e observação', async ({
    page,
  }) => {
    const evento = montarEvento();
    const { routeHandler } = criarApiMock(evento);

    await page.route('**/api/**', routeHandler);
    await autenticar(page);
    await abrirEdicaoDoEvento(page);

    // select: cada um destes objetos veio da API com campos extras além de
    // {id, nome} — é exatamente o cenário que quebrava sem o dataKey="id".
    await validarDropdownSelecionado(page, 'modalidade-select', MODALIDADE_RICA.nome);
    await validarDropdownSelecionado(page, 'frequencia-select', FREQUENCIA_RICA.nome);
    await validarDropdownSelecionado(page, 'intervalo-select', INTERVALO_RICO.nome);
    await validarDropdownSelecionado(page, 'paciente-field', PACIENTE_RICO.nome);
    await validarDropdownSelecionado(page, 'especialidade-field', ESPECIALIDADE_RICA.nome);
    await validarDropdownSelecionado(page, 'terapeuta-select', TERAPEUTA_RICO.nome);
    await validarDropdownSelecionado(page, 'funcao-select', FUNCAO_RICA.nome);
    await validarDropdownSelecionado(page, 'localidade-select', LOCALIDADE_RICA.nome);
    await validarDropdownSelecionado(page, 'status-evento-select', STATUS_INICIAL_RICO.nome);

    // date
    await expect(page.getByTestId('data-inicial-input').locator('input')).toHaveValue(
      DATA_EVENTO
    );

    // time
    await expect(page.getByTestId('hora-inicio-input').locator('input')).toHaveValue('08:00');
    await expect(page.getByTestId('hora-fim-input').locator('input')).toHaveValue('09:00');

    // switch (Local Externo desligado -> mostra o select de Local, não km/descrição)
    await expect(page.getByTestId('isExterno-field').locator('.p-inputswitch')).not.toHaveClass(
      /p-inputswitch-checked/
    );
    await expect(page.getByTestId('km-field')).toHaveCount(0);
    await expect(page.getByTestId('localExternoDescricao-field')).toHaveCount(0);

    // selectbutton (dias da semana) - terça-feira selecionada
    const diaSelecionado = page
      .getByTestId('diasFrequencia-select-button')
      .locator('.p-highlight');
    await expect(diaSelecionado).toHaveCount(1);
    await expect(diaSelecionado).toHaveText('T');

    // textarea
    await expect(page.getByTestId('observacao-field').locator('textarea')).toHaveValue(
      OBSERVACAO_EVENTO
    );
  });

  test('preenche switch, número e texto quando o evento é em local externo', async ({ page }) => {
    const evento = montarEvento({
      isExterno: true,
      km: '12',
      localExternoDescricao: 'Rua Teste, 123',
      localidade: undefined,
    });
    const { routeHandler } = criarApiMock(evento);

    await page.route('**/api/**', routeHandler);
    await autenticar(page);
    await abrirEdicaoDoEvento(page);

    // switch ligado
    await expect(page.getByTestId('isExterno-field').locator('.p-inputswitch')).toHaveClass(
      /p-inputswitch-checked/
    );

    // number
    await expect(page.getByTestId('km-field').locator('input')).toHaveValue('12');

    // text
    await expect(
      page.getByTestId('localExternoDescricao-field').locator('input')
    ).toHaveValue('Rua Teste, 123');

    // com Local Externo ligado, o select de Local some do formulário
    await expect(page.getByTestId('localidade-select')).toHaveCount(0);
  });
});
