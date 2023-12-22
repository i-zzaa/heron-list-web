import { useCallback, useEffect, useMemo, useState } from 'react';
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

const fieldsConst = filterCalendarFields;
const fieldsState: any = {};
fieldsConst.forEach((field: any) => (fieldsState[field.id] = ''));

export default function ScheduleCalendar() {
  const current = new Date();
  const { perfil } = useAuth();

  const [filter, setFilter] = useState<string[]>([]);

  const { hasPermition } = permissionAuth();

  const [loading, setLoading] = useState<boolean>(false);
  const { renderToast } = useToast();

  const [dropDownList, setDropDownList] = useState<any>([]);
  const { renderDropdownCalendar, renderPacientes } = useDropdown();

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

  // const renderEvents = useCallback(async (moment: any = currentDate) => {
  async function renderEvents(moment: any = currentDate) {
    // if (!hasPermition('AGENDA_EVENTO_TODOS_EVENTOS') && perfil === PERFIL.terapeuta) {
    if (perfil.toLocaleLowerCase() === PERFIL.terapeuta.toLocaleLowerCase()) {
      await setCurrentDate({
        start: moment.start,
        end: moment.end,
      });

  
      const auth: any = await sessionStorage.getItem('auth');
      const user = JSON.parse(auth);


      handleSubmitFilter({
        terapeutaId: {
          id: user.id,
        },
        ...moment
      });
    } else {
      // const response: any = await getList(
      //   `/evento/${moment.start}/${moment.end}`
      // );

      setCurrentDate({
        start: moment.start,
        end: moment.end,
      });

      const response: any = await getList(
        `/evento/filtro/${moment.start}/${moment.end}?${filter.join('&')}`
      );

      setEventsList(response);
    }
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

      setTimeout(() => {
        renderEvents()
      }, 1000);

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

      setTimeout(() => {
        renderEvents()
      }, 1000);

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

  // const handleSubmitFilter = useCallback(async (formvalue: any) => {
  async function handleSubmitFilter(formvalue: any) {
    try {
      const _filter: string[] = [];
      Object.keys(formvalue).map((key: string) => {
        if (formvalue[key]?.id) {
          _filter.push(`${key}=${formvalue[key].id}`);
        }
      });

      setFilter(_filter);
      const response: any = await getList(
        `/evento/filtro/${formvalue.start || currentDate.start}/${formvalue.end || currentDate.end}?${_filter.join(
          '&'
        )}`
      );

      setEventsList(response);
    } catch (error) {
      setLoading(false);
    }
  }

  const rendeFiltro = useMemo(async () => {
    const list = await renderDropdownCalendar(STATUS_PACIENT_COD.therapy);
    setDropDownList(list);
  }, []);

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

  // const renderCalendar = () => {
  //   if (!loading) {
  //     return evenetsList.length ? (
  //       <div className="flex-1">
  //         <CalendarComponent
  //           openModalEdit={renderModalView}
  //           events={evenetsList}
  //           onNext={(moment: any) => renderEvents(moment)}
  //           onPrev={(moment: any) => renderEvents(moment)}
  //         />
  //       </div>
  //     ) : (
  //       <NotFound />
  //     );
  //   } else {
  //     return <LoadingHeron />;
  //   }
  // };

  useEffect(() => {
    rendeFiltro;
  }, []);

  useEffect(() => {
    setLoading(true);
    renderEvents();
    setTimeout(() => {
      setLoading(false);
    }, 500);
  }, []);

  return (
    <div className="h-max-screen">
      {
        hasPermition('AGENDA_CALENDARIO_FILTRO_BOTAO_PESQUISAR') ? (
          <Filter
        id="form-filter-patient"
        legend="Filtro"
        nameButton="Agendar"
        fields={fieldsConst}
        onSubmit={handleSubmitFilter}
        onReset={renderEvents}
        screen="AGENDA_CALENDARIO"
        loading={loading}
        dropdown={dropDownList}
        onInclude={() => {
          setEvent(null);
          setOpen(true);
          setIsEdit(false);
        }}
      />
        ): <></>
      }

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
