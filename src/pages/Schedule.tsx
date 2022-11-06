import { useCallback, useEffect, useMemo, useState } from "react";
import {  getList } from "../server";
import {  Card, Filter, Modal } from "../components";
import { CalendarComponent } from "../components/calendar";
import { ViewEvento } from "../components/view-evento";
import { CalendarForm } from "../foms/CalendarForm";
import { useDropdown } from "../contexts/dropDown";
import { filterCalendarFields } from "../constants/formFields";
import {  formatdateeua, getDateFormat } from "../util/util";
import { statusPacienteId } from "../constants/patient";
import { COORDENADOR, COORDENADOR_TERAPEUTA, permissionAuth, TERAPEUTA } from "../contexts/permission";
import { NotFound } from "../components/notFound";

const fieldsConst = filterCalendarFields;

//userFields
const fieldsState: any = {};
fieldsConst.forEach((field: any) => (fieldsState[field.id] = ""));

interface UserProps {
  id: string;
  nome: string;
  login: string;
  ativo: boolean;
  perfil: {
    id: string;
    nome: string;
  };
}

export default function Schedule() {
  const { perfil } = permissionAuth();

  const [loading, setLoading] = useState<boolean>(false);

  const [dropDownList, setDropDownList] = useState<any>([]);
  const {  renderDropdownCalendar, renderPacientes } = useDropdown()

  const [event, setEvent] = useState<any>();
  const [open, setOpen] = useState<boolean>(false);
  const [openView, setOpenView] = useState<boolean>(false);

  const [evenetsList, setEventsList] = useState<any>([]);

  const renderEvents = useCallback(async () => {
    if (perfil === COORDENADOR || perfil === TERAPEUTA || perfil === COORDENADOR_TERAPEUTA) {
      const auth: any = await sessionStorage.getItem('auth')
      const user = JSON.parse(auth)
      handleSubmitFilter({
        terapeutaId: {
          id: user.id
        }
      })

    }else {
      const current = new Date();
      const response: any = await getList(`/evento/mes/${current.getMonth() + 1}/${current.getFullYear()}`);
      setEventsList(response);
    }

  }, []);

  const handleSubmitFilter = useCallback(async (formvalue: any) => {
    try {
      setLoading(true)

      const filter: string[] = []
      Object.keys(formvalue).map((key: string) => {
        if (formvalue[key]?.id) {
          filter.push(`${key}=${formvalue[key].id}`)
        }
      })
      
      const current = new Date();
      const response: any = await getList(`/evento/filter/${current.getMonth() + 1}/${current.getFullYear()}?${filter.join('&')}`);
  
      setEventsList(response);
      setLoading(false)
    } catch (error) {
      setLoading(false)
    }
  }, []);

  const rendeFiltro = useMemo(async() => {
    const list = await renderDropdownCalendar(statusPacienteId.therapy)
    setDropDownList(list)
  }, [])

  const renderModalView = ({ event }: any) => {
    const evento = {
      id: Number(event.id),
      ...event._def.extendedProps,
      ...event._def.extendedProps.data,
      dataAtual: formatdateeua(event._instance.range.start),
      date: getDateFormat(event._instance.range.start)
    }
    setEvent(evento);
    setOpenView(true);
  };

  const renderModalEdit = () => {
    setOpenView(false);
    setOpen(true);
  };
  
  useEffect(() => {
    rendeFiltro
  }, []);

  useEffect(() => {
    renderEvents()
  }, []);

  return (
    <div className="h-max-screen">
      <Filter
        id="form-filter-patient"
        legend="Filtro"
        nameButton="Agendar"
        fields={fieldsConst}
        onSubmit={handleSubmitFilter}
        onReset={renderEvents}
        rule={perfil === COORDENADOR || perfil === COORDENADOR_TERAPEUTA || perfil === TERAPEUTA}
        loading={loading}
        dropdown={dropDownList}
        onInclude={()=> {
          setEvent(null);
          setOpen(true)
        }}
      />
      <Card >
        {evenetsList.length ? (
          <div className="flex-1">
            <CalendarComponent
              openModalEdit={renderModalView}
              events={evenetsList}
            />
          </div>
        ): <NotFound />}
      </Card>

      {openView && (<ViewEvento 
        evento={event}
        open={openView}
        onEdit={renderModalEdit}
        onClose={()=> setOpenView(false)}
      />)}

      {open && (
        <Modal title="Agendamento" open={open} onClose={() => setOpen(false)} width="80vw">
          <CalendarForm
            value={event}
            isEdit={!!event}
            screen="calendar"
            statusPacienteId={statusPacienteId.therapy}
            onClose={() => {
              setEvent(null)
              renderEvents();
              setOpen(false);
            }}
          />
        </Modal>
      )}
    </div>
  );
}