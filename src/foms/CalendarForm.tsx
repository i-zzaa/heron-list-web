import moment from 'moment';
moment.locale('pt-br');
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { ButtonHeron, Confirm, Input, Title } from '../components';
import { SelectButtonComponent } from '../components/selectButton';
import { STATUS_PACIENT_COD } from '../constants/patient';
import { useDropdown } from '../contexts/dropDown';
import { permissionAuth } from '../contexts/permission';
import { useToast } from '../contexts/toast';
import { create, dropDown, getList, update } from '../server';

export const CalendarForm = ({
  value,
  onClose,
  isEdit,
  statusPacienteCod,
}: any) => {
  const { hasPermition } = permissionAuth();

  const [loading, setLoading] = useState<boolean>(false);
  const [openConfirm, setOpenConfirm] = useState<boolean>(false);

  const [hasFrequencia, setHasFrequencia] = useState<boolean>(false);
  const [isAvaliacao, setIsAvalicao] = useState<boolean>(false);
  const [isDevolutiva, setIsDevolutiva] = useState<boolean>(false);
  const [isExterno, setIsExterno] = useState<boolean>(false);
  const [loop, setLoop] = useState<boolean>(false);
  const [infoDevolutiva, setInfoDevolutiva] = useState<any[]>([]);
  const { renderToast } = useToast();

  const [dropDownList, setDropDownList] = useState<any>([]);
  const [event, setEvent] = useState<any>([]);
  const [minFinal, setMinFinal] = useState<any>(moment(new Date()));

  const {
    renderDropdownQueueCalendar,
    renderDropdownCalendario,
    renderEspecialidadeTerapeuta,
    renderTerapeutaFuncao,
    renderPacienteEspecialidade,
  } = useDropdown();

  const defaultValues = value || {
    dataInicio: '',
    dataFim: '',
    start: '',
    end: '',
    paciente: '',
    especialidade: '',
    modalidade: '',
    terapeuta: '',
    funcao: '',
    localidade: '',
    frequencia: '',
    statusEventos: '',
    diasFrequencia: [],
    observacao: '',
  };

  const {
    getValues,
    setValue,
    unregister,
    handleSubmit,
    watch,
    formState: { errors },
    control,
    trigger,
  } = useForm({ defaultValues });

  const onSubmit = async (formValueState: any, changeAll: boolean | null) => {
    setOpenConfirm(false);
    try {
      if (JSON.stringify(value) === JSON.stringify(formValueState)) {
        renderToast({
          type: 'warning',
          title: '401',
          message: 'Não houve alteração no evento!',
          open: true,
        });
        return;
      }

      setLoading(true);

      let data;
      if (isEdit) {
        formValueState.id = value.id;
        formValueState.changeAll = changeAll;
        data = await update('evento', formValueState);
      } else {
        data = await create('evento', formValueState);
      }

      onClose(formValueState);
      renderToast({
        type: 'success',
        title: '',
        message: isEdit ? 'Atualizado com sucesso!': 'Agendado com sucesso!',
        open: true,
      });
      setLoading(false);
    } catch ({ message }: any) {
      renderToast({
        type: 'failure',
        title: '401',
        message: `${message}`,
        open: true,
      });
      setLoading(false);
      return;
    }
  };

  const handleConfirm = (_event: any) => {
    if (isEdit && _event.frequencia.nome === 'Recorrente') {
      _event.dataAtual = value.dataAtual;
      setEvent(_event);
      setOpenConfirm(true);
    } else {
      onSubmit(_event, null);
    }
  };

  const filtrarDropDown = async (
    _value: any,
    type: string,
    index: string | undefined = ''
  ) => {
    let list: any = [];
    switch (type) {
      case 'paciente-especialidade':
        list = await renderPacienteEspecialidade(_value, statusPacienteCod);
        setDropDownList({ ...dropDownList, especialidades: list });
        setValue(`funcao${index}`, []);
        break;
      case 'especialidade-terapeuta':
        list = await renderEspecialidadeTerapeuta(_value);
        setDropDownList({ ...dropDownList, [`terapeutas${index}`]: list });
        setValue(`funcao${index}`, []);
        break;
      case 'terapeuta-funcao':
        list = await renderTerapeutaFuncao(_value);
        setDropDownList({ ...dropDownList, [`funcoes${index}`]: list });
        break;

      default:
        break;
    }
  };

  const renderEspecialidade = (
    index: string | undefined = '',
    info: any = null
  ) => {
    if (info) {
      setValue(`especialidade${index}`, {
        id: info.especialidade.id,
        nome: info.especialidade.nome,
      });
    }

    return (
      <>
        <Input
          labelText="Especialidade"
          id={`especialidade${index}`}
          type="select"
          customCol="col-span-6 sm:col-span-2"
          errors={errors}
          control={control}
          options={dropDownList?.especialidades}
          onChange={(e: any) =>
            filtrarDropDown(e.nome, 'especialidade-terapeuta', index)
          }
          validate={{
            required: true,
          }}
          disabled={!hasPermition('AGENDA_CALENDARIO_EVENTO_EDITAR_ESPECIALIDADE')}
        />

        <Input
          labelText="Terapeuta"
          id={`terapeuta${index}`}
          type="select"
          customCol="col-span-6 sm:col-span-2"
          errors={errors}
          control={control}
          options={info ? info.terapeutas : dropDownList.terapeutas}
          onChange={(e: any) =>
            filtrarDropDown(e.id, 'terapeuta-funcao', index)
          }
          validate={{
            required: true,
          }}
          disabled={!hasPermition('AGENDA_CALENDARIO_EVENTO_EDITAR_TERAPEUTA')}
        />
        <Input
          labelText="Função"
          id={`funcao${index}`}
          type="select"
          customCol="col-span-6 sm:col-span-2"
          errors={errors}
          control={control}
          options={dropDownList[`funcoes${index}`]}
          validate={{
            required: true,
          }}
          disabled={!hasPermition('AGENDA_CALENDARIO_EVENTO_EDITAR_FUNCAO')}
        />
      </>
    );
  };

  const rendeFiltro = useCallback(async () => {
    let list = [];
    switch (statusPacienteCod) {
      case STATUS_PACIENT_COD.therapy:
        list = await renderDropdownCalendario(statusPacienteCod);
        break;
      case STATUS_PACIENT_COD.queue_avaliation:
        list = await renderDropdownQueueCalendar(
          statusPacienteCod,
          value.paciente.id
        );

        renderAvalation();

        break;
      case STATUS_PACIENT_COD.queue_devolutiva:
        list = await renderDropdownQueueCalendar(
          statusPacienteCod,
          value.paciente.id
        );

        renderDevolutiva();

        break;
      case STATUS_PACIENT_COD.queue_therapy:
        list = await renderDropdownQueueCalendar(
          statusPacienteCod,
          value.paciente.id
        );
        setValue('modalidade', list.modalidades[0]);

        break;
      default:
        list = await renderDropdownQueueCalendar(
          statusPacienteCod,
          value.paciente.id
        );
        break;
    }
    setDropDownList(list);

    if (isEdit) {
      const date = moment(value.dataAtual); // Thursday Feb 2015
      const dow = Number(date.day());

      setValue('diasFrequencia', [dow]);
    }
  }, []);

  const renderAvalation = () => {
    setIsAvalicao(true);
    setValue('modalidade', { id: 1, nome: 'Avaliação' });
    setValue('frequencia', { id: 2, nome: 'Recorrente' });
    setValue('intervalo', { id: 1, nome: 'Todas Semanas' });
    setHasFrequencia(true);
  };

  const renderInfoDevolutiva = async (
    idPaciente: number,
    statusPacienteCod: string
  ) => {
    const info = await getList(
      `/paciente/especialidades?statusPacienteCod=${statusPacienteCod}&pacienteId=${idPaciente}`
    );
    setInfoDevolutiva(info);
    setLoop(true);
  };

  const renderDevolutiva = () => {
    setValue('modalidade', { id: 2, nome: 'Devolutiva' });
    setHasFrequencia(false);
    setIsDevolutiva(true);
    unregister(['frequencia', 'intervalo', 'especialidade'], {
      keepDirtyValues: true,
    });
  };

  useEffect(() => {
    rendeFiltro();
  }, []);

  useEffect(() => {
    if (value?.isExterno) {
      setIsExterno(true);
    }
  }, []);

  useEffect(() => {
    if (statusPacienteCod === STATUS_PACIENT_COD.queue_devolutiva) {
      renderInfoDevolutiva(value.paciente.id, statusPacienteCod);
    }
  }, [isDevolutiva]);

  useEffect(() => {
    if (isEdit && value?.frequencia?.nome === 'Recorrente') {
      setHasFrequencia(true);
      setValue('dataInicio', value.dataAtual);
    }

    if (isEdit && value?.mododalidade?.nome === 'Avaliação') {
      setIsAvalicao(true);
    }
  }, []);

  return (
    <>
      <form
        action="#"
        onSubmit={handleSubmit(handleConfirm)}
        id="form-cadastro-agendamento"
      >
        <div className="grid grid-cols-6 gap-4 mb-8 overflow-y-auto">
          <Input
            labelText="Modalidade"
            id="modalidade"
            type="select"
            customCol={`col-span-6 ${
              isAvaliacao || isEdit ? 'sm:col-span-2' : 'sm:col-span-3'
            }`}
            errors={errors}
            control={control}
            options={dropDownList?.modalidades}
            onChange={(e: any) => {
              trigger('dataFim', { shouldFocus: true });
              setIsDevolutiva(e.nome === 'Devolutiva');

              if (e.nome === 'Avaliação') {
                renderAvalation();
              }

              if (e.nome === 'Devolutiva') {
                renderDevolutiva();
              }
            }}
            validate={{
              required: true,
            }}
            disabled={!hasPermition('AGENDA_CALENDARIO_EVENTO_EDITAR_MODALIDADE')}
          />
          <Input
            labelText="Data"
            id="dataInicio"
            type="date"
            customCol={`col-span-6 font-inter font-light ${
              isAvaliacao || isEdit ? 'sm:col-span-2' : 'sm:col-span-3'
            }`}
            errors={errors}
            control={control}
            onChange={() => {
              const frequencia = getValues('frequencia');
              if (frequencia && frequencia?.nome === 'Recorrente') {
                const dataInicio = getValues('dataInicio');
                const date = moment(dataInicio); // Thursday Feb 2015
                const dow = Number(date.day());

                setValue('diasFrequencia', [dow]);
                setMinFinal(date.add(1, 'days'));
              }
            }}
            validate={{
              required: true,
              min: moment(new Date()).format('YYYY-MM-DD'),
            }}
            disabled={!hasPermition('AGENDA_CALENDARIO_EVENTO_EDITAR_DATA_INICIO')}
          />

          {isAvaliacao && (
            <Input
              labelText="Data Final"
              id="dataFim"
              type="date"
              customCol="col-span-6 sm:col-span-2 font-inter font-light"
              errors={errors}
              control={control}
              validate={{
                min: minFinal.format('YYYY-MM-DD'),
              }}
              disabled={!hasPermition('AGENDA_CALENDARIO_EVENTO_EDITAR_DATA_FIM')}
            />
          )}

          <Input
            labelText="Horario Inicial"
            id="start"
            type="time"
            customCol={`col-span-6 ${
              hasFrequencia ? 'sm:col-span-3' : 'sm:col-span-2'
            }`}
            errors={errors}
            control={control}
            onChange={(value: any) => {
              const start = getValues('start');
              const time = moment.duration(start);
              const startCalc: any = time.add(1, 'hours');

              const hours = (startCalc?._data?.hours).toLocaleString('pt-Br', {
                minimumIntegerDigits: 2,
                useGrouping: false,
              });

              const minutes = (startCalc?._data?.minutes).toLocaleString(
                'pt-Br',
                {
                  minimumIntegerDigits: 2,
                  useGrouping: false,
                }
              );

              const end = `${hours}:${minutes}`;
              setValue('end', end);
            }}
            validate={{
              required: true,
            }}
            disabled={!hasPermition('AGENDA_CALENDARIO_EVENTO_EDITAR_HORA_INICIO')}
          />
          <Input
            labelText="Horario Final"
            id="end"
            type="time"
            customCol={`col-span-6 ${
              hasFrequencia ? 'sm:col-span-3' : 'sm:col-span-2'
            }`}
            errors={errors}
            control={control}
            validate={{
              required: true,
            }}
            disabled={!hasPermition('AGENDA_CALENDARIO_EVENTO_EDITAR_HORA_FIM')}
          />

          {!isDevolutiva && (!value || value.id === value.groupId) && (
            <Input
              labelText="Frequência"
              id="frequencia"
              type="select"
              customCol={`col-span-6 ${
                hasFrequencia ? 'sm:col-span-2' : 'sm:col-span-2'
              }`}
              errors={errors}
              control={control}
              options={dropDownList?.frequencias}
              onChange={(e: any) => {
                setHasFrequencia(e.nome === 'Recorrente');
                if (e.nome === 'Recorrente') {
                  const dataInicio = getValues('dataInicio');
                  const date = moment(dataInicio); // Thursday Feb 2015
                  const dow = Number(date.day());

                  setValue('diasFrequencia', [dow]);
                }
              }}
              validate={{
                required: true,
              }}
              disabled={
                !hasPermition('AGENDA_CALENDARIO_EVENTO_EDITAR_FREQUENCIA') || isEdit
              }
            />
          )}

          {hasFrequencia && (
            <Input
              labelText="Intervalo"
              id="intervalo"
              type="select"
              customCol="col-span-6 sm:col-span-2"
              errors={errors}
              control={control}
              options={dropDownList?.intervalos}
              // onChange={(e: any)=> setHasFrequencia(e.nome === 'Semanal')}
              validate={{
                required: true,
              }}
              disabled={
                !hasPermition('AGENDA_CALENDARIO_EVENTO_EDITAR_INTERVALO') || isEdit
              }
            />
          )}

          {hasFrequencia && (
            <div className="col-span-6 sm:col-span-2">
              <SelectButtonComponent
                id="diasFrequencia"
                title="Dias da semana"
                options={dropDownList?.diasFrequencia}
                control={control}
                rules={{
                  required: !!getValues('frequencias'),
                }}
                disabled={
                  !hasPermition('AGENDA_CALENDARIO_EVENTO_EDITAR_DIAS_FREQUENCIA') ||
                  isEdit
                }
              />
            </div>
          )}

          <div className="col-span-6"></div>
          <div className="col-span-6">
            <Title size="md" color="violet">
              Informações Para Consulta
            </Title>
          </div>

          <Input
            labelText="Paciente"
            id="paciente"
            type="select"
            customCol="col-span-6 sm:col-span-6"
            errors={errors}
            control={control}
            options={dropDownList?.pacientes}
            onChange={(e: any) => {
              if (isDevolutiva) {
                renderInfoDevolutiva(e.id, statusPacienteCod);
              } else {
                filtrarDropDown(e.id, 'paciente-especialidade');
                setLoop(false);
              }
            }}
            validate={{
              required: true,
            }}
            disabled={!hasPermition('AGENDA_CALENDARIO_EVENTO_EDITAR_PACIENTE')}
          />
          {isDevolutiva && loop
            ? infoDevolutiva.map((info: any, key: number) => {
                return renderEspecialidade(`${key}`, info);
              })
            : renderEspecialidade()}

          <Input
            labelText="Local Externo?"
            id="isExterno"
            type="switch"
            customCol="col-span-6 sm:col-span-1"
            errors={errors}
            control={control}
            disabled={!hasPermition('AGENDA_CALENDARIO_EVENTO_EDITAR_LOCALIDADE')}
            onChange={(e: any) => {
              setIsExterno(e);
            }}
          />

          {isExterno && (
            <Input
              labelText="km"
              id="km"
              type="number"
              customCol="col-span-6 sm:col-span-1 font-inter font-light"
              errors={errors}
              control={control}
              disabled={!hasPermition('AGENDA_CALENDARIO_EVENTO_EDITAR_LOCALIDADE')}
            />
          )}

          <Input
            labelText="Local"
            id="localidade"
            type="select"
            customCol={`col-span-6 sm:col-span-${isExterno ? '2' : '3'}`}
            errors={errors}
            control={control}
            options={dropDownList?.localidades}
            validate={{
              required: true,
            }}
            disabled={!hasPermition('AGENDA_CALENDARIO_EVENTO_EDITAR_LOCALIDADE')}
          />
          <Input
            labelText="Status Eventos"
            id="statusEventos"
            type="select"
            customCol="col-span-6 sm:col-span-2"
            errors={errors}
            control={control}
            options={dropDownList?.statusEventos}
            validate={{
              required: true,
            }}
            disabled={!hasPermition('AGENDA_CALENDARIO_EVENTO_EDITAR_STATUS_EVENTOS')}
          />
          <Input
            labelText="Observação"
            id="observacao"
            type="textarea"
            customCol="col-span-6 sm:col-span-6"
            errors={errors}
            control={control}
            validate={{
              required: false,
            }}
            disabled={!hasPermition('AGENDA_CALENDARIO_EVENTO_EDITAR_OBSERVACAO')}
          />
        </div>

        {hasPermition('AGENDA_CALENDARIO_EVENTO_BOTAO_ATUALIZAR_SALVAR')  ? (
          <ButtonHeron
            text={isEdit ? 'Atualizar' : 'Agendar'}
            type={isEdit ? 'second' : 'primary'}
            size="full"
            onClick={handleSubmit(handleConfirm)}
            loading={loading}
          />
        ) : null}
      </form>

      <Confirm
        onAccept={() => onSubmit(event, true)}
        onReject={() => onSubmit(event, false)}
        onClose={() => setOpenConfirm(false)}
        title="Evento(s)"
        message="Alterar eventos futuros ou apenas o atual?"
        icon="pi pi-exclamation-triangle"
        open={openConfirm}
        acceptLabel="Atual e eventos futuros"
        rejectLabel="Atual"
      />
    </>
  );
};
