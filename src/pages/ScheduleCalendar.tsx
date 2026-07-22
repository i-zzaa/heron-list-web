import { useEffect, useState } from 'react';
import { deleteItem, getList, update } from '../server';
import { Card, Confirm, Filter, Modal } from '../components';
import { CalendarComponent } from '../components/calendar';
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

const fieldsConst = filterCalendarFields;

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

  const normalizeCalendarEvents = (events: any[] = []) => {
    const eventList = Array.isArray(events)
      ? events
      : events && typeof events === 'object'
      ? Object.values(events)
      : [];

    return eventList.map((eventItem: any, index: number) => {
      const date = eventItem.date || eventItem.dataInicio;
      const startTime = eventItem.startTime || eventItem.start;
      const endTime = eventItem.endTime || eventItem.end;
      const isRecurringEvent =
        eventItem?.frequencia?.id === 2 ||
        String(eventItem?.frequencia?.nome || '').toLowerCase() ===
          'recorrente';

      const normalizedId =
        eventItem.id && eventItem.id !== 0
          ? String(eventItem.id)
          : `${eventItem.groupId || 'evento'}-${date || 'sem-data'}-${
              startTime || 'sem-inicio'
            }-${endTime || 'sem-fim'}-${index}`;

      const normalizedEvent = {
        ...eventItem,
        id: normalizedId,
      };

      if (date && startTime && endTime && !isRecurringEvent) {
        const sanitizedEvent = {
          ...normalizedEvent,
          start: `${date}T${startTime}`,
          end: `${date}T${endTime}`,
        } as Record<string, any>;

        delete sanitizedEvent.rrule;
        delete sanitizedEvent.daysOfWeek;
        delete sanitizedEvent.startTime;
        delete sanitizedEvent.endTime;
        delete sanitizedEvent.startRecur;
        delete sanitizedEvent.endRecur;

        return sanitizedEvent;
      }

      if (isRecurringEvent) {
        return {
          ...normalizedEvent,
          daysOfWeek:
            Array.isArray(eventItem?.diasFrequencia) &&
            eventItem.diasFrequencia.length
              ? eventItem.diasFrequencia.map((day: string | number) =>
                  Number(day)
                )
              : normalizedEvent.daysOfWeek,
        };
      }

      const fallbackEvent = {
        ...normalizedEvent,
        rrule: undefined,
        daysOfWeek: undefined,
        startTime: undefined,
        endTime: undefined,
        startRecur: undefined,
        endRecur: undefined,
      };

      return {
        ...fallbackEvent,
        id: normalizedId,
      };
    });
  };

  const fetchEventsWithFilter = async (
    dateRange: any,
    activeFilter: Record<string, any> = {}
  ) => {
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
      renderToast({
        type: 'failure',
        title: '401',
        message: 'Não foi possível carregar os eventos da agenda!',
        open: true,
      });
    } finally {
      setLoading(false);
    }
  };

  async function renderEvents(
    moment: any = currentDate,
    overrideFilter?: Record<string, any>
  ) {
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
  }

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
      renderToast({
        type: 'failure',
        title: '401',
        message: 'Evento não excluído!',
        open: true,
      });
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
      renderToast({
        type: 'failure',
        title: '401',
        message: 'Evento não atualizado!',
        open: true,
      });
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
      renderToast({
        type: 'failure',
        title: '401',
        message: 'Evento não atualizado!',
        open: true,
      });
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
      renderToast({
        type: 'failure',
        title: '401',
        message: 'Não foi possível aplicar o filtro!',
        open: true,
      });
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

  const renderModalView = ({ event }: any) => {
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
  };

  const renderModalEdit = () => {
    setOpenView(false);
    setOpen(true);
    setIsEdit(true);
  };

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
    <div className="h-max-screen">
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
          onInclude={() => {
            setEvent(null);
            setOpen(true);
            setIsEdit(false);
          }}
        />
      ) : null}

      <Card>
        <div className="flex-1">
          <CalendarComponent
            openModalEdit={renderModalView}
            events={evenetsList}
            onNext={(moment: any) => renderEvents(moment)}
            onPrev={(moment: any) => renderEvents(moment)}
            dateClick={(moment: any) => {
              setEvent({ dataInicio: moment });
              setOpen(true);
              setIsEdit(false);
            }}
          />
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
