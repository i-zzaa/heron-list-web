import { expect, Page } from '@playwright/test';

export interface AgendaFormData {
  modalidade: string;
  dataInicial: string;
  horaInicio: string;
  horaFim: string;
  frequencia: string;
  intervalo: string;
  statusEventos: string;
  localidade: string;
  terapeuta: string;
  funcao: string;
  paciente: string;
  especialidade: string;
}

interface EditOptions {
  modalidade?: string;
  dataInicial?: string;
  statusEventos?: string;
  horaInicio?: string;
  horaFim?: string;
}

const MONTHS_PT = [
  'janeiro',
  'fevereiro',
  'marco',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

export class AgendaPage {
  constructor(private readonly page: Page) {}

  async abrirAgenda(): Promise<void> {
    await this.page.goto('/agenda');
    await this.esperarAgendaCarregar();
  }

  async esperarAgendaCarregar(): Promise<void> {
    await expect(this.page.getByTestId('agenda-page')).toBeVisible();
    await expect(this.page.locator('.fc-toolbar-title')).toBeVisible();
  }

  async clicarNovoAgendamento(): Promise<void> {
    const accordionHeader = this.page
      .locator('.p-accordion-header')
      .filter({ hasText: 'Filtro' })
      .first();

    if (await accordionHeader.isVisible()) {
      await accordionHeader.click();
    }

    await this.page.getByRole('button', { name: 'Agendar' }).first().click();

    await expect(this.page.getByTestId('agenda-form')).toBeVisible();
  }

  async preencherAgendamento(dados: AgendaFormData): Promise<void> {
    const isDevolutiva = dados.modalidade
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .includes('devolutiva');

    await this.selecionarOpcaoDropdown('modalidade-select', dados.modalidade);
    await this.preencherInput('data-inicial-input', dados.dataInicial);
    await this.preencherInput('hora-inicio-input', dados.horaInicio);
    await this.preencherInput('hora-fim-input', dados.horaFim);

    await this.selecionarOpcaoDropdownSeVisivel('frequencia-select', dados.frequencia);
    await this.selecionarOpcaoDropdownSeVisivel('intervalo-select', dados.intervalo);

    await this.selecionarOpcaoDropdown('paciente-field', dados.paciente);

    if (isDevolutiva) {
      await this.page.waitForSelector('[data-testid="terapeuta-select-0"]', {
        timeout: 10_000,
      });
      await this.selecionarOpcaoDropdownComRetry(
        'terapeuta-select-0',
        dados.terapeuta
      );
      await this.selecionarOpcaoDropdownComRetry('funcao-select-0', dados.funcao);
    } else {
      await this.selecionarOpcaoDropdownComRetry(
        'especialidade-field',
        dados.especialidade
      );
      await this.selecionarOpcaoDropdownComRetry('terapeuta-select', dados.terapeuta);
      await this.selecionarOpcaoDropdownComRetry('funcao-select', dados.funcao);
    }

    await this.selecionarOpcaoDropdown('localidade-select', dados.localidade);
    await this.selecionarOpcaoDropdown('status-evento-select', dados.statusEventos);
  }

  async salvar(): Promise<void> {
    const modal = this.page
      .locator('.p-dialog:visible')
      .filter({ hasText: 'Agendamento' })
      .first();

    await modal.getByRole('button', { name: /^Agendar$/ }).click();
    await expect(this.page.getByTestId('agenda-form')).not.toBeVisible({
      timeout: 15_000,
    });
  }

  async selecionarEventoPorDataHora(data: string, hora: string): Promise<void> {
    await this.irParaMesAno(data);
    const slot = this.slotPorDataHora(data, hora).first();

    await expect(slot).toBeVisible();
    await slot.click();
  }

  async editarEventoAtual(dados: EditOptions): Promise<void> {
    await this.abrirModalEdicao();
    await this.preencherEdicao(dados);
    await this.salvarEdicao();
    await this.aplicarEdicao('Atual');
  }

  async validarCamposImutaveisEmEdicao(): Promise<void> {
    await this.abrirModalEdicao();

    await expect(
      this.page.getByTestId('modalidade-select').locator('.p-dropdown')
    ).toHaveClass(/p-disabled/);
    await expect(
      this.page.getByTestId('data-inicial-input').locator('input')
    ).toBeDisabled();
    await expect(
      this.page.getByTestId('hora-inicio-input').locator('input')
    ).toBeDisabled();
    await expect(
      this.page.getByTestId('hora-fim-input').locator('input')
    ).toBeDisabled();

    const frequenciaDropdown = this.page
      .getByTestId('frequencia-select')
      .locator('.p-dropdown');
    if ((await frequenciaDropdown.count()) > 0) {
      await expect(frequenciaDropdown.first()).toHaveClass(/p-disabled/);
    }

    const intervaloDropdown = this.page
      .getByTestId('intervalo-select')
      .locator('.p-dropdown');
    if ((await intervaloDropdown.count()) > 0) {
      await expect(intervaloDropdown.first()).toHaveClass(/p-disabled/);
    }

    const diasFrequencia = this.page
      .getByTestId('diasFrequencia-select-button')
      .locator('.p-selectbutton');
    if ((await diasFrequencia.count()) > 0) {
      await expect(diasFrequencia.first()).toHaveClass(/p-disabled/);
    }

    await this.fecharModalAgendamento();
  }

  async editarEventoAtualEFuturos(dados: EditOptions): Promise<void> {
    await this.abrirModalEdicao();
    await this.preencherEdicao(dados);
    await this.salvarEdicao();
    await this.aplicarEdicao('Atual e eventos futuros');
  }

  async alterarStatus(
    statusNome: string,
    aplicacao: 'Atual' | 'Atual e eventos futuros'
  ): Promise<void> {
    await this.abrirModalEdicao();
    await this.selecionarOpcaoDropdown('status-evento-select', statusNome);
    await this.salvarEdicao();
    await this.aplicarEdicao(aplicacao);
  }

  async alterarDataEventoAtual(novaData: string): Promise<void> {
    await this.abrirModalEdicao();
    await this.preencherInput('data-inicial-input', novaData);
    await this.salvarEdicao();
    await this.aplicarEdicao('Atual');
  }

  async validarEventoExiste(
    data: string,
    hora: string,
    textoEsperado?: string
  ): Promise<void> {
    await this.irParaMesAno(data);

    const slot = this.page
      .locator(this.slotSelector(data, hora))
      .first();

    await expect(slot).toBeVisible();

    if (textoEsperado) {
      await expect(slot).toContainText(textoEsperado);
    }
  }

  async validarEventoNaoExiste(
    data: string,
    hora: string,
    textoEsperado?: string
  ): Promise<void> {
    await this.irParaMesAno(data);

    const slot = this.slotPorDataHora(data, hora);

    if (textoEsperado) {
      await expect(slot.filter({ hasText: textoEsperado })).toHaveCount(0);
      return;
    }

    await expect(slot).toHaveCount(0);
  }

  async validarEventoUnicoNoSlot(data: string, hora: string): Promise<void> {
    await this.irParaMesAno(data);
    const slot = this.slotPorDataHora(data, hora);
    await expect(slot).toHaveCount(1);
  }

  async existeEventoNoSlot(data: string, hora: string): Promise<boolean> {
    await this.irParaMesAno(data);
    const count = await this.slotPorDataHora(data, hora).count();
    return count > 0;
  }

  async validarRecorrencia(datasEsperadas: string[], hora: string): Promise<void> {
    for (const data of datasEsperadas) {
      await this.validarEventoExiste(data, hora);
      await this.validarEventoUnicoNoSlot(data, hora);
    }
  }

  async validarEventoComCheck(data: string, hora: string): Promise<void> {
    await this.irParaMesAno(data);

    const slot = this.page
      .locator(this.slotSelector(data, hora))
      .first();

    await expect(slot.locator('.pi.pi-check.flex-shrink-0')).toBeVisible();
  }

  async validarEventoCancelado(data: string, hora: string): Promise<void> {
    await this.irParaMesAno(data);

    const slot = this.page
      .locator(this.slotSelector(data, hora))
      .first();

    await expect(slot).toHaveClass(/calendar-event-canceled/);
  }

  async validarEventoRiscado(data: string, hora: string): Promise<void> {
    await this.irParaMesAno(data);

    const titulo = this.page
      .locator(
        `${this.slotSelector(data, hora)} [data-testid="calendar-event-title"]`
      )
      .first();

    await expect(titulo).toHaveClass(/line-through/);
  }

  private async abrirModalEdicao(): Promise<void> {
    const dialog = this.page.locator('.p-dialog:visible').last();
    await expect(dialog).toBeVisible();

    await dialog.locator('button:has(.pi-pencil)').click();
    await expect(this.page.getByTestId('agenda-form')).toBeVisible();
  }

  private async preencherEdicao(dados: EditOptions): Promise<void> {
    if (dados.modalidade) {
      await this.selecionarOpcaoDropdown('modalidade-select', dados.modalidade);
    }

    if (dados.statusEventos) {
      await this.selecionarOpcaoDropdown('status-evento-select', dados.statusEventos);
    }

    if (dados.dataInicial) {
      await this.preencherInput('data-inicial-input', dados.dataInicial);
    }

    const horaInicio = dados.horaInicio || '08:00';
    const horaFim = dados.horaFim || '09:00';

    await this.preencherInput('hora-inicio-input', horaInicio);
    await this.preencherInput('hora-fim-input', horaFim);
  }

  private async salvarEdicao(): Promise<void> {
    const modal = this.page
      .locator('.p-dialog:visible')
      .filter({ hasText: 'Agendamento' })
      .first();

    await modal.getByRole('button', { name: /^Atualizar$/ }).click();
  }

  private async fecharModalAgendamento(): Promise<void> {
    const closeButton = this.page
      .locator('.p-dialog:visible .p-dialog-header-icon')
      .last();

    await expect(closeButton).toBeVisible();
    await closeButton.click();
    await expect(this.page.getByTestId('agenda-form')).not.toBeVisible();
  }

  private async aplicarEdicao(aplicacao: 'Atual' | 'Atual e eventos futuros') {
    const message = this.page.getByText(
      'Alterar eventos futuros ou apenas o atual?'
    );

    const hasImmediateConfirm = await message.isVisible().catch(() => false);

    if (!hasImmediateConfirm) {
      try {
        await message.waitFor({ state: 'visible', timeout: 2000 });
      } catch {
        return;
      }
    }

    if (aplicacao === 'Atual') {
      await this.page.locator('.p-confirm-dialog .botao-aplicar-atual').click();
    } else {
      await this.page
        .locator('.p-confirm-dialog .botao-aplicar-atual-futuros')
        .click();
    }

    await expect(message).not.toBeVisible({ timeout: 10_000 });
  }

  private async preencherInput(testId: string, valor: string): Promise<void> {
    const campo = this.page
      .getByTestId(testId)
      .locator('input, textarea')
      .first();

    await campo.fill('');
    await campo.fill(valor);
  }

  private async selecionarOpcaoDropdown(testId: string, opcao: string): Promise<void> {
    const raiz = this.page.getByTestId(testId);
    await raiz.locator('.p-dropdown').first().click();

    const item = this.page
      .locator('.p-dropdown-panel:visible .p-dropdown-item')
      .filter({ hasText: opcao })
      .first();

    await expect(item).toBeVisible();
    await item.click();
  }

  private async selecionarOpcaoDropdownComRetry(
    testId: string,
    opcao: string
  ): Promise<void> {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        await this.selecionarOpcaoDropdown(testId, opcao);
        return;
      } catch (error) {
        if (attempt === 2) {
          throw error;
        }
      }
    }
  }

  private async selecionarOpcaoDropdownSeVisivel(
    testId: string,
    opcao: string
  ): Promise<void> {
    const raiz = this.page.getByTestId(testId);
    const dropdown = raiz.locator('.p-dropdown').first();

    if ((await dropdown.count()) === 0) {
      return;
    }

    if (!(await dropdown.isVisible())) {
      return;
    }

    await this.selecionarOpcaoDropdown(testId, opcao);
  }

  private slotSelector(data: string, hora: string): string {
    return `.fc-view-harness-active [data-testid="calendar-event-slot"][data-event-start^="${data}T${hora}"]:visible`;
  }

  private slotPorDataHora(data: string, hora: string) {
    return this.page.locator(this.slotSelector(data, hora));
  }

  private async irParaMesAno(dataIso: string): Promise<void> {
    const [year, month] = dataIso.split('-').map(Number);
    const targetMonthName = MONTHS_PT[month - 1];

    await this.page.locator('.fc-dayGridMonth-button').click();

    for (let i = 0; i < 24; i += 1) {
      const title = (
        await this.page.locator('.fc-toolbar-title').innerText()
      ).toLowerCase();

      if (title.includes(`${targetMonthName} de ${year}`)) {
        return;
      }

      const current = this.parseMonthTitle(title);
      if (!current) {
        await this.page.locator('.fc-next-button').click();
        continue;
      }

      const targetNumeric = year * 12 + (month - 1);
      const currentNumeric = current.year * 12 + current.monthIndex;

      if (currentNumeric < targetNumeric) {
        await this.page.locator('.fc-next-button').click();
      } else {
        await this.page.locator('.fc-prev-button').click();
      }
    }

    throw new Error(`Nao foi possivel navegar para ${targetMonthName} de ${year}`);
  }

  private parseMonthTitle(title: string): { monthIndex: number; year: number } | null {
    const regex = /([a-z\u00E0-\u00FC]+)\s+de\s+(\d{4})/i;
    const match = title.match(regex);
    if (!match) {
      return null;
    }

    const monthName = match[1]
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
    const year = Number(match[2]);

    const monthIndex = MONTHS_PT.indexOf(monthName);
    if (monthIndex < 0 || Number.isNaN(year)) {
      return null;
    }

    return { monthIndex, year };
  }
}
