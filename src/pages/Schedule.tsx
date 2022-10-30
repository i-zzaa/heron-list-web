// import { CalendarComponent } from "../../components/CalendarComponent";
import { useCallback, useEffect, useMemo, useState } from "react";
import { dropDown, getList } from "../server";
import { useForm } from "react-hook-form";
import moment from "moment";
import { ButtonHeron, Card, Filter, Input, Modal } from "../components";
import { CalendarComponent } from "../components/calendar";
import { CalendarForm } from "../foms/CalendarForm";
import { useDropdown } from "../contexts/dropDown";
import { filterCalendarFields } from "../constants/formFields";


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
  const [terapeutas, setTerapeutasList] = useState<any[]>([]);
  const [pacientes, setPacientesList] = useState<any[]>([]);
  const [statusEventos, setStatusEventosList] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const { renderPacientes, renderStatusEventos, renderTerapeutas } = useDropdown()

  const [event, setEvent] = useState<any[]>();
  const [open, setOpen] = useState<boolean>(false);

  const [evenetsList, setEventsList] = useState<any>([]);
  const {
    control,
    formState: { errors },
  } = useForm<any>();

  const handleTerapeutas = useCallback(async () => {
    const response: any = await renderTerapeutas()
    setTerapeutasList(response);
  }, []);

  const handlePacientes = useCallback(async () => {
    const response: any = await renderPacientes();
    setPacientesList(response);
  }, []);

  const handleStatusEventos = useCallback(async () => {
    const response: any = await renderStatusEventos();
    setStatusEventosList(response);
  }, []);

  const renderEvents = useCallback(async () => {
    const current = new Date();
    const response: any = await getList(`/evento/mes/${current.getMonth() + 1}/${current.getFullYear()}`);

    setEventsList(response);
  }, []);

  const handleSubmitFilter = useCallback(async () => {
    setLoading(true)
    const current = new Date();
    const response: any = await getList(`/evento/mes/${current.getMonth() + 1}/${current.getFullYear()}`);

    setEventsList(response);
    setLoading(false)
  }, []);

  const renderAgendar = async()=> {
    setOpen(true)
  }

  const rendeFiltro = useMemo(() => {
    handlePacientes()
    handleStatusEventos()
    handleTerapeutas()
  }, [])

  const renderModalEdit = ({ event }: any) => {
    renderAgendar()
    setEvent(event._def.extendedProps);
    setOpen(true);
  };
  
  useEffect(() => {
    rendeFiltro
    renderAgendar()  
  }, []);

  useEffect(() => {
    renderEvents()
  }, [event]);

  return (
    <>


      {/* <div className="grid grid-cols-4 gap-8 justify-between"> */}
      <Filter
        id="form-filter-patient"
        legend="Filtro"
        nameButton="Agendar"
        fields={fieldsConst}
        onSubmit={handleSubmitFilter}
        onReset={renderEvents}
        rule={true}
        loading={loading}
        dropdown={{ pacientes, terapeutas, statusEventos }}
        onInclude={()=> {
          // setPatient(null);
          setOpen(true)
        }}
      />
      <Card >


        {/* <div className="col-span-4 sm:col-span-1">
          <div className="col-span-1 flex items-end justify-end">
            <ButtonHeron
              text="Agendar"
              type="primary"
              size="full"
              icon="pi pi-calendar-plus"
              onClick={renderAgendar}
            /> 
          </div>

          <div className="card text-xs">
            <Input
              labelText="Pacientes"
              id="pacientes"
              type="multiselect"
              errors={errors}
              customCol="my-12"
              control={control}
              options={pacientesList}
            />
          </div>
          <div className="card text-xs">
            <Input
              labelText="Terapeutas"
              id="terapeutas"
              type="multiselect"
              errors={errors}
              customCol="my-12"
              control={control}
              options={terapeutasList}
            />
          </div>
          <div className="card text-xs">
            <Input
              labelText="Status"
              id="statusEventos"
              type="multiselect"
              errors={errors}
              customCol="my-12"
              control={control}
              options={statusEventosList}
            />
          </div>
        </div> */}
        <div className="flex-1">
          <CalendarComponent
            openModalEdit={renderModalEdit}
            events={evenetsList}
          />
        </div>
      </Card>

      {open && (
        <Modal title="Agendamento" open={open} onClose={() => setOpen(false)} width="80vw">
          <CalendarForm
            value={event}
            onClose={() => {
              renderEvents();
              setOpen(false);
            }}
          />
        </Modal>
      )}
    </>
  );
}