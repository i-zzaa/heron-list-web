import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import { useToast } from '../contexts/toast';
import { create, update } from '../server';
import { buildErrorToast } from '../util/error';
import { ButtonHeron, Input } from '../components/index';
import { moneyFormat, setColorChips } from '../util/util';
import { PERIODO, STATUS, TIPO_SESSAO } from '../constants/patient';
import { notifyDocumentAlertsMightHaveChanged } from '../util/documentAlertsBus';

export interface OptionProps {
  id: string;
  nome: string;
}

interface Props {
  onClose: () => void;
  dropdown: any;
  value: any;
  statusPacienteCod: string;
  fieldsCostant: any;
}

export interface PacientsProps {
  id: string;
  nome: string;
  responsavel: string;
  telefone: string;
  carteirinha: string;
  dataNascimento: string;
  convenio: string;
  vaga: any;
  status: OptionProps;
  tipoSessao: OptionProps;
  sessao: any[];
  dataEmissaoPlanoTerapeutico?: string;
  dataEmissaoLaudoMedico?: string;
}

export const PatientForm = ({
  onClose,
  dropdown,
  value,
  statusPacienteCod,
  fieldsCostant,
}: Props) => {
  const [loading, setLoaging] = useState<boolean>(false);
  const { renderToast } = useToast();
  const [fields, setFields] = useState(fieldsCostant);
  const [sessoes, setSessoes] = useState([]);

  const isEdit = !!value?.nome;
  const defaultValues = value || {};

  const {
    reset,
    handleSubmit,
    formState: { errors },
    control,
    setValue,
  } = useForm({ defaultValues });

  const onSubmit = async (body: any) => {
    setLoaging(true);

    try {
      let data;
      // As duas ramas de `statusPacienteCod` (avaliação vs. demais filas)
      // montavam exatamente o mesmo objeto — não havia diferença real entre
      // elas, só duplicação.
      const formatValues = {
        ...body,
        periodoId: body?.periodoId?.id || PERIODO.integral,
        convenioId: body?.convenioId?.id || null,
        statusId: body?.statusId?.id || STATUS.padrao,
        tipoSessaoId: body?.tipoSessaoId?.id || TIPO_SESSAO.terapeuta,
        especialidades: (body?.especialidades || []).map(
          (item: OptionProps) => item.id
        ),
        statusPacienteCod,
      };

      if (isEdit) {
        formatValues.id = value.id;
        data = await update('paciente', formatValues);
      } else {
        data = await create('paciente', formatValues);
      }

      reset();
      renderToast({
        type: 'success',
        title: '',
        message: data?.data.message,
        open: true,
      });

      // Emissão do Plano/Laudo pode ter mudado — o sino precisa buscar a
      // lista de vencimentos de novo, senão um aviso já resolvido continua
      // aparecendo até recarregar a página.
      notifyDocumentAlertsMightHaveChanged();

      return onClose();
    } catch (error) {
      renderToast(buildErrorToast(error, 'Erro de conexão'));
    } finally {
      setLoaging(false);
    }
  };

  const handleChange = async(value: any, fieldId: string) => {
    switch (fieldId) {
      case 'especialidades':
        const current: any = await Promise.all(value.map((itemValue: any) => {
          const sessao = sessoes.filter((item: any) => item.especialidade === itemValue.nome)
          if (sessao.length) {
            return sessao[0]
          }else {
            return {
              especialidade: itemValue.nome,
              especialidadeId: itemValue.id,
              valor: moneyFormat.format(200),
              km: 0,
            };
          }
        }))

        setSessoes(current);
        setValue('sessao', current);
        break;

      default:
        break;
    }
  };

  useEffect(() => {
    value?.nome && setColorChips(dropdown?.especialidades);

    if (value?.sessao) {
      setSessoes(value.sessao);
    }
  }, [value]);

  useEffect(() => {
    const fieldsFormat = fieldsCostant;
    const fieldsState: any = {};
    fieldsFormat.forEach((field: any) => (fieldsState[field.id] = ''));
    setFields(fieldsFormat);
  }, []);

  return (
    <form
      action="#"
      onSubmit={handleSubmit(onSubmit)}
      id="form-cadastro-patient"
      data-testid="patient-form"
    >
      <div className="grid grid-cols-6 gap-2 mb-4 min-h-[300px] overflow-y-auto">
        {fields.map((field: any) => (
          <Input
            key={field.id}
            labelText={field.labelText}
            id={field.id}
            type={field.type}
            customCol={field.customCol}
            errors={errors}
            validate={field.validate}
            value={field.id === 'sessao' ? sessoes : null}
            control={control}
            onChange={(values: any) => handleChange(values, field.id)}
            options={
              field.type === 'select' || field.type === 'multiselect'
                ? dropdown[field.name]
                : undefined
            }
          />
        ))}
      </div>

      <ButtonHeron
        text={isEdit ? 'Atualizar' : 'Cadastrar'}
        type={isEdit ? 'second' : 'primary'}
        size="full"
        loading={loading}
        testId="patient-save"
      />
    </form>
  );
};
