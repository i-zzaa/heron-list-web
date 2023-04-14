import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import { useToast } from '../contexts/toast';
import { create, update } from '../server';
import { ButtonHeron, Input } from '../components/index';
import { moneyFormat, setColorChips } from '../util/util';
import { STATUS_PACIENT_COD } from '../constants/patient';

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
      const formatValues =
        statusPacienteCod === STATUS_PACIENT_COD.queue_avaliation
          ? {
              ...body,
              periodoId: body.periodoId.id,
              convenioId: body.convenioId.id,
              statusId: body.statusId.id,
              tipoSessaoId: body.tipoSessaoId.id,
              especialidades: body.especialidades.map(
                (item: OptionProps) => item.id
              ),
              statusPacienteCod: statusPacienteCod,
            }
          : {
              ...body,
              periodoId: body?.periodoId ? body?.periodoId.id : 3, // padrao 3 de integral
              convenioId: body.convenioId.id,
              statusId: body?.statusId ? body?.statusId.id : 1, // padrao 1 de padrao
              tipoSessaoId: 2,
              especialidades: body.especialidades.map(
                (item: OptionProps) => item.id
              ),
              statusPacienteCod: statusPacienteCod,
            };

      if (isEdit) {
        formatValues.id = value.id;
        data = await update('pacientes', formatValues);
      } else {
        data = await create('pacientes', formatValues);
      }

      reset();
      setLoaging(false);
      renderToast({
        type: 'success',
        title: '',
        message: data?.data.message,
        open: true,
      });

      return onClose();
    } catch (error) {
      setLoaging(false);
      renderToast({
        type: 'failure',
        title: '401',
        message: 'Não cadastrado!',
        open: true,
      });
    }
  };

  const handleChange = (value: any, fieldId: string) => {
    switch (fieldId) {
      case 'especialidades':
        const list = value.map((item: any) => {
          return {
            especialidade: item.nome,
            especialidadeId: item.id,
            valor: moneyFormat.format(200),
            km: 0,
          };
        });

        setSessoes(list);
        setValue('sessao', list);
        break;

      default:
        break;
    }
  };

  useEffect(() => {
    value?.nome && setColorChips();

    if (
      // statusPacienteCod === STATUS_PACIENT_COD.crud_therapy &&
      value?.sessao
    ) {
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
        onClick={handleSubmit(onSubmit)}
        loading={loading}
      />
    </form>
  );
};
