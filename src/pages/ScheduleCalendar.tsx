import { useCallback, useEffect, useState } from 'react';
import { deleteItem, getList, update } from '../server';
import { Card, Confirm, Filter, Modal } from '../components';
import { CalendarComponent } from '../components/calendar';
import { LoadingHeron } from '../components/loading';
import { ViewEvento } from '../components/view-evento';
import { CalendarForm } from '../foms/CalendarForm';
import { useDropdown } from '../contexts/dropDown';
import { filterCalendarFields } from '../constants/formFields';
import {
  formatdateeua,
  getDateFormat,
  getPrimeiroDoMes,
  getUltimoDoMes,
} from '../util/util';
import { STATUS_PACIENT_COD } from '../constants/patient';
import { permissionAuth } from '../contexts/permission';
import { useToast } from '../contexts/toast';
import { useAuth } from '../contexts/auth';
import { PERFIL } from '../constants/user';
import { buildEventFilterUrl } from '../util/calendar';
import { isProfile } from '../util/permissions';
import { resolveResponseData } from '../util/pagination';
import { buildErrorToast } from '../util/error';

const fieldsConst = filterCalendarFields;

// Só normaliza o formato do payload (backend às vezes manda um objeto
// indexado por id em vez de array) — NÃO faz mais o trabalho de decidir
// recorrência, montar id de fallback ou remontar start/end: isso já é
// refeito do zero, campo a campo, pelo useMemo de CalendarComponent (que
// precisa rodar de qualquer forma pra produzir o formato específico do
// FullCalendar). Fazer as duas coisas era processar cada evento duas vezes
// inteiras a cada troca de data — a causa mais provável do pico de
// lentidão ao navegar no calendário.
const normalizeCalendarEvents = (events: any[] = []) => {
  if (Array.isArray(events)) {
    return events;
  }

  return events && typeof events === 'object' ? Object.values(events) : [];
};

export default function ScheduleCalendar() {
  const current = new Date();
  const { perfil } = useAuth();

  const [filter, setFilter] = useState<Record<string, any>>({});

  const { hasPermition } = permissionAuth();

  const [loading, setLoading] = useState<boolean>(false);
  const { renderToast } = useToast();

  const [dropDownList, setDropDownList] = useState<any>([]);
  const { renderDropdownCalendar } = useDropdown();

  const [event, setEvent] = useState<any>();
  const [open, setOpen] = useState<boolean>(false);
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [openView, setOpenView] = useState<boolean>(false);
  const [openConfirm, setOpenConfirm] = useState<boolean>(false);

  const [evenetsList, setEventsList] = useState<any>([]);
  const [currentDate, setCurrentDate] = useState<any>({
    start: getPrimeiroDoMes(current.getFullYear(), current.getMonth() + 1),
    end: getUltimoDoMes(current.getFullYear(), current.getMonth() + 1),
  });

  // Estável entre renders (só muda se renderToast mudar, o que nunca
  // acontece de fato — ver toast.tsx). Antes era recriada a cada render de
  // ScheduleCalendar, o que por si só não afeta o calendário (não é passada
  // como prop pra ele), mas é pré-requisito pra renderEvents abaixo também
  // poder ser estável.
  const fetchEventsWithFilter = useCallback(
    async (dateRange: any, activeFilter: Record<string, any> = {}) => {
      setLoading(true);

      try {
        const filterUrl = buildEventFilterUrl(
          dateRange.start,
          dateRange.end,
          activeFilter
        );
        const separator = filterUrl.includes('?') ? '&' : '?';
        const response: any = await getList(
          `${filterUrl}${separator}_ts=${Date.now()}`
        );
        setEventsList(normalizeCalendarEvents(resolveResponseData(response)));
      } catch (error) {
        renderToast(buildErrorToast(error, 'Não foi possível carregar os eventos da agenda!'));
      } finally {
        setLoading(false);
      }
    },
    [renderToast]
  );

  // useCallback (não function declaration como antes): precisa de
  // identidade estável entre renders que não mudam currentDate/filter/
  // perfil, porque é passada direto como onNext/onPrev pro CalendarComponent
  // memoizado — senão o memo nunca "pega" e o calendário volta a
  // reprocessar plugins/eventos a cada render da tela.
  const renderEvents = useCallback(
    async (moment: any = currentDate, overrideFilter?: Record<string, any>) => {
      const nextDate = {
        start: moment.start,
        end: moment.end,
      };
      const baseFilter = overrideFilter ?? filter;

      setCurrentDate(nextDate);

      if (isProfile(perfil, PERFIL.terapeuta)) {
        const auth: any = await sessionStorage.getItem('auth');
        const user = JSON.parse(auth);
        const nextFilter = {
          ...baseFilter,
          terapeutaId: {
            id: user.id,
          },
        };

        setFilter(nextFilter);
        await fetchEventsWithFilter(nextDate, nextFilter);
        return;
      }

      await fetchEventsWithFilter(nextDate, baseFilter);
    },
    [currentDate, filter, perfil, fetchEventsWithFilter]
  );

  async function deleteEvent() {
    try {
      await deleteItem(`/evento?id=${event.id}`);
      renderEvents();
      setOpenView(false);
      renderToast({
        type: 'success',
        title: '',
        message: 'Evento excluído com sucesso!',
        open: true,
      });
    } catch (error) {
      console.error(error);
      renderToast(buildErrorToast(error, 'Evento não excluído!'));
    }
  }

  async function handleSubmitCheckEvent() {
    try {
      await update('/evento/check', event);

      setOpenView(false);
      renderToast({
        type: 'success',
        title: '',
        message: 'Evento atualizado!',
        open: true,
      });
      renderEvents();
    } catch (error) {
      console.error(error);
      renderToast(buildErrorToast(error, 'Evento não atualizado!'));
    }
  }
  async function handleSubmitAtestadoEvent() {
    try {
      await update('/evento/atestado', event);

      setOpenView(false);
      renderToast({
        type: 'success',
        title: '',
        message: 'Evento atualizado!',
        open: true,
      });
      renderEvents();
    } catch (error) {
      console.error(error);
      renderToast(buildErrorToast(error, 'Evento não atualizado!'));
    }
  }

  async function handleSubmitFilter(formvalue: any) {
    try {
      const nextDate = {
        start: formvalue.start || currentDate.start,
        end: formvalue.end || currentDate.end,
      };
      const nextFilter = { ...formvalue };

      setCurrentDate(nextDate);
      setFilter(nextFilter);
      await fetchEventsWithFilter(nextDate, nextFilter);
    } catch (error) {
      renderToast(buildErrorToast(error, 'Não foi possível aplicar o filtro!'));
    }
  }

  const handleResetFilter = async () => {
    const clearedFilter = {};
    setFilter(clearedFilter);
    await renderEvents(
      {
        start: currentDate.start,
        end: currentDate.end,
      },
      clearedFilter
    );
  };

  // useCallback: passada como openModalEdit pro CalendarComponent
  // memoizado (só usa setters estáveis, então identidade fixa pra sempre).
  const renderModalView = useCallback(({ event }: any) => {
    const evento = {
      id: Number(event.id),
      ...event._def.extendedProps,
      ...event._def.extendedProps.data,
      dataAtual: formatdateeua(event._instance.range.start),
      // dataInicio: formatdateeua(event._instance.range.start),
      date: getDateFormat(event._instance.range.start),
      groupId: event._def.groupId,
    };
    setEvent(evento);
    setOpenView(true);
  }, []);

  const renderModalEdit = () => {
    setOpenView(false);
    setOpen(true);
    setIsEdit(true);
  };

  // useCallback: passada como dateClick pro CalendarComponent memoizado
  // (idem renderModalView, só setters estáveis).
  const handleCalendarDateClick = useCallback((moment: any) => {
    setEvent({ dataInicio: moment });
    setOpen(true);
    setIsEdit(false);
  }, []);

  useEffect(() => {
    const loadFilters = async () => {
      const list = await renderDropdownCalendar(STATUS_PACIENT_COD.therapy);
      setDropDownList(list);
    };

    loadFilters();
  }, []);

  useEffect(() => {
    renderEvents();
  }, []);

  return (
    <div className="h-max-screen" data-testid="agenda-page">
      {hasPermition('AGENDA_CALENDARIO_FILTRO_BOTAO_PESQUISAR') ? (
        <Filter
          id="form-filter-patient"
          legend="Filtro"
          nameButton="Agendar"
          fields={fieldsConst}
          onSubmit={handleSubmitFilter}
          onReset={handleResetFilter}
          screen="AGENDA_CALENDARIO"
          loading={loading}
          dropdown={dropDownList}
          includeButtonTestId="novo-agendamento-button"
          onInclude={() => {
            setEvent(null);
            setOpen(true);
            setIsEdit(false);
          }}
        />
      ) : null}

      <Card>
        <div className="flex-1 relative">
          <CalendarComponent
            openModalEdit={renderModalView}
            events={evenetsList}
            onNext={renderEvents}
            onPrev={renderEvents}
            dateClick={handleCalendarDateClick}
          />
          {/* A busca de eventos ao trocar de data pode levar alguns
              segundos (depende da resposta do backend, não do render do
              calendário). Sem esse indicador, a tela fica parada e a espera
              parece um travamento em vez de um carregamento. */}
          {loading && (
            <div
              className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 pointer-events-none"
              data-testid="calendar-loading-overlay"
            >
              <LoadingHeron />
            </div>
          )}
        </div>
      </Card>

      {openView && (
        <ViewEvento
          evento={event}
          open={openView}
          onEdit={renderModalEdit}
          onDelete={() => setOpenConfirm(true)}
          onClose={() => setOpenView(false)}
          onClick={handleSubmitCheckEvent}
          onClickSecond={handleSubmitAtestadoEvent}
        />
      )}

      {open && hasPermition('AGENDA_CALENDARIO_FILTRO_BOTAO_CADASTRAR') ? (
        <Modal
          title="Agendamento"
          open={open}
          onClose={() => setOpen(false)}
          width="80vw"
        >
          <CalendarForm
            value={event}
            isEdit={isEdit}
            screen="calendar"
            statusPacienteCod={STATUS_PACIENT_COD.therapy}
            onClose={() => {
              setEvent(null);
              renderEvents();
              setOpen(false);
            }}
          />
        </Modal>
      ) : null}

      <Confirm
        onAccept={deleteEvent}
        onReject={() => setOpenConfirm(false)}
        onClose={() => setOpenConfirm(false)}
        title="Evento(s)"
        message="O evento excluído perderá todo histórico. Deseja realmente exclui-lo?"
        icon="pi pi-exclamation-triangle"
        open={openConfirm}
        acceptLabel="Excluir"
        rejectLabel="Cancelar"
      />
    </div>
  );
}
