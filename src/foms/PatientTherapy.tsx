import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import { useToast } from '../contexts/toast';
import { create, update } from '../server';
import { ButtonHeron, Input } from '../components/index';
import { setColorChips } from '../util/util';

interface OptionProps {
  id: string;
  nome: string;
}

interface Props {
  onClose: () => void;
  dropdown: any;
  value: any;
  statusPacienteCod: number;
  fieldsCostant: any;
}

export const PatientTherapy = ({
  onClose,
  dropdown,
  value,
  statusPacienteCod,
  fieldsCostant,
}: Props) => {
  const [loading, setLoaging] = useState<boolean>(false);
  const { renderToast } = useToast();
  const [fields, setFields] = useState(fieldsCostant);
  const [especialidades, setEspecialidades] = useState([]);

  const isEdit = !!value?.nome;
  const defaultValues = value || {};

  const {
    reset,
    handleSubmit,
    formState: { errors },
    control,
  } = useForm({ defaultValues });

  const onSubmit = async (body: any) => {
    setLoaging(true);

    try {
      let data;
      const formatValues =
        statusPacienteCod === 1
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
              periodoId: body.periodoId.id,
              convenioId: body.convenioId.id,
              statusId: body.statusId.id,
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
      renderToast({
        type: 'success',
        title: '',
        message: data?.data.message,
        open: true,
      });

      return onClose();
    } catch (error) {
      renderToast({
        type: 'failure',
        title: '401',
        message: 'Não cadastrado!',
        open: true,
      });
    } finally {
      setLoaging(false);
    }
  };

  const handleChange = (value: any, fieldId: string) => {
    switch (fieldId) {
      case 'especialidades':
        setEspecialidades(value);
        break;

      default:
        break;
    }
  };

  useEffect(() => {
    value?.nome && setColorChips();
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
      <div className="grid grid-cols-6 gap-4 mb-4 min-h-[300px] overflow-y-auto">
        {fields.map((field: any) => (
          <Input
            key={field.id}
            labelText={field.labelText}
            id={field.id}
            type={field.type}
            customCol={field.customCol}
            errors={errors}
            validate={field.validate}
            value={field.id === 'sessao' ? especialidades : null}
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
      />
    </form>
  );
};
