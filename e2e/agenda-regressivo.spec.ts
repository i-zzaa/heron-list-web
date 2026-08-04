import { expect, test } from '@playwright/test';
import {
  DADOS_PADRAO,
  ESPECIALIDADES,
  FREQUENCIAS,
  FUNCOES,
  INTERVALOS,
  LOCALIDADES,
  MODALIDADES,
  PACIENTES,
  STATUS_CANCELADOS,
  STATUS_COBRAR_FALSE,
  STATUS_EVENTOS,
  STATUS_INICIAL,
  TERAPEUTAS,
} from './helpers/agenda-data';
import { calcularDatasRecorrencia } from './helpers/recorrencia';
import { AgendaPage } from './pages/AgendaPage';

type DropdownItem = { id: number; nome: string; cobrar?: boolean };

type AgendaEvent = {
  id: number;
  groupId: number;
  dataInicio: string;
  dataFim: string;
  date: string;
  start: string;
  end: string;
  exdate?: string[];
  useRrule?: boolean;
  paciente: DropdownItem;
  modalidade: DropdownItem;
  frequencia: DropdownItem;
  intervalo: DropdownItem;
  statusEventos: DropdownItem;
  localidade: DropdownItem;
  terapeuta: DropdownItem;
  funcao: DropdownItem;
  especialidade: DropdownItem;
  diasFrequencia: number[];
  color: string;
};

type MockState = {
  events: AgendaEvent[];
  createPayloads: Record<string, any>[];
  updatePayloads: Record<string, any>[];
};

function getRequestBody(request: any): Record<string, any> {
  try {
    return request.postDataJSON();
  } catch (error) {
    const raw = request.postData() || '{}';
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
}

const STATUS_TRUE = ['Atendido', 'Falta', 'Cancelado s/ Antecedencia'];
const STATUS_FALSE = STATUS_COBRAR_FALSE.map((item) => item.nome);

function normalizeText(value?: string | null) {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function findByNome<T extends DropdownItem>(list: T[], nome?: string | null): T {
  if (!nome) {
    return list[0];
  }

  const found = list.find((item) => normalizeText(item.nome) === normalizeText(nome));
  if (!found) {
    return list[0];
  }
  return found;
}

function resolveEventColor(statusNome: string): string {
  const status = normalizeText(statusNome);

  if (status.includes('cancelado')) {
    return '#ef4444';
  }

  if (status === 'atendido') {
    return '#16a34a';
  }

  return '#3b82f6';
}

function criarApiMock() {
  const state: MockState = {
    events: [],
    createPayloads: [],
    updatePayloads: [],
  };

  let nextEventId = 1000;
  let nextGroupId = 500;

  const eventToCalendarPayload = (event: AgendaEvent) => ({
    id: String(event.id),
    groupId: String(event.groupId),
    dataInicio: event.dataInicio,
    dataFim: event.dataFim,
    date: event.date,
    start: event.start,
    end: event.end,
    exdate: event.exdate || [],
    startTime: event.start,
    endTime: event.end,
    title: event.paciente.nome,
    paciente: event.paciente,
    modalidade: event.modalidade,
    frequencia: event.frequencia,
    intervalo: event.intervalo,
    statusEventos: event.statusEventos,
    localidade: event.localidade,
    terapeuta: event.terapeuta,
    funcao: event.funcao,
    especialidade: event.especialidade,
    diasFrequencia: event.diasFrequencia.map(String),
    daysOfWeek: event.diasFrequencia,
    data: {
      start: event.start,
      end: event.end,
    },
    observacao: '',
    canDelete: true,
    color: event.color,
    // borderColor: 'border-fono',
    backgroundColor: event.color,
    rrule: event.useRrule
      ? {
          freq: 'weekly',
          dtstart: `${event.date} ${event.start}`,
          until: `${event.dataFim} ${event.start}`,
        }
      : undefined,
    borderColor: event.color,
  });

  const applyUpdate = (payload: Record<string, any>) => {
    const targetId = Number(payload.id);
    const target = state.events.find((item) => item.id === targetId);

    if (!target) {
      return;
    }

    const referenciaData = payload.dataAtual || payload.dataInicio || target.date;
    const changeAll = Boolean(payload.changeAll);

    const targets = state.events.filter((event) => {
      if (event.groupId !== target.groupId) {
        return false;
      }

      if (!changeAll) {
        return event.id === target.id;
      }

      return event.date >= referenciaData;
    });

    for (const event of targets) {
      if (payload.modalidade && payload.modalidade.nome) {
        event.modalidade = payload.modalidade;
      }

      if (payload.statusEventos && payload.statusEventos.nome) {
        event.statusEventos = payload.statusEventos;
        event.color = resolveEventColor(payload.statusEventos.nome);
      }

      if (payload.dataInicio && !changeAll) {
        event.date = payload.dataInicio;
        event.dataInicio = payload.dataInicio;
      }

      if (payload.start) {
        event.start = payload.start;
      }

      if (payload.end) {
        event.end = payload.end;
      }

      if (payload.localidade && payload.localidade.nome) {
        event.localidade = payload.localidade;
      }

      if (payload.terapeuta && payload.terapeuta.nome) {
        event.terapeuta = payload.terapeuta;
      }

      if (payload.funcao && payload.funcao.nome) {
        event.funcao = payload.funcao;
      }

      if (Array.isArray(payload.diasFrequencia) && payload.diasFrequencia.length) {
        event.diasFrequencia = payload.diasFrequencia.map((day: number | string) => Number(day));
      }

      if (Array.isArray(payload.exdate)) {
        event.exdate = payload.exdate;
      }
    }
  };

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

    if (method === 'GET' && path === '/paciente/dropdown') {
      return json(PACIENTES);
    }

    if (method === 'GET' && path === '/status-eventos/dropdown') {
      return json(STATUS_EVENTOS);
    }

    if (method === 'GET' && path === '/modalidade/dropdown') {
      return json(MODALIDADES);
    }

    if (method === 'GET' && path === '/frequencia/dropdown') {
      return json(FREQUENCIAS);
    }

    if (method === 'GET' && path === '/localidade/dropdown') {
      return json(LOCALIDADES);
    }

    if (method === 'GET' && path === '/funcao/dropdown') {
      return json(FUNCOES);
    }

    if (method === 'GET' && path === '/terapeuta/dropdown') {
      return json(TERAPEUTAS);
    }

    if (method === 'GET' && path === '/especialidade/dropdown') {
      return json(ESPECIALIDADES);
    }

    if (method === 'GET' && path === '/intervalo/dropdown') {
      return json(INTERVALOS);
    }

    if (method === 'GET' && path === '/paciente/especialidade/dropdown') {
      return json(ESPECIALIDADES);
    }

    if (method === 'GET' && path === '/paciente/especialidades') {
      return json([
        {
          especialidade: ESPECIALIDADES[0],
          terapeutas: TERAPEUTAS,
        },
      ]);
    }

    if (method === 'GET' && path === '/terapeuta/especialidade/dropdown') {
      return json(TERAPEUTAS);
    }

    if (method === 'GET' && path === '/funcao/terapeuta/dropdown') {
      return json(FUNCOES);
    }

    if (method === 'GET' && path.startsWith('/evento/filtro/')) {
      return json({ data: state.events.map(eventToCalendarPayload) });
    }

    if (method === 'POST' && /^\/evento\/?$/.test(path)) {
      const payload = getRequestBody(request);
      state.createPayloads.push(payload);

      const modalidade = findByNome(MODALIDADES, payload.modalidade?.nome || DADOS_PADRAO.modalidade);
      const frequencia = findByNome(FREQUENCIAS, payload.frequencia?.nome || DADOS_PADRAO.frequencia);
      const intervalo = findByNome(INTERVALOS, payload.intervalo?.nome || DADOS_PADRAO.intervalo);
      const status = findByNome(STATUS_EVENTOS, payload.statusEventos?.nome || DADOS_PADRAO.statusInicial);
      const paciente = findByNome(PACIENTES, payload.paciente?.nome || DADOS_PADRAO.paciente);
      const localidade = findByNome(LOCALIDADES, payload.localidade?.nome || DADOS_PADRAO.localidade);
      const terapeuta = findByNome(TERAPEUTAS, payload.terapeuta?.nome || DADOS_PADRAO.terapeuta);
      const funcao = findByNome(FUNCOES, payload.funcao?.nome || DADOS_PADRAO.funcao);
      const especialidade = findByNome(ESPECIALIDADES, payload.especialidade?.nome || DADOS_PADRAO.especialidade);

      const datas = calcularDatasRecorrencia(payload.dataInicio, intervalo.nome, 4);
      const groupId = nextGroupId++;
      const day = new Date(`${payload.dataInicio}T00:00:00`).getDay() || 7;
      const dataFim = datas[datas.length - 1];

      const novosEventos: AgendaEvent[] = datas.map((date) => ({
        id: nextEventId++,
        groupId,
        dataInicio: payload.dataInicio,
        dataFim,
        date,
        start: payload.start,
        end: payload.end,
        exdate: Array.isArray(payload.exdate) ? payload.exdate : [],
        useRrule: false,
        paciente,
        modalidade,
        frequencia,
        intervalo,
        statusEventos: status,
        localidade,
        terapeuta,
        funcao,
        especialidade,
        diasFrequencia: [day],
        color: resolveEventColor(status.nome),
      }));

      state.events.push(...novosEventos);

      return json({ data: { id: novosEventos[0].id } }, 201);
    }

    if (method === 'PUT' && /^\/evento\/?$/.test(path)) {
      const payload = getRequestBody(request);
      state.updatePayloads.push(payload);
      applyUpdate(payload);
      return json({ data: { success: true } });
    }

    if (method === 'PUT' && path === '/evento/check') {
      const payload = getRequestBody(request);
      state.updatePayloads.push(payload);
      applyUpdate(payload);
      return json({ data: { success: true } });
    }

    if (method === 'PUT' && path === '/evento/atestado') {
      const payload = getRequestBody(request);
      state.updatePayloads.push(payload);
      applyUpdate(payload);
      return json({ data: { success: true } });
    }

    if (method === 'DELETE' && path === '/evento') {
      return json({ data: { success: true } });
    }

    if (method === 'GET' && path === '/logout') {
      return json({ data: { success: true } });
    }

    return json({ data: [] });
  };

  return { state, routeHandler };
}

function garantirSemDuplicidade(events: AgendaEvent[]) {
  const chaves = new Set<string>();

  for (const event of events) {
    const key = `${event.date}-${event.start}-${event.end}-${event.paciente.id}`;
    expect(chaves.has(key)).toBeFalsy();
    chaves.add(key);
  }
}

test('Agenda recorrente aplica exdate e remove ocorrencia do calendario', async ({ page }) => {
  const { state, routeHandler } = criarApiMock();
  const agendaPage = new AgendaPage(page);

  await page.route('**/api/**', routeHandler);

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

  state.events.push({
    id: 249,
    groupId: 500,
    dataInicio: '2026-08-03',
    dataFim: '2026-08-24',
    date: '2026-08-03',
    start: '08:00',
    end: '09:00',
    exdate: ['2026-08-10 08:00'],
    useRrule: true,
    paciente: PACIENTES[0],
    modalidade: MODALIDADES[0],
    frequencia: FREQUENCIAS[0],
    intervalo: INTERVALOS[0],
    statusEventos: STATUS_INICIAL || STATUS_EVENTOS[0],
    localidade: LOCALIDADES[0],
    terapeuta: TERAPEUTAS[0],
    funcao: FUNCOES[0],
    especialidade: ESPECIALIDADES[0],
    diasFrequencia: [1],
    color: '#f6bf26',
  });

  await agendaPage.abrirAgenda();

  await agendaPage.validarEventoExiste('2026-08-03', '08:00');
  await agendaPage.validarEventoNaoExiste('2026-08-10', '08:00');
  await agendaPage.validarEventoExiste('2026-08-17', '08:00');
  await agendaPage.validarEventoExiste('2026-08-24', '08:00');
});

for (const modalidade of MODALIDADES) {
  for (const intervalo of INTERVALOS) {
    test(`Agenda recorrente regressiva | ${modalidade.nome} | ${intervalo.nome}`, async ({ page }) => {
      const { state, routeHandler } = criarApiMock();
      const agendaPage = new AgendaPage(page);

      await page.route('**/api/**', routeHandler);

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

      const dataInicial = DADOS_PADRAO.dataInicial;
      const horaInicio = DADOS_PADRAO.horaInicio;

      const statusInicial = STATUS_INICIAL?.nome || 'Avisar';
      const statusCobrarTrue = STATUS_TRUE.find((item) => item === 'Atendido') || 'Atendido';
      const statusCancelado = STATUS_CANCELADOS[0].nome;
      const statusCobrarFalse = STATUS_FALSE.find((item) => item === 'Confirmado') || STATUS_FALSE[0];

      const dadosCadastro = {
        modalidade: modalidade.nome,
        dataInicial,
        horaInicio,
        horaFim: DADOS_PADRAO.horaFim,
        frequencia: DADOS_PADRAO.frequencia,
        intervalo: intervalo.nome,
        statusEventos: statusInicial,
        localidade: DADOS_PADRAO.localidade,
        terapeuta: DADOS_PADRAO.terapeuta,
        funcao: DADOS_PADRAO.funcao,
        paciente: DADOS_PADRAO.paciente,
        especialidade: DADOS_PADRAO.especialidade,
      };

      await agendaPage.abrirAgenda();
      await agendaPage.clicarNovoAgendamento();
      await agendaPage.preencherAgendamento(dadosCadastro);
      await agendaPage.salvar();

      const createPayload: any = state.createPayloads.at(-1);
      expect(createPayload).toBeTruthy();
      expect(normalizeText(createPayload.modalidade.nome)).toBe(normalizeText(modalidade.nome));
      if (normalizeText(modalidade.nome) !== 'devolutiva') {
        expect(
          normalizeText(createPayload.frequencia?.nome || DADOS_PADRAO.frequencia)
        ).toBe('recorrente');
        expect(
          normalizeText(createPayload.intervalo?.nome || intervalo.nome)
        ).toBe(normalizeText(intervalo.nome));
      }
      expect(normalizeText(createPayload.statusEventos.nome)).toBe('avisar');
      expect(createPayload.start).toBe(DADOS_PADRAO.horaInicio);
      expect(createPayload.end).toBe(DADOS_PADRAO.horaFim);

      const datasEsperadas =
        normalizeText(modalidade.nome) === 'devolutiva'
          ? [dataInicial]
          : calcularDatasRecorrencia(dataInicial, intervalo.nome, 4);
      await agendaPage.validarRecorrencia(datasEsperadas, horaInicio);

      garantirSemDuplicidade(state.events);
      expect(
        state.events.every((event) => normalizeText(event.statusEventos.nome) === 'avisar')
      ).toBeTruthy();

      const dataEventoAtualOriginal = datasEsperadas[0];

      await agendaPage.selecionarEventoPorDataHora(dataEventoAtualOriginal, horaInicio);
      await agendaPage.validarCamposImutaveisEmEdicao();

      await agendaPage.validarEventoUnicoNoSlot(dataEventoAtualOriginal, horaInicio);

      const dataEventoAtual = dataEventoAtualOriginal;

      await agendaPage.validarEventoExiste(dataEventoAtual, horaInicio);
      await agendaPage.validarEventoUnicoNoSlot(dataEventoAtual, horaInicio);

      await agendaPage.selecionarEventoPorDataHora(dataEventoAtual, horaInicio);
      await agendaPage.alterarStatus(statusCobrarTrue, 'Atual');

      const primeiroUpdate: any = state.updatePayloads.at(-1);
      expect(primeiroUpdate).toBeTruthy();
      expect(primeiroUpdate.changeAll).toBe(false);
      expect(STATUS_TRUE.map(normalizeText)).toContain(normalizeText(primeiroUpdate.statusEventos.nome));

      await agendaPage.validarEventoComCheck(dataEventoAtual, horaInicio);
      await agendaPage.validarEventoUnicoNoSlot(dataEventoAtual, horaInicio);

      await agendaPage.selecionarEventoPorDataHora(dataEventoAtual, horaInicio);
      await agendaPage.alterarStatus(statusCancelado, 'Atual');

      const segundoUpdate: any = state.updatePayloads.at(-1);
      expect(segundoUpdate).toBeTruthy();
      expect(normalizeText(segundoUpdate.statusEventos.nome)).toContain('cancelado');

      await agendaPage.validarEventoRiscado(dataEventoAtual, horaInicio);
      await agendaPage.validarEventoCancelado(dataEventoAtual, horaInicio);

      const outroEvento = state.events
        .filter((event) => event.date !== dataEventoAtual)
        .sort((a, b) => a.date.localeCompare(b.date))[0];
      expect(outroEvento).toBeTruthy();

      await agendaPage.selecionarEventoPorDataHora(outroEvento.date, outroEvento.start);
      await agendaPage.alterarStatus(statusCobrarFalse, 'Atual');

      const terceiroUpdate: any = state.updatePayloads.at(-1);
      expect(terceiroUpdate).toBeTruthy();
      expect(STATUS_FALSE.map(normalizeText)).toContain(
        normalizeText(terceiroUpdate.statusEventos.nome)
      );

      const slotOutroEvento = page
        .locator(
          `[data-testid="calendar-event-slot"][data-event-start^="${outroEvento.date}T${outroEvento.start}"]`
        )
        .first();
      await expect(slotOutroEvento.locator('.pi.pi-check.flex-shrink-0')).toHaveCount(0);

      garantirSemDuplicidade(state.events);

      expect(state.updatePayloads.length).toBeGreaterThanOrEqual(3);

      const possuiAtendido = state.updatePayloads.some(
        (payload) => normalizeText(payload.statusEventos?.nome || '') === 'atendido'
      );
      const possuiCancelado = state.updatePayloads.some((payload) =>
        normalizeText(payload.statusEventos?.nome || '').includes('cancelado')
      );
      const possuiCobrarTrue = state.updatePayloads.some((payload) =>
        STATUS_TRUE.map(normalizeText).includes(normalizeText(payload.statusEventos?.nome || ''))
      );
      const possuiCobrarFalse = state.updatePayloads.some((payload) =>
        STATUS_FALSE.map(normalizeText).includes(normalizeText(payload.statusEventos?.nome || ''))
      );

      expect(possuiAtendido).toBeTruthy();
      expect(possuiCancelado).toBeTruthy();
      expect(possuiCobrarTrue).toBeTruthy();
      expect(possuiCobrarFalse).toBeTruthy();
    });
  }
}
