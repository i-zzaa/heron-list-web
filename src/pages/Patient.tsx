import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { filter, update } from '../server';

import { useToast } from '../contexts/toast';
import { permissionAuth } from '../contexts/permission';
import { Confirm, Filter, Modal } from '../components/index';
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
import { buildPaginationState, resolveResponseData, resolveResponsePagination } from '../util/pagination';
import { mapFormValuesToPayload } from '../util/forms';
import { buildErrorToast } from '../util/error';
import { ButtonHeron } from '../components/button';
import { ImportarPacientes } from '../components/importacao/ImportarPacientes';
import {
  AcaoLinha,
  CabecalhoCadastro,
  LinhaCadastro,
  ListaCadastro,
  SecaoCadastro,
} from './cadastro/ListaCadastro';

const fieldsConst = filterCurdPatientFields;
const fieldsState: any = {};
fieldsConst.forEach((field: any) => (fieldsState[field.id] = ''));

const SECAO_PADRAO: SecaoCadastro = {
  titulo: 'Pacientes',
  descricao: 'Pacientes em terapia, com convênio, unidade e especialidades.',
  icone: 'pi pi-users',
};

export default function Patient({ secao = SECAO_PADRAO }: { secao?: SecaoCadastro }) {
  const SCREEN = 'CADASTRO_PACIENTES';
  const { hasPermition } = permissionAuth();

  const [fields] = useState(fieldsConst);

  const [patients, setPatients] = useState<PacientsProps[]>([]);
  const [patient, setPatient] = useState<any>();
  const [patientFormatCalendar, setPatientFormatCalendar] = useState<any>();
  const [filterCurrent, setFilter] = useState<any>({});
  const [pagination, setPagination] = useState<any>(buildPaginationState());
  const [open, setOpen] = useState<boolean>(false);
  const [openCalendarForm, setOpenCalendarForm] = useState<boolean>(false);
  const [openSchedule, setOpenSchedule] = useState<boolean>(false);
  const [openConfirm, setOpenConfirm] = useState<boolean>(false);
  const [openImportar, setOpenImportar] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const [dropDownList, setDropDownList] = useState<any>([]);
  const { renderDropdownQueue, renderPacientes } = useDropdown();

  const { renderToast } = useToast();

  // Chegando aqui a partir do sino de notificações (?pacienteId=X), filtra
  // a lista só por esse paciente e abre o cadastro dele sozinho — sem isso
  // o usuário cairia na tela e teria que procurar o paciente à mão.
  const [searchParams, setSearchParams] = useSearchParams();
  const pacienteIdParam = searchParams.get('pacienteId');

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
      renderToast(buildErrorToast(error, 'Não foi possível excluí-lo'));
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
      const format: any = mapFormValuesToPayload(
        {
          ...formState,
          disabled: formState.disabled === undefined ? false : formState.disabled,
          statusPacienteCod: STATUS_PACIENT_COD.crud_therapy,
        },
        { exclude: ['disabled'] }
      );

      const response: any = await filter('paciente', format, `page=${pag.currentPage}&pageSize=${pag.pageSize}`);
      setPatients(resolveResponseData(response));
      setPagination(resolveResponsePagination(response, pag))
    } catch (error) {
      renderToast(buildErrorToast(error, 'Erro na conexão!'));
    } finally {
      setLoading(false);
    }
  };

  const sendUpdate = async (url: string, body: any) => {
    try {
      await update(url, body);
      setOpenSchedule(false);
      handleSubmitFilter();
    } catch (error) {
      renderToast(buildErrorToast(error, 'Não foi possível agendá-lo!'));
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
        if (!item?.vaga?.id) {
          return;
        }

        const body: any = {
          id: item.vaga.id,
          devolutiva: !item.vaga.devolutiva,
        };
        sendUpdate('vagas/devolutiva', body);
        break;

      default:
        if (!item?.vaga?.id) {
          setPatient(item);
          setOpen(true);
          return;
        }

        if ((item?.vaga?.especialidades || []).length === 1) {
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
          sendUpdate('vagas/agendar', body);
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
    if (!patient?.vaga?.id) {
      setOpenSchedule(false);
      return;
    }

    const body: any = {
      pacienteId: patient.id,
      vagaId: patient.vaga.id,
      id: patient.vaga.id,
      agendar: agendar,
      desagendar: desagendar,
      statusPacienteCod: STATUS_PACIENT_COD.crud_therapy,
    };

    setOpenSchedule(false);
    sendUpdate('vagas/agendar', body);
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
    if (pacienteIdParam) {
      // `pacientes` é o mesmo filtro por paciente já usado na tela (campo
      // select do Filtro) — mapFormValuesToPayload extrai o `.id` daqui.
      handleSubmitFilter({ pacientes: { id: Number(pacienteIdParam) } });
    } else if (!hasPermition('CADASTRO_PACIENTES_FILTRO_SELECT_AGENDADOS')) {
      handleSubmitFilter({ naFila: true, disabled: false });
    } else {
      handleSubmitFilter();
    }
    renderDropdown();
    // Precisa reagir a `pacienteIdParam`, não só rodar uma vez: clicar de
    // novo no sino estando já na rota /cadastro só troca a query string —
    // a página não desmonta, então sem essa dependência esse efeito nunca
    // rodaria de novo e o modal não abriria.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pacienteIdParam]);

  // Assim que a lista filtrada por `pacienteId` chegar, abre o cadastro
  // desse paciente sozinho e limpa o parâmetro da URL (pra não reabrir
  // sozinho de novo se o usuário fechar o modal e a lista atualizar).
  useEffect(() => {
    if (!pacienteIdParam) return;

    const target = patients.find(
      (item: any) => String(item.id) === pacienteIdParam
    );

    if (target) {
      formtDate(target);
      searchParams.delete('pacienteId');
      setSearchParams(searchParams, { replace: true });
    }
  }, [patients]);

  const renderLinha = (item: any) => {
    const inativo = !!item?.disabled;
    const pode = (acao: string) => Boolean(hasPermition(`${SCREEN}_LISTA_BOTAO_${acao}`));
    const podeAgendar = Boolean(hasPermition(`${SCREEN}_LISTA_TAG_ESPECIALIDADES`));

    const acoes: AcaoLinha[] = [];
    if (!inativo && pode('EDITAR')) {
      acoes.push({ icone: 'pi pi-pencil', rotulo: 'Editar', onClick: () => formtDate(item) });
    }
    if (!inativo && pode('EXCLUIR')) {
      acoes.push({
        icone: 'pi pi-trash',
        rotulo: 'Inativar',
        perigo: true,
        onClick: () => {
          setPatient(item);
          setOpenConfirm(true);
        },
      });
    }
    if (inativo && pode('RETORNAR')) {
      acoes.push({
        icone: 'pi pi-replay',
        rotulo: 'Reativar',
        comTexto: true,
        onClick: () => {
          setPatient(item);
          setOpenConfirm(true);
        },
      });
    }

    return (
      <LinhaCadastro
        key={item.id}
        titulo={item.nome}
        inativo={inativo}
        selos={item.idade ? [{ texto: item.idade }] : []}
        detalhes={[
          { icone: 'pi pi-user', texto: item.responsavel },
          { icone: 'pi pi-phone', texto: item.telefone },
          { icone: 'pi pi-id-card', texto: item.convenio?.nome },
          { icone: 'pi pi-building', texto: item.unidade?.nome },
          {
            icone: 'pi pi-credit-card',
            texto: item.carteirinha ? `Carteirinha ${item.carteirinha}` : '',
          },
          { icone: 'pi pi-comment', texto: item.vaga?.observacao },
        ]}
        etiquetas={(item?.vaga?.especialidades || []).map((esp: any) => ({
          texto: esp?.especialidade?.nome || 'Sem especialidade',
          cor: esp?.especialidade?.cor,
          pendente: !esp?.agendado,
          onClick:
            podeAgendar && !inativo
              ? () => {
                  setPatient(item);
                  setOpenSchedule(true);
                }
              : undefined,
        }))}
        acoes={acoes}
      />
    );
  };

  return (
    <div className="cad-painel">
      <CabecalhoCadastro
        secao={secao}
        acoes={
          hasPermition(`${SCREEN}_FILTRO_BOTAO_CADASTRAR`) ? (
            <>
              <ButtonHeron
                text="Importar"
                icon="pi pi-file-excel"
                type="outline"
                size="full"
                htmlType="button"
                testId="patient-import"
                onClick={() => setOpenImportar(true)}
              />
              <ButtonHeron
                text="Novo paciente"
                icon="pi pi-user-plus"
                type="primary"
                size="full"
                htmlType="button"
                testId="patient-add"
                onClick={() => {
                  setPatient(null);
                  setOpen(true);
                }}
              />
            </>
          ) : undefined
        }
      />

      <Filter
        id="form-filter-patient"
        legend="Filtrar pacientes"
        fields={fields}
        screen={SCREEN}
        onSubmit={handleSubmitFilter}
        onReset={handleSubmitFilter}
        loading={loading}
        dropdown={dropDownList}
      />

      {openImportar ? (
        <Modal
          title="Importar pacientes da planilha"
          open={openImportar}
          onClose={() => setOpenImportar(false)}
          width="min(960px, 95vw)"
        >
          <ImportarPacientes
            onClose={(importou) => {
              setOpenImportar(false);
              if (importou) handleSubmitFilter();
            }}
          />
        </Modal>
      ) : null}

      <ListaCadastro
        loading={loading}
        total={pagination.totalItems}
        rotuloTotal={['paciente', 'pacientes']}
        vazio="Nenhum paciente encontrado com esse filtro."
        rodape={
          pagination.totalPages > 1 ? (
            <PaginationComponent
              totalPages={pagination.totalPages}
              currentPage={pagination.currentPage}
              onChange={handlePagination}
            />
          ) : undefined
        }
      >
        {patients.map((item: any) => renderLinha(item))}
      </ListaCadastro>

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
            handleSubmitFilter();
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
              sendUpdate('vagas/agendar/especialidade', {
                vagaId: patient.vaga.id,
                especialidadeId: formValueState.especialidade.id,
                statusPacienteCod: STATUS_PACIENT_COD.crud_therapy,
                pacienteId: formValueState.paciente.id,
              });

              handleSubmitFilter();
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
