import { useCallback, useEffect, useState } from 'react';
import { filter, getList, update } from '../server';

import { useToast } from '../contexts/toast';
import { permissionAuth } from '../contexts/permission';
import { Card, Confirm, Filter, Modal, List } from '../components/index';
import { ScheduleForm } from '../foms/ScheduleForm';
import { CalendarForm } from '../foms/CalendarForm';
import { formtDatePatient } from '../util/util';
import { useDropdown } from '../contexts/dropDown';
import {
  filterCurdPatientFields,
  patientCrudFields,
  STATUS_PACIENT_COD,
} from '../constants/patient';
import { PacientsProps, PatientForm } from '../foms/PatientForm';
import PaginationComponent from '../components/Pagination';

const fieldsConst = filterCurdPatientFields;
const fieldsState: any = {};
fieldsConst.forEach((field: any) => (fieldsState[field.id] = ''));

export default function Patient() {
  const SCREEN = 'CADASTRO_PACIENTES';
  const { hasPermition } = permissionAuth();

  const [fields, setFields] = useState(fieldsConst);

  const [patients, setPatients] = useState<PacientsProps[]>([]);
  const [patient, setPatient] = useState<any>();
  const [patientFormatCalendar, setPatientFormatCalendar] = useState<any>();
  const [filterCurrent, setFilter] = useState<any>({});
  const [pagination, setPagination] = useState<any>({
    pageSize: 10,
    totalPages: 0,
    currentPage: 1
  });
  const [open, setOpen] = useState<boolean>(false);
  const [openCalendarForm, setOpenCalendarForm] = useState<boolean>(false);
  const [openSchedule, setOpenSchedule] = useState<boolean>(false);
  const [openConfirm, setOpenConfirm] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const [dropDownList, setDropDownList] = useState<any>([]);
  const { renderDropdownQueue, renderPacientes } = useDropdown();

  const { renderToast } = useToast();

  const renderPatient = useCallback(async () => {
    try {
      setLoading(true);
      setPatients([]);
      const response = await getList(
        `paciente?statusPacienteCod=${STATUS_PACIENT_COD.crud_therapy}&page=${pagination.currentPage}&pageSize=${pagination.pageSize}`
      );
      setPatients(response.data);
      setPagination(response.pagination)

      setLoading(false);
    } catch (error) {
      setLoading(false);
      renderToast({
        type: 'failure',
        title: 'Erro!',
        message: 'Falha na conexão',
        open: true,
      });
    }
  }, []);

  const handleDisabled = async () => {
    setOpenConfirm(false);
    try {
      const response = await update('paciente/desabilitar', {
        id: patient.id,
        disabled: !patient.disabled,
      });
      handleSubmitFilter({ disabled: patient.disabled });
      renderToast({
        type: 'success',
        title: response.data.message,
        message: response.data.data,
        open: true,
      });
    } catch (error) {
      renderToast({
        type: 'failure',
        title: 'Erro!',
        message: 'Não foi possível excluí-lo',
        open: true,
      });
    }
  };

  const handlePagination = async (pag: any) => {
    const currentPage = {
      ...pagination,
      currentPage: pag
    }

    setPagination(currentPage)
    handleSubmitFilter(filterCurrent, currentPage)
  }

  const handleSubmitFilter = async (formState: any = filterCurrent, pag = pagination) => {
    setLoading(true);
    setFilter(formState)
    try {
      const format: any = {
        // naFila: formState.naFila === undefined ? true : !formState.naFila,
        disabled: formState.disabled === undefined ? false : formState.disabled,
        statusPacienteCod: STATUS_PACIENT_COD.crud_therapy,
      };
      // delete formState.naFila;
      delete formState.disabled;

      await Object.keys(formState).map((key: any) => {
        format[key] = formState[key]?.id || undefined;
      });

      const response: any = await filter('paciente', format, `page=${pag.currentPage}&pageSize=${pag.pageSize}`);
      setPatients(response.data.data || response.data);
      setPagination(response.pagination || response.data.pagination)
      setLoading(false);
    } catch (err) {
      setLoading(false);
      renderToast({
        type: 'failure',
        title: '401',
        message: 'Erro na conexão!',
        open: true,
      });
    }
  };

  const sendUpdate = async (url: string, body: any, filter: any) => {
    try {
      await update(url, body);
      setOpenSchedule(false);
      handleSubmitFilter();
    } catch ({ response }: any) {
      renderToast({
        type: 'failure',
        title: '401',
        message: 'Não foi possível agendá-lo!',
        open: true,
      });
    }
  };

  const handleSchedule = async ({ item, typeButtonFooter }: any) => {
    switch (typeButtonFooter) {
      case 'agendar':
        setPatient(item);
        formatCalendar(item);
        setOpenCalendarForm(true);
        break;
      case 'devolutiva':
        const body: any = {
          id: item.vaga.id,
          devolutiva: !item.vaga.devolutiva,
        };
        sendUpdate('vagas/devolutiva', body, {
          naFila: false,
          devolutiva: item.vaga.devolutiva,
        });
        break;

      default:
        if (item.vaga.especialidades.length === 1) {
          const especialidade = item.vaga.especialidades[0];
          const body: any = {
            statusPacienteCod: STATUS_PACIENT_COD.crud_therapy,
            pacienteId: item.id,
            vagaId: item.vaga.id,
            id: item.vaga.id,
            agendar: !especialidade.agendado
              ? [especialidade.especialidadeId]
              : [],
            desagendar: especialidade.agendado
              ? [especialidade.especialidadeId]
              : [],
          };
          sendUpdate('vagas/agendar', body, { naFila: !item.vaga.naFila });
        } else {
          setPatient(item);
          formatCalendar(item);
          setOpenSchedule(true);
          setOpenCalendarForm(true);
        }
        break;
    }
  };

  const formatCalendar = (item: any) => {
    const format = {
      paciente: { nome: item.nome, id: item.id },
    };
    setPatient(item);
    setPatientFormatCalendar(format);
  };

  const handleScheduleResponse = (agendar: number[], desagendar: number[]) => {
    const body: any = {
      pacienteId: patient.id,
      vagaId: patient.vaga.id,
      id: patient.vaga.id,
      agendar: agendar,
      desagendar: desagendar,
      statusPacienteCod: STATUS_PACIENT_COD.crud_therapy,
    };

    setOpenSchedule(false);
    sendUpdate('vagas/agendar', body, { naFila: !patient.vaga.naFila });
  };

  const formtDate = (value: PacientsProps) => {
    const data = formtDatePatient(value);

    setPatient(data);
    setOpen(true);
  };

  const renderDropdown = useCallback(async () => {
    const list = await renderDropdownQueue(STATUS_PACIENT_COD.crud_therapy);
    setDropDownList(list);
  }, []);

  useEffect(() => {
    !hasPermition('CADASTRO_PACIENTES_FILTRO_SELECT_AGENDADOS')
      ? handleSubmitFilter({ naFila: true, disabled: false })
      : renderPatient();
    renderDropdown();
  }, [renderPatient]);

  return (
    <div className="grid">
      <Filter
        id="form-filter-patient"
        legend="Filtro"
        fields={fields}
        screen={SCREEN}
        onSubmit={handleSubmitFilter}
        onReset={renderPatient}
        loading={loading}
        dropdown={dropDownList}
        onInclude={() => {
          setPatient(null);
          setOpen(true);
        }}
      />

      <Card>
        <List
          loading={loading}
          type="complete"
          items={patients}
          screen={SCREEN}
          onClick={handleSchedule}
          onClickLink={(pacient_: any) => {
            setPatient(pacient_);
            setOpenSchedule(true);
          }}
          onClickTrash={(pacient_: any) => {
            setPatient(pacient_);
            setOpenConfirm(true);
          }}
          onClickEdit={formtDate}
          onClickReturn={({ item }: any) => {
            setPatient(item);
            setOpenConfirm(true);
          }}
        />
        {pagination.totalPages > 1 && <PaginationComponent totalPages={pagination.totalPages}  currentPage={pagination.currentPage} onChange={handlePagination}/>}
      </Card>

      <Modal
        title="Cadastro de Paciente"
        open={open}
        onClose={() => setOpen(false)}
      >
        <PatientForm
          onClose={async () => {
            const pacientes = await renderPacientes(
              STATUS_PACIENT_COD.crud_therapy
            );
            setDropDownList({ ...dropDownList, pacientes });
            renderPatient();
            setOpen(false);
          }}
          dropdown={dropDownList}
          value={patient}
          statusPacienteCod={STATUS_PACIENT_COD.crud_therapy}
          fieldsCostant={patientCrudFields}
        />
      </Modal>

      {openCalendarForm && (
        <Modal
          title="Agendamento"
          open={openCalendarForm}
          onClose={() => setOpenCalendarForm(false)}
          width="80vw"
        >
          <CalendarForm
            value={patientFormatCalendar}
            isEdit={false}
            statusPacienteCod={STATUS_PACIENT_COD.crud_therapy}
            onClose={async (formValueState: any) => {
              sendUpdate(
                'vagas/agendar/especialidade',
                {
                  vagaId: patient.vaga.id,
                  especialidadeId: formValueState.especialidade.id,
                  statusPacienteCod: STATUS_PACIENT_COD.crud_therapy,
                  pacienteId: formValueState.paciente.id,
                },
                { naFila: !patient.vaga.naFila }
              );

              renderPatient();
              setOpenCalendarForm(false);
            }}
          />
        </Modal>
      )}

      <Modal
        title="Selecione a(s) especialidade(s) agendada(s)"
        open={openSchedule}
        onClose={() => setOpenSchedule(false)}
      >
        <ScheduleForm
          onSubmit={handleScheduleResponse}
          especialidades={patient?.vaga?.especialidades}
        />
      </Modal>

      <Confirm
        title=""
        onAccept={handleDisabled}
        onReject={() => setOpenConfirm(false)}
        onClose={() => setOpenConfirm(false)}
        message={`Deseja realmente ${
          patient?.disabled ? 'ativar' : 'inativar'
        } o paciente ${patient?.nome}?`}
        icon="pi pi-exclamation-triangle"
        open={openConfirm}
      />
    </div>
  );
}
