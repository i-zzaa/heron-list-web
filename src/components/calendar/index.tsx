import { Component, createRef, memo, useCallback, useMemo, useState } from 'react';
import { Calendar, momentLocalizer, View, Views } from 'react-big-calendar';
// Imports "profundos": não fazem parte da API pública do pacote, mas são as
// peças que as próprias views "Semana"/"Mês" embrulham por baixo dos panos
// (ver Week.js/Month.js) — precisamos delas pra montar versões sem domingo,
// no lugar de reimplementar a grade inteira do zero.
import TimeGrid from 'react-big-calendar/lib/TimeGrid';
import DateContentRow from 'react-big-calendar/lib/DateContentRow';
import RbcHeader from 'react-big-calendar/lib/Header';
import RbcDateHeader from 'react-big-calendar/lib/DateHeader';
import PopOverlay from 'react-big-calendar/lib/PopOverlay';
import { inRange, sortWeekEvents } from 'react-big-calendar/lib/utils/eventLevels';
import { notify } from 'react-big-calendar/lib/utils/helpers';
import { navigate as navigateConstants, views as viewConstants } from 'react-big-calendar/lib/utils/constants';
import getPopupPosition from 'dom-helpers/position';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { RRule } from 'rrule';
import moment from 'moment';
import { firtUpperCase, formatdateeua, getDateFormat } from '../../util/util';

// `moment` só entra aqui pra aritmética de datas (soma/range/comparação),
// que não depende de locale. Pra QUALQUER texto exibido em português (nome
// de mês, dia da semana, hora), usamos `Intl.DateTimeFormat('pt-BR', ...)`
// em vez de `moment.locale('pt-br')` — sob o dep-optimizer do Vite, o
// arquivo `moment/locale/pt-br` acaba empacotado como um chunk separado com
// sua PRÓPRIA cópia da instância do moment, então `defineLocale` registra
// "pt-br" nessa cópia isolada e o `moment` que o resto do app importa nunca
// vê a locale — tudo continua formatando em inglês, silenciosamente.
const localizer = momentLocalizer(moment);

const ptIntl = (options: Intl.DateTimeFormatOptions) => (date: Date) =>
  new Intl.DateTimeFormat('pt-BR', options).format(date);

const ptMonthLong = ptIntl({ month: 'long' });
const ptWeekdayLong = ptIntl({ weekday: 'long' });
const ptWeekdayShort = ptIntl({ weekday: 'short' });
const ptHour24 = ptIntl({ hour: '2-digit', minute: '2-digit', hour12: false });

// Sobrescreve os formatos que o próprio react-big-calendar desenha (cabeçalho
// de dia da semana no mês, cabeçalho de dia na semana/dia, régua de hora,
// range de horário do evento, cabeçalhos da Lista) — mesma razão do
// `formatToolbarTitle`: sem isso, tudo isso sai em inglês.
const PT_FORMATS = {
  weekdayFormat: (date: Date) => ptWeekdayShort(date).replace('.', ''),
  dayFormat: (date: Date) => `${ptWeekdayShort(date).replace('.', '')} ${moment(date).format('DD/MM')}`,
  // Título do popup "+N mais" (visão de mês, dia com evento demais pra
  // caber na linha).
  dayHeaderFormat: (date: Date) =>
    `${ptWeekdayLong(date)}, ${moment(date).format('D')} de ${ptMonthLong(date)}`,
  timeGutterFormat: ptHour24,
  eventTimeRangeFormat: ({ start, end }: { start: Date; end: Date }) =>
    `${ptHour24(start)} – ${ptHour24(end)}`,
  agendaDateFormat: (date: Date) => `${ptWeekdayShort(date).replace('.', '')} ${moment(date).format('DD/MM')}`,
  agendaTimeFormat: ptHour24,
  // Formato do horário quando início e fim caem no mesmo dia — é o que a
  // Lista realmente usa pra montar "08:00 – 09:00" (agendaTimeFormat sozinho
  // só cobre um horário isolado, sem intervalo).
  agendaTimeRangeFormat: ({ start, end }: { start: Date; end: Date }) =>
    `${ptHour24(start)} – ${ptHour24(end)}`,
  agendaHeaderFormat: ({ start, end }: { start: Date; end: Date }) =>
    `${moment(start).format('DD/MM/YYYY')} – ${moment(end).format('DD/MM/YYYY')}`,
};

// Grade de horário do dia/semana — mesma janela usada antes com o
// FullCalendar (08:00–20:00, slots de 20min).
const MIN_TIME = new Date(1972, 0, 1, 8, 0, 0);
const MAX_TIME = new Date(1972, 0, 1, 20, 0, 0);

const VIEW_LABELS: Record<string, string> = {
  [Views.MONTH]: 'Mês',
  [Views.WEEK]: 'Semana',
  [Views.DAY]: 'Dia',
  [Views.AGENDA]: 'Lista',
};

// Nomes de classe do FullCalendar preservados de propósito — a suíte e2e
// (e2e/pages/AgendaPage.ts) localiza o título e os botões de navegação por
// essas classes (`.fc-toolbar-title`, `.fc-next-button`, `.fc-prev-button`,
// `.fc-dayGridMonth-button`) e o slot de evento por `.fc-view-harness-active
// [data-testid="calendar-event-slot"]`. Trocar a lib não deveria exigir
// reescrever os testes, então o componente continua expondo esses hooks.
const FREQ_MAP: Record<string, number> = {
  yearly: RRule.YEARLY,
  monthly: RRule.MONTHLY,
  weekly: RRule.WEEKLY,
  daily: RRule.DAILY,
};

// O backend manda `start`/`end` já como data+hora completos, só que com
// espaço em vez de "T" (ex.: "2026-08-03 15:00", não "2026-08-03T15:00") —
// checar só `.includes('T')` classificava isso como "hora solta" e
// prefixava a data de novo (`"2026-08-03 2026-08-03 15:00"`), uma string
// inválida que o moment não parseia — por isso o evento inteiro sumia da
// agenda. Detecta pela presença da data no começo, não pelo separador.
const hasDateTime = (value: unknown) =>
  typeof value === 'string' && /^\d{4}-\d{2}-\d{2}[ T]/.test(value.trim());

const toIsoDateTime = (value: unknown): string => {
  const str = String(value ?? '');
  return str.includes('T') ? str : str.replace(' ', 'T');
};

// `rrule` trabalha internamente em UTC — sem isso, o horário do dtstart
// (já em horário local/naive, ex.: "2026-08-05T08:00") seria deslocado pelo
// fuso do navegador ao gerar as ocorrências. O par to/from mantém o
// horário "flutuante" (mesmo número, sem conversão real de fuso).
const toFloatingUtc = (date: Date) =>
  new Date(
    Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      date.getHours(),
      date.getMinutes(),
      date.getSeconds()
    )
  );

const fromFloatingUtc = (date: Date) =>
  new Date(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds()
  );

const parseLocalDate = (value: unknown): Date | undefined => {
  if (!value) {
    return undefined;
  }

  const parsed = moment(toIsoDateTime(value));
  return parsed.isValid() ? parsed.toDate() : undefined;
};

// Expande um evento recorrente (uma linha com `rrule.freq/dtstart/until` +
// `exdate`, vindo do backend) em uma ocorrência por semana dentro do range
// visível — o FullCalendar fazia isso internamente via @fullcalendar/rrule;
// o react-big-calendar não tem suporte a rrule, então a expansão passa a
// ser feita aqui, na mão, com a lib `rrule` (que o projeto já usa no form).
const expandRecurringEvent = (
  eventItem: any,
  rangeStart: Date,
  rangeEnd: Date
): Array<{ start: Date; end: Date }> => {
  const freqKey = String(eventItem?.rrule?.freq || '').toLowerCase();
  const freq = FREQ_MAP[freqKey];
  const dtstart = parseLocalDate(eventItem?.rrule?.dtstart);
  const until = parseLocalDate(eventItem?.rrule?.until);

  if (freq === undefined || !dtstart) {
    return [];
  }

  const rawStart = eventItem?.start || eventItem?.startTime;
  const rawEnd = eventItem?.end || eventItem?.endTime;
  const baseStart = parseLocalDate(
    hasDateTime(rawStart) ? rawStart : `${eventItem?.date} ${rawStart}`
  );
  const baseEnd = parseLocalDate(
    hasDateTime(rawEnd) ? rawEnd : `${eventItem?.date} ${rawEnd}`
  );
  const durationMs =
    baseStart && baseEnd ? baseEnd.getTime() - baseStart.getTime() : 0;

  const rule = new RRule({
    freq,
    interval: Number(eventItem?.rrule?.interval) || 1,
    dtstart: toFloatingUtc(dtstart),
    until: until ? toFloatingUtc(until) : undefined,
  });

  const exdates = new Set(
    (Array.isArray(eventItem?.exdate) ? eventItem.exdate : [])
      .map((item: string) => moment(toIsoDateTime(item)).format('YYYY-MM-DD'))
  );

  return rule
    .between(toFloatingUtc(rangeStart), toFloatingUtc(rangeEnd), true)
    .map(fromFloatingUtc)
    .filter((date) => !exdates.has(moment(date).format('YYYY-MM-DD')))
    .map((start) => ({
      start,
      end: new Date(start.getTime() + durationMs),
    }));
};

const normalizeRange = (range: Date[] | { start: Date; end: Date }) => {
  if (Array.isArray(range)) {
    return { start: range[0], end: range[range.length - 1] };
  }

  return range;
};

// Mesma matemática de range que o react-big-calendar faria internamente pra
// cada view — precisamos dela pronta pra chamar de fora (entrando/saindo do
// modo Salas, que desmonta o <Calendar>, então não dá pra depender do
// `onRangeChange` dele nesse instante).
const computeRangeForView = (targetDate: Date, targetView: View) => {
  const m = moment(targetDate);

  switch (targetView) {
    case Views.MONTH: {
      const start = m.clone().startOf('month').day(0);
      const end = m.clone().endOf('month').day(6);
      return { start: start.toDate(), end: end.toDate() };
    }
    case Views.WEEK:
      // Segunda a sábado — domingo não é dia útil e fica de fora da grade.
      return { start: m.clone().day(1).toDate(), end: m.clone().day(6).toDate() };
    case Views.AGENDA:
      return { start: m.clone().toDate(), end: m.clone().add(6, 'days').toDate() };
    case Views.DAY:
    default:
      return { start: m.clone().startOf('day').toDate(), end: m.clone().endOf('day').toDate() };
  }
};

const isSunday = (date: Date) => date.getDay() === 0;

// Domingo não é dia útil (a agenda nunca teve evento nele) — usado ao
// entrar/navegar nas views de Dia e Salas, que mostram um único dia (não dá
// pra simplesmente "esconder uma coluna" como na Semana).
const skipSunday = (date: Date, direction: 'PREV' | 'NEXT' = 'NEXT') => {
  if (!isSunday(date)) {
    return date;
  }
  return moment(date)
    .add(direction === 'PREV' ? -1 : 1, 'day')
    .toDate();
};

// View de Semana customizada, sem domingo — o react-big-calendar não tem
// suporte nativo a excluir um dia específico (só a "Work Week" pronta, que
// tira sábado E domingo; aqui o sábado é dia útil). É a mesma `TimeGrid` que
// a view "Semana" padrão usa por baixo (ver Week.js do pacote), só com um
// `range` de 6 dias em vez de 7.
const WeekNoSunday = (props: any) => {
  const { date, localizer, min, max, scrollToTime, enableAutoScroll, ...rest } = props;
  const range = WeekNoSunday.range(date, { localizer });

  return (
    <TimeGrid
      {...rest}
      range={range}
      eventOffset={15}
      localizer={localizer}
      min={min ?? localizer.startOf(new Date(), 'day')}
      max={max ?? localizer.endOf(new Date(), 'day')}
      scrollToTime={scrollToTime ?? localizer.startOf(new Date(), 'day')}
      enableAutoScroll={enableAutoScroll ?? true}
    />
  );
};

WeekNoSunday.range = (date: Date, { localizer }: any) => {
  const firstOfWeek = localizer.startOfWeek();
  const start = localizer.startOf(date, 'week', firstOfWeek);
  const end = localizer.endOf(date, 'week', firstOfWeek);
  return localizer.range(start, end).filter((d: Date) => d.getDay() !== 0);
};

WeekNoSunday.navigate = (date: Date, action: string, { localizer }: any) => {
  switch (action) {
    case 'PREV':
      return localizer.add(date, -1, 'week');
    case 'NEXT':
      return localizer.add(date, 1, 'week');
    default:
      return date;
  }
};

WeekNoSunday.title = (date: Date, { localizer }: any) => {
  const range = WeekNoSunday.range(date, { localizer });
  return localizer.format(
    { start: range[0], end: range[range.length - 1] },
    'dayRangeHeaderFormat'
  );
};

const chunkDays = (days: Date[], size: number): Date[][] => {
  const chunks: Date[][] = [];
  for (let i = 0; i < days.length; i += size) {
    chunks.push(days.slice(i, i + size));
  }
  return chunks;
};

const eventsForWeek = (
  events: any[],
  start: Date,
  end: Date,
  accessors: any,
  localizer: any
) => events.filter((e) => inRange(e, start, end, accessors, localizer));

// View de Mês customizada, sem domingo — igual à `WeekNoSunday`, mas aqui
// não tem uma peça pública pra embrulhar: a `MonthView` da lib já É a
// implementação inteira (renderiza semana a semana, mede quantas linhas
// cabem, mostra "+N mais" etc.), sem separar layout de conteúdo como a
// `TimeGrid` faz pra semana/dia. Pra remover a coluna de domingo (a lib faz
// `chunk(dias, 7)` fixo, sem parametrização), recriamos a view inteira aqui
// reaproveitando as peças internas dela (`DateContentRow`, `Header`,
// `DateHeader`, `PopOverlay`) — é essencialmente um fork de Month.js, só
// trocando "semana de 7 dias" por "semana de 6 dias (seg–sáb)".
class MonthNoSunday extends Component<any, any> {
  containerRef: any;
  slotRowRef: any;
  _resizeListener: any;
  _pendingSelection: Date[];
  _selectTimer: any;
  _weekCount: number;

  static getDerivedStateFromProps(props: any, state: any) {
    const { date, localizer } = props;
    return {
      date,
      needLimitMeasure:
        state.needLimitMeasure || localizer.neq(date, state.date, 'month'),
    };
  }

  constructor(props: any) {
    super(props);
    this.state = { rowLimit: 5, needLimitMeasure: true, date: null };
    this.containerRef = createRef();
    this.slotRowRef = createRef();
    this._pendingSelection = [];
    this._weekCount = 0;
  }

  componentDidMount() {
    if (this.state.needLimitMeasure) {
      this.measureRowLimit();
    }
    let running = false;
    this._resizeListener = () => {
      if (!running) {
        running = true;
        requestAnimationFrame(() => {
          running = false;
          this.setState({ needLimitMeasure: true });
        });
      }
    };
    window.addEventListener('resize', this._resizeListener, false);
  }

  componentDidUpdate() {
    if (this.state.needLimitMeasure) {
      this.measureRowLimit();
    }
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this._resizeListener, false);
  }

  getContainer = () => this.containerRef.current;

  measureRowLimit() {
    this.setState({
      needLimitMeasure: false,
      rowLimit: this.slotRowRef.current.getRowLimit(),
    });
  }

  clearSelection() {
    clearTimeout(this._selectTimer);
    this._pendingSelection = [];
  }

  handleSelectSlot = (range: Date[], slotInfo: any) => {
    this._pendingSelection = this._pendingSelection.concat(range);
    clearTimeout(this._selectTimer);
    this._selectTimer = setTimeout(() => this.selectDates(slotInfo));
  };

  selectDates(slotInfo: any) {
    const slots = this._pendingSelection.slice();
    this._pendingSelection = [];
    slots.sort((a, b) => +a - +b);

    const start = new Date(slots[0]);
    const end = new Date(slots[slots.length - 1]);
    end.setDate(slots[slots.length - 1].getDate() + 1);

    notify(this.props.onSelectSlot, {
      slots,
      start,
      end,
      action: slotInfo.action,
      bounds: slotInfo.bounds,
      box: slotInfo.box,
    });
  }

  handleHeadingClick = (date: Date, view: any, e: any) => {
    e.preventDefault();
    this.clearSelection();
    notify(this.props.onDrillDown, [date, view]);
  };

  handleSelectEvent = (...args: any[]) => {
    this.clearSelection();
    notify(this.props.onSelectEvent, args);
  };

  handleDoubleClickEvent = (...args: any[]) => {
    this.clearSelection();
    notify(this.props.onDoubleClickEvent, args);
  };

  handleKeyPressEvent = (...args: any[]) => {
    this.clearSelection();
    notify(this.props.onKeyPressEvent, args);
  };

  handleShowMore = (events: any[], date: Date, cell: any, _slot: any, target: any) => {
    const { popup, onDrillDown, onShowMore, getDrilldownView, doShowMoreDrillDown } =
      this.props;
    this.clearSelection();

    if (popup) {
      const position = getPopupPosition(cell, this.containerRef.current);
      this.setState({ overlay: { date, events, position, target } });
    } else if (doShowMoreDrillDown) {
      notify(onDrillDown, [date, getDrilldownView(date) || viewConstants.DAY]);
    }

    notify(onShowMore, [events, date, _slot]);
  };

  overlayDisplay = () => {
    this.setState({ overlay: null });
  };

  readerDateHeading = ({ date, className, ...props }: any) => {
    const { date: currentDate, getDrilldownView, localizer } = this.props;
    const isOffRange = localizer.neq(currentDate, date, 'month');
    const isCurrent = localizer.isSameDate(date, currentDate);
    const drilldownView = getDrilldownView(date);
    const label = localizer.format(date, 'dateFormat');
    const DateHeaderComponent = this.props.components.dateHeader || RbcDateHeader;

    return (
      <div
        {...props}
        className={[className, isOffRange && 'rbc-off-range', isCurrent && 'rbc-current']
          .filter(Boolean)
          .join(' ')}
        role="cell"
      >
        <DateHeaderComponent
          label={label}
          date={date}
          drilldownView={drilldownView}
          isOffRange={isOffRange}
          onDrillDown={(e: any) => this.handleHeadingClick(date, drilldownView, e)}
        />
      </div>
    );
  };

  renderWeek = (week: Date[], weekIdx: number) => {
    const {
      events,
      components,
      selectable,
      getNow,
      selected,
      date,
      localizer,
      longPressThreshold,
      accessors,
      getters,
      showAllEvents,
    } = this.props;
    const { needLimitMeasure, rowLimit } = this.state;

    const weeksEvents = eventsForWeek(
      [...events],
      week[0],
      week[week.length - 1],
      accessors,
      localizer
    );
    const sorted = sortWeekEvents(weeksEvents, accessors, localizer);

    return (
      <DateContentRow
        key={weekIdx}
        ref={weekIdx === 0 ? this.slotRowRef : undefined}
        container={this.getContainer}
        className="rbc-month-row"
        getNow={getNow}
        date={date}
        range={week}
        events={sorted}
        maxRows={showAllEvents ? Infinity : rowLimit}
        selected={selected}
        selectable={selectable}
        components={components}
        accessors={accessors}
        getters={getters}
        localizer={localizer}
        renderHeader={this.readerDateHeading}
        renderForMeasure={needLimitMeasure}
        onShowMore={this.handleShowMore}
        onSelect={this.handleSelectEvent}
        onDoubleClick={this.handleDoubleClickEvent}
        onKeyPress={this.handleKeyPressEvent}
        onSelectSlot={this.handleSelectSlot}
        longPressThreshold={longPressThreshold}
        rtl={this.props.rtl}
        resizable={this.props.resizable}
        showAllEvents={showAllEvents}
      />
    );
  };

  renderHeaders(row: Date[]) {
    const { localizer, components } = this.props;
    const first = row[0];
    const last = row[row.length - 1];
    const HeaderComponent = components.header || RbcHeader;

    return localizer.range(first, last, 'day').map((day: Date, idx: number) => (
      <div key={`header_${idx}`} className="rbc-header">
        <HeaderComponent date={day} localizer={localizer} label={localizer.format(day, 'weekdayFormat')} />
      </div>
    ));
  }

  renderOverlay() {
    const overlay = this.state?.overlay ?? {};
    const { accessors, localizer, components, getters, selected, popupOffset, handleDragStart } =
      this.props;

    return (
      <PopOverlay
        overlay={overlay}
        accessors={accessors}
        localizer={localizer}
        components={components}
        getters={getters}
        selected={selected}
        popupOffset={popupOffset}
        ref={this.containerRef}
        handleKeyPressEvent={this.handleKeyPressEvent}
        handleSelectEvent={this.handleSelectEvent}
        handleDoubleClickEvent={this.handleDoubleClickEvent}
        handleDragStart={handleDragStart}
        show={!!overlay.position}
        overlayDisplay={this.overlayDisplay}
        onHide={() => this.setState({ overlay: null })}
      />
    );
  }

  render() {
    const { date, localizer, className } = this.props;
    // Única diferença real em relação à MonthView original: filtra domingo
    // fora da grade de dias visíveis e agrupa de 6 em 6 (não 7).
    const month = localizer
      .visibleDays(date, localizer)
      .filter((day: Date) => day.getDay() !== 0);
    const weeks = chunkDays(month, 6);
    this._weekCount = weeks.length;

    return (
      <div
        className={['rbc-month-view', className].filter(Boolean).join(' ')}
        role="table"
        aria-label="Month View"
        ref={this.containerRef}
      >
        <div className="rbc-row rbc-month-header" role="row">
          {this.renderHeaders(weeks[0])}
        </div>
        {weeks.map((week, idx) => this.renderWeek(week, idx))}
        {this.props.popup ? this.renderOverlay() : null}
      </div>
    );
  }

  static range(date: Date, { localizer }: any) {
    const month = localizer
      .visibleDays(date, localizer)
      .filter((day: Date) => day.getDay() !== 0);
    return { start: month[0], end: month[month.length - 1] };
  }

  static navigate(date: Date, action: string, { localizer }: any) {
    switch (action) {
      case navigateConstants.PREVIOUS:
        return localizer.add(date, -1, 'month');
      case navigateConstants.NEXT:
        return localizer.add(date, 1, 'month');
      default:
        return date;
    }
  }

  static title(date: Date, { localizer }: any) {
    return localizer.format(date, 'monthHeaderFormat');
  }
}

const isAttendedEvent = (eventItem: any) => {
  const statusValue =
    eventItem?.statusEventos?.nome || eventItem?.statusEventos || eventItem?.status || '';
  return String(statusValue).trim().toLowerCase() === 'atendido';
};

const isCanceledEvent = (eventItem: any) => {
  const statusValue =
    eventItem?.statusEventos?.nome || eventItem?.statusEventos || eventItem?.status || '';
  return String(statusValue).trim().toLowerCase().includes('cancelado');
};

const getEventColor = (eventItem: any) =>
  eventItem?.backgroundColor || eventItem?.color || eventItem?.especialidade?.cor;

// Título "mês de ano" (ex.: "agosto de 2026") replicando o formato que o
// FullCalendar usava — é literalmente o texto que o e2e casa via regex.
const formatToolbarTitle = (date: Date, view: View) => {
  const m = moment(date);
  switch (view) {
    case Views.MONTH:
      return `${ptMonthLong(date)} de ${m.format('YYYY')}`;
    case Views.WEEK: {
      const start = m.clone().day(1);
      const end = m.clone().day(6);
      const sameMonth = start.month() === end.month();
      return sameMonth
        ? `${start.format('D')} – ${end.format('D')} de ${ptMonthLong(
            end.toDate()
          )} de ${end.format('YYYY')}`
        : `${start.format('D')} de ${ptMonthLong(start.toDate())} – ${end.format(
            'D'
          )} de ${ptMonthLong(end.toDate())} de ${end.format('YYYY')}`;
    }
    case Views.DAY:
      return `${ptWeekdayLong(date)}, ${m.format('D')} de ${ptMonthLong(
        date
      )} de ${m.format('YYYY')}`;
    default:
      return `${ptMonthLong(date)} de ${m.format('YYYY')}`;
  }
};

// Não usa mais o `onNavigate`/`onView` que o react-big-calendar injeta
// (via `components.toolbar`) — em modo Salas o `<Calendar>` fica desmontado
// (é um grid próprio, não uma view do rbc), então os botões chamam direto
// os handlers do CalendarComponentBase (`onPrevNext`/`onSwitchView`), que
// funcionam igual estando o rbc montado ou não.
const CustomToolbar = ({
  date,
  view,
  roomMode,
  onPrevNext,
  onSwitchView,
}: any) => {
  return (
    <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
      <div className="flex items-center gap-1">
        <button
          type="button"
          className="fc-prev-button p-button p-component p-button-icon-only"
          onClick={() => onPrevNext('PREV')}
        >
          <i className="pi pi-chevron-left" />
        </button>
        <button
          type="button"
          className="fc-next-button p-button p-component p-button-icon-only"
          onClick={() => onPrevNext('NEXT')}
        >
          <i className="pi pi-chevron-right" />
        </button>
      </div>

      <span className="fc-toolbar-title font-bold">
        {firtUpperCase(formatToolbarTitle(date, view))}
      </span>

      <div className="flex items-center gap-1">
        {([Views.MONTH, Views.WEEK, Views.DAY] as View[]).map((viewOption) => (
          <button
            key={viewOption}
            type="button"
            className={`${
              viewOption === Views.MONTH ? 'fc-dayGridMonth-button' : ''
            } p-button p-component p-button-sm ${
              !roomMode && view === viewOption ? 'p-button-raised' : 'p-button-outlined'
            }`}
            onClick={() => onSwitchView(viewOption, false)}
          >
            {VIEW_LABELS[viewOption]}
          </button>
        ))}
        <button
          type="button"
          className={`p-button p-component p-button-sm ${
            roomMode ? 'p-button-raised' : 'p-button-outlined'
          }`}
          onClick={() => onSwitchView(Views.DAY, true)}
        >
          Salas
        </button>
        <button
          type="button"
          className={`p-button p-component p-button-sm ${
            !roomMode && view === Views.AGENDA ? 'p-button-raised' : 'p-button-outlined'
          }`}
          onClick={() => onSwitchView(Views.AGENDA, false)}
        >
          {VIEW_LABELS[Views.AGENDA]}
        </button>
      </div>
    </div>
  );
};

// Assinala cada evento a uma "raia" (lane) dentro da linha da sala, pra
// eventos que se sobrepõem no horário não ficarem um em cima do outro —
// varredura gulosa: usa a primeira raia cuja última ocupação já terminou.
const assignLanes = (events: any[]): Array<{ event: any; lane: number }> => {
  const sorted = [...events].sort(
    (a, b) => a.start.getTime() - b.start.getTime()
  );
  const laneEnds: number[] = [];

  return sorted.map((event) => {
    let lane = laneEnds.findIndex((end) => end <= event.start.getTime());
    if (lane === -1) {
      lane = laneEnds.length;
    }
    laneEnds[lane] = event.end.getTime();
    return { event, lane };
  });
};

const ROOM_GRID_START_MIN = 8 * 60;
const ROOM_GRID_END_MIN = 20 * 60;
const ROOM_GRID_RANGE_MIN = ROOM_GRID_END_MIN - ROOM_GRID_START_MIN;
// Marcações de 08h a 20h — 12 colunas de 1h cada.
const ROOM_GRID_HOURS = Array.from({ length: 13 }, (_, i) => 8 + i);
// Largura mínima da área de horário — abaixo disso a coluna de 1h fica
// apertada demais pra ler, e a barra de scroll horizontal assume; acima
// disso as colunas esticam (flex) pra preencher a tela toda em vez de
// deixar espaço vazio sobrando à direita.
const ROOM_GRID_MIN_WIDTH = 960;
const ROOM_LABEL_WIDTH = 176;
const ROOM_LANE_HEIGHT = 40;
// Largura mínima de um bloco EM PIXELS (não %) — sem isso um evento de
// 20min vira uma tira fina demais pra ler o nome ou clicar com precisão,
// não importa o quanto a tela seja larga.
const ROOM_MIN_EVENT_PX = 64;

const minutesOfDay = (date: Date) => date.getHours() * 60 + date.getMinutes();

// Posição em % da área de horário (não px fixo) — é o que faz a grade
// esticar/encolher com a largura da tela em vez de sobrar espaço vazio.
// Cabeçalho e cada linha de sala usam a mesma área (`flex-1` com o mesmo
// `min-width`), então a mesma porcentagem sempre cai exatamente sob a
// coluna de hora certa.
const toGridPercent = (date: Date) => {
  const minutes = Math.min(
    Math.max(minutesOfDay(date), ROOM_GRID_START_MIN),
    ROOM_GRID_END_MIN
  );
  return ((minutes - ROOM_GRID_START_MIN) / ROOM_GRID_RANGE_MIN) * 100;
};

// Visão "Salas": linhas = salas, colunas = horário — o inverso da grade
// padrão do react-big-calendar (que só faz sala-como-coluna). Como o rbc não
// tem esse layout pronto, é um grid próprio; os blocos ficam posicionados em
// % da largura disponível, então a grade preenche a tela (responsiva) e a
// duração de cada evento continua visível na largura do bloco.
const RoomGrid = ({ date, events, resources, onSelectEvent }: any) => {
  const eventsByResource = useMemo(() => {
    const map = new Map<string, any[]>();
    const targetDay = moment(date).format('YYYY-MM-DD');

    (Array.isArray(events) ? events : []).forEach((event: any) => {
      if (moment(event.start).format('YYYY-MM-DD') !== targetDay) {
        return;
      }
      if (!event.resourceId) {
        return;
      }
      const list = map.get(event.resourceId) || [];
      list.push(event);
      map.set(event.resourceId, list);
    });

    return map;
  }, [events, date]);

  return (
    <div
      className="border border-gray-300 rounded-lg bg-white shadow-sm overflow-auto"
      style={{ maxHeight: 'calc(100vh - 320px)' }}
    >
      <div style={{ minWidth: ROOM_LABEL_WIDTH + ROOM_GRID_MIN_WIDTH }}>
        <div className="flex sticky top-0 z-20">
          <div
            className="flex-shrink-0 p-2 font-semibold text-xs text-gray-800 sticky left-0 z-10 bg-gray-300 border-b border-r border-gray-300 flex items-center"
            style={{ width: ROOM_LABEL_WIDTH }}
          >
            Sala
          </div>
          <div
            className="relative h-9 bg-gray-300 border-b border-gray-300 flex-1"
            style={{ minWidth: ROOM_GRID_MIN_WIDTH }}
          >
            {ROOM_GRID_HOURS.map((hour, index) => {
              const isLast = index === ROOM_GRID_HOURS.length - 1;
              return (
                <span
                  key={hour}
                  className="absolute text-xs font-semibold text-gray-800 top-1/2 -translate-y-1/2"
                  style={
                    isLast
                      ? { right: 4 }
                      : { left: `${toGridPercent(new Date(1970, 0, 1, hour, 0))}%`, marginLeft: 6 }
                  }
                >
                  {String(hour).padStart(2, '0')}:00
                </span>
              );
            })}
          </div>
        </div>

        {(Array.isArray(resources) ? resources : []).map(
          (resource: any, resourceIndex: number) => {
            const roomEvents = eventsByResource.get(resource.id) || [];
            const lanes = assignLanes(roomEvents);
            const laneCount = Math.max(1, ...lanes.map((l) => l.lane + 1));
            const rowHeight = laneCount * ROOM_LANE_HEIGHT + 8;
            const rowBg = resourceIndex % 2 === 0 ? 'bg-white' : 'bg-gray-200';

            return (
              <div key={resource.id} className={`flex border-b border-gray-300 ${rowBg}`}>
                <div
                  className={`flex-shrink-0 p-2 text-sm text-gray-800 flex items-center sticky left-0 z-10 border-r border-gray-300 ${rowBg}`}
                  style={{ width: ROOM_LABEL_WIDTH }}
                >
                  {resource.title}
                </div>
                <div
                  className="relative flex-1"
                  style={{
                    minWidth: ROOM_GRID_MIN_WIDTH,
                    height: rowHeight,
                    backgroundImage:
                      'linear-gradient(to right, #D3D3D3 1px, transparent 1px)',
                    backgroundSize: `${100 / (ROOM_GRID_HOURS.length - 1)}% 100%`,
                  }}
                >
                  {lanes.map(({ event, lane }) => {
                    const leftPercent = toGridPercent(event.start);
                    const rightPercent = toGridPercent(event.end);
                    const eventItem = event?.resourceRef || {};
                    const color = getEventColor(eventItem);
                    const isCanceled = isCanceledEvent(eventItem);
                    const isAttended = isAttendedEvent(eventItem);
                    const timeLabel = `${moment(event.start).format(
                      'HH:mm'
                    )}–${moment(event.end).format('HH:mm')}`;

                    return (
                      <button
                        key={event.id}
                        type="button"
                        data-testid="calendar-event-slot"
                        data-event-id={String(event.id || '')}
                        data-event-start={moment(event.start).format(
                          'YYYY-MM-DDTHH:mm:ss'
                        )}
                        title={`${event.title} — ${timeLabel}`}
                        className={`absolute flex items-center gap-1 rounded px-2 text-xs font-medium text-white shadow-sm ${
                          isCanceled ? 'calendar-event-canceled opacity-80' : ''
                        }`}
                        style={{
                          left: `${leftPercent}%`,
                          width: `${rightPercent - leftPercent}%`,
                          minWidth: ROOM_MIN_EVENT_PX,
                          top: lane * ROOM_LANE_HEIGHT + 4,
                          height: ROOM_LANE_HEIGHT - 6,
                          backgroundColor: color || '#685ec5',
                        }}
                        onClick={() => onSelectEvent(event)}
                      >
                        <span
                          className={`truncate min-w-0 ${
                            isCanceled ? 'line-through' : ''
                          }`}
                          data-testid="calendar-event-title"
                        >
                          {event.title}
                        </span>
                        {isAttended ? (
                          <i
                            className="pi pi-check flex-shrink-0"
                            style={{ fontSize: '10px' }}
                            title="Atendido"
                          />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          }
        )}
      </div>
    </div>
  );
};

// Componente de evento — replica o conteúdo custom que o FullCalendar
// renderizava: bolinha da cor da especialidade só nas visões de mês/lista
// (nas outras visões o bloco inteiro do evento já é colorido via
// eventPropGetter), título riscado quando cancelado e ✓ quando atendido.
const EventContent = ({ event, view }: any) => {
  const eventItem = event?.resourceRef || {};
  const isAttended = isAttendedEvent(eventItem);
  const isCanceled = isCanceledEvent(eventItem);
  const isDotView = view === Views.MONTH || view === Views.AGENDA;
  const color = getEventColor(eventItem);

  return (
    <div className="fc-event-title-container flex items-center gap-1 overflow-hidden">
      {isDotView && color ? (
        <span
          className="flex-shrink-0 rounded-full"
          style={{ width: '8px', height: '8px', backgroundColor: color }}
          data-testid="calendar-event-dot"
        />
      ) : null}
      <span
        className={`truncate ${isCanceled ? 'line-through' : ''}`}
        data-testid="calendar-event-title"
      >
        {event.title}
      </span>
      {isAttended ? (
        <i className="pi pi-check flex-shrink-0" title="Atendido" />
      ) : null}
    </div>
  );
};

const CalendarComponentBase = ({
  events,
  resources,
  openModalEdit,
  onRangeChange,
  dateClick,
}: any) => {
  const [date, setDate] = useState<Date>(() => skipSunday(new Date()));
  const [view, setView] = useState<View>(Views.WEEK);
  const [roomMode, setRoomMode] = useState(false);
  const [visibleRange, setVisibleRange] = useState<{ start: Date; end: Date }>(
    () => ({
      start: moment().day(1).startOf('day').toDate(),
      end: moment().day(6).endOf('day').toDate(),
    })
  );

  const normalizedResources = useMemo(() => {
    if (!roomMode || !Array.isArray(resources)) {
      return undefined;
    }

    return resources
      .filter((localidade: any) => localidade?.id !== undefined && localidade?.id !== null)
      .map((localidade: any) => ({
        id: String(localidade.id),
        title: localidade?.nome || `Sala ${localidade.id}`,
      }));
  }, [resources, roomMode]);

  const normalizedEvents = useMemo(() => {
    if (!Array.isArray(events)) {
      return [];
    }

    return events.reduce((acc: any[], eventItem: any, index: number) => {
      const dateStr = eventItem?.date || eventItem?.dataInicio;
      const rawStart = eventItem?.start || eventItem?.startTime;
      const rawEnd = eventItem?.end || eventItem?.endTime;
      const isRecurringEvent =
        eventItem?.frequencia?.id === 2 ||
        String(eventItem?.frequencia?.nome || '').toLowerCase() === 'recorrente';

      if (!rawStart || !rawEnd) {
        return acc;
      }

      const id =
        eventItem?.id && eventItem.id !== 0
          ? String(eventItem.id)
          : `${eventItem?.groupId || 'evento'}-${
              dateStr || 'sem-data'
            }-${rawStart}-${rawEnd}-${index}`;

      const resourceId = eventItem?.localidadeId ?? eventItem?.localidade?.id;
      const title = eventItem?.title || eventItem?.paciente?.nome || 'Evento';

      if (isRecurringEvent && eventItem?.rrule?.freq) {
        const occurrences = expandRecurringEvent(
          eventItem,
          visibleRange.start,
          visibleRange.end
        );

        occurrences.forEach((occurrence, occurrenceIndex) => {
          acc.push({
            id: `${id}-${occurrenceIndex}`,
            title,
            start: occurrence.start,
            end: occurrence.end,
            resourceId:
              resourceId !== undefined && resourceId !== null
                ? String(resourceId)
                : undefined,
            resourceRef: eventItem,
          });
        });

        return acc;
      }

      const start = hasDateTime(rawStart)
        ? parseLocalDate(rawStart)
        : dateStr
        ? parseLocalDate(`${dateStr} ${rawStart}`)
        : undefined;
      const end = hasDateTime(rawEnd)
        ? parseLocalDate(rawEnd)
        : dateStr
        ? parseLocalDate(`${dateStr} ${rawEnd}`)
        : undefined;

      if (!start || !end) {
        return acc;
      }

      acc.push({
        id,
        title,
        start,
        end,
        resourceId:
          resourceId !== undefined && resourceId !== null
            ? String(resourceId)
            : undefined,
        resourceRef: eventItem,
      });

      return acc;
    }, []);
  }, [events, visibleRange]);

  const handleRangeChange = useCallback(
    (range: Date[] | { start: Date; end: Date }, nextView?: View) => {
      const normalized = normalizeRange(range);
      // Amplia pro início/fim do dia — o range que o rbc devolve pra visão
      // de mês vem com o `end` cravado em 00:00 do último dia da grade, o
      // que cortaria qualquer ocorrência recorrente daquele mesmo dia (elas
      // acontecem num horário, ex. 08:00, sempre depois da meia-noite).
      const boundedRange = {
        start: moment(normalized.start).startOf('day').toDate(),
        end: moment(normalized.end).endOf('day').toDate(),
      };
      setVisibleRange(boundedRange);

      onRangeChange({
        start: moment(boundedRange.start).format('YYYY-MM-DD'),
        end: moment(boundedRange.end).format('YYYY-MM-DD'),
        type: nextView || view,
      });
    },
    [onRangeChange, view]
  );

  const handleNavigate = useCallback((newDate: Date) => {
    setDate(newDate);
  }, []);

  const handleView = useCallback((newView: View) => {
    setView(newView);
  }, []);

  // Aplica um novo range visível (recalcula a expansão de recorrência e
  // dispara a busca no backend) — usado tanto pela navegação quanto pela
  // troca de view/modo Salas, que não passam mais pelo `onRangeChange` do
  // rbc (o `<Calendar>` fica desmontado em modo Salas).
  const applyRange = useCallback(
    (start: Date, end: Date, targetView: View) => {
      const boundedRange = {
        start: moment(start).startOf('day').toDate(),
        end: moment(end).endOf('day').toDate(),
      };
      setVisibleRange(boundedRange);
      onRangeChange({
        start: moment(boundedRange.start).format('YYYY-MM-DD'),
        end: moment(boundedRange.end).format('YYYY-MM-DD'),
        type: targetView,
      });
    },
    [onRangeChange]
  );

  // Botões de prev/next da toolbar — em modo Salas (grid próprio, sem
  // `<Calendar>` montado) avança/volta um dia; nas demais views replica a
  // navegação que o rbc faria (mês/semana/dia/lista).
  const handlePrevNext = useCallback(
    (direction: 'PREV' | 'NEXT') => {
      const delta = direction === 'PREV' ? -1 : 1;
      const isSingleDay = roomMode || view === Views.DAY;
      const unit = isSingleDay ? 'day' : view === Views.MONTH ? 'month' : 'week';
      let nextDate = moment(date).add(delta, unit).toDate();
      // Dia/Salas mostram um único dia — não tem coluna de domingo pra
      // "pular" como na Semana, então o próprio prev/next avança mais um
      // dia quando cairia nele.
      if (isSingleDay) {
        nextDate = skipSunday(nextDate, direction);
      }
      setDate(nextDate);

      const range = roomMode
        ? {
            start: moment(nextDate).startOf('day').toDate(),
            end: moment(nextDate).endOf('day').toDate(),
          }
        : computeRangeForView(nextDate, view);
      applyRange(range.start, range.end, view);
    },
    [date, roomMode, view, applyRange]
  );

  // Troca de view/modo — chamado direto pelos botões da toolbar, sem passar
  // pelo `onView` do rbc (que só existiria com o `<Calendar>` montado).
  const switchView = useCallback(
    (nextView: View, nextRoomMode: boolean) => {
      const isSingleDay = nextRoomMode || nextView === Views.DAY;
      const nextDate = isSingleDay ? skipSunday(date) : date;

      setRoomMode(nextRoomMode);
      setView(nextView);
      if (nextDate !== date) {
        setDate(nextDate);
      }

      const range = nextRoomMode
        ? {
            start: moment(nextDate).startOf('day').toDate(),
            end: moment(nextDate).endOf('day').toDate(),
          }
        : computeRangeForView(nextDate, nextView);
      applyRange(range.start, range.end, nextView);
    },
    [date, applyRange]
  );

  const handleSelectSlot = useCallback(
    ({ start }: any) => {
      dateClick(moment(start).format('YYYY-MM-DD'));
    },
    [dateClick]
  );

  const handleSelectEvent = useCallback(
    (event: any) => {
      const eventItem = event?.resourceRef || {};
      openModalEdit({
        ...eventItem,
        id: Number(eventItem?.id) || event.id,
        dataAtual: formatdateeua(event.start),
        date: getDateFormat(event.start),
        groupId: eventItem?.groupId,
      });
    },
    [openModalEdit]
  );

  const eventPropGetter = useCallback(
    (event: any) => {
      const eventItem = event?.resourceRef || {};
      const color = getEventColor(eventItem);
      const canceled = isCanceledEvent(eventItem);

      // Nas visões de mês e lista o evento não pinta o bloco/linha inteiro —
      // só a bolinha (ver EventContent) — senão vira um bastão colorido
      // gigante, difícil de ler com vários eventos no mesmo dia.
      if (view === Views.MONTH || view === Views.AGENDA) {
        return {
          className: canceled ? 'calendar-event-canceled' : undefined,
          style: {
            backgroundColor: 'transparent',
            border: 'none',
            boxShadow: 'none',
            color: '#52525B',
          },
        };
      }

      return {
        className: canceled ? 'calendar-event-canceled' : undefined,
        style: color
          ? {
              backgroundColor: color,
              borderColor: color,
            }
          : undefined,
      };
    },
    [view]
  );

  // Repassa `data-testid`/`data-event-id`/`data-event-start` pro elemento
  // raiz do evento (o e2e busca o slot por esses atributos) — o
  // react-big-calendar não expõe um "eventDidMount", então isso é feito via
  // wrapper próprio em vez de manipular o DOM depois de montado.
  const components = useMemo(
    () => ({
      event: (props: any) => <EventContent {...props} view={view} />,
      eventWrapper: ({ event, children }: any) => (
        <div
          data-testid="calendar-event-slot"
          data-event-id={String(event.id || '')}
          data-event-start={moment(event.start).format('YYYY-MM-DDTHH:mm:ss')}
          className={isCanceledEvent(event?.resourceRef) ? 'calendar-event-canceled' : ''}
        >
          {children}
        </div>
      ),
    }),
    [view]
  );

  return (
    <div>
      <div className="card text-sm font-inter fc-view-harness-active">
        <CustomToolbar
          date={date}
          view={view}
          roomMode={roomMode}
          onPrevNext={handlePrevNext}
          onSwitchView={switchView}
        />

        {roomMode ? (
          <RoomGrid
            date={date}
            events={normalizedEvents}
            resources={normalizedResources}
            onSelectEvent={handleSelectEvent}
          />
        ) : (
          <Calendar
            localizer={localizer}
            culture="pt-br"
            events={normalizedEvents}
            date={date}
            view={view}
            views={{
              month: MonthNoSunday,
              week: WeekNoSunday,
              day: true,
              agenda: true,
            }}
            length={7}
            min={MIN_TIME}
            max={MAX_TIME}
            step={20}
            timeslots={3}
            selectable
            popup
            onNavigate={handleNavigate}
            onView={handleView}
            onRangeChange={handleRangeChange}
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            eventPropGetter={eventPropGetter}
            components={components}
            formats={PT_FORMATS}
            style={{ height: 'calc(100vh - 250px)' }}
            messages={{
              allDay: 'Dia inteiro',
              previous: 'Anterior',
              next: 'Próximo',
              today: 'Hoje',
              month: 'Mês',
              week: 'Semana',
              day: 'Dia',
              agenda: 'Lista',
              date: 'Data',
              time: 'Hora',
              event: 'Evento',
              noEventsInRange: 'Não há eventos neste período.',
              showMore: (total: number) => `+${total} mais`,
            }}
            toolbar={false}
          />
        )}
      </div>
    </div>
  );
};

// Evita reprocessar plugins/eventos em renders da tela que não mudam
// events/resources/handlers (ex.: abrir/fechar modais) — mesma razão de
// antes com o FullCalendar.
export const CalendarComponent = memo(CalendarComponentBase);
