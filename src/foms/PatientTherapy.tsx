import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import { useToast } from '../contexts/toast';
import { create, update } from '../server';
import { buildErrorToast } from '../util/error';
import { ButtonHeron, Input } from '../components/index';
import { setColorChips } from '../util/util';

interface OptionProps {
  id: string;
  nome: string;
}

interface PatientValue {
  id?: string;
  nome?: string;
  especialidades?: OptionProps[];
  [key: string]: any;
}

interface FieldProps {
  id: string;
  labelText: string;
  type: string;
  customCol?: string;
  validate?: any;
  name?: string;
}

interface Props {
  onClose: () => void;
  dropdown: Record<string, any[]>;
  value?: PatientValue;
  statusPacienteCod: number;
  fieldsCostant: FieldProps[];
}

export const PatientTherapy = ({
  onClose,
  dropdown,
  value,
  statusPacienteCod,
  fieldsCostant,
}: Props) => {
  const [loading, setLoading] = useState<boolean>(false);
  const { renderToast } = useToast();
  const [especialidades, setEspecialidades] = useState<OptionProps[]>(
    value?.especialidades || []
  );

  const isEdit = !!value?.nome;
  const defaultValues = value || {};

  const {
    reset,
    handleSubmit,
    formState: { errors },
    control,
  } = useForm({ defaultValues });

  const formatPayload = (body: any) => ({
    ...body,
    periodoId: body.periodoId.id,
    convenioId: body.convenioId.id,
    statusId: body.statusId.id,
    tipoSessaoId: statusPacienteCod === 1 ? body.tipoSessaoId.id : 2,
    especialidades: body.especialidades.map((item: OptionProps) => item.id),
    statusPacienteCod,
  });

  const onSubmit = async (body: any) => {
    setLoading(true);

    try {
      let data;
      const formatValues = formatPayload(body);

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
      renderToast(buildErrorToast(error, 'Não cadastrado!'));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (fieldValue: OptionProps[], fieldId: string) => {
    if (fieldId === 'especialidades') {
      setEspecialidades(fieldValue);
    }
  };

  useEffect(() => {
    value?.nome && setColorChips();
  }, [value]);

  return (
    <form
      action="#"
      onSubmit={handleSubmit(onSubmit)}
      id="form-cadastro-patient"
    >
      <div className="grid grid-cols-6 gap-4 mb-4 min-h-[300px] overflow-y-auto">
        {fieldsCostant.map((field: FieldProps) => (
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
            onChange={(values: OptionProps[]) => handleChange(values, field.id)}
            options={
              field.type === 'select' || field.type === 'multiselect'
                ? field.name
                  ? dropdown[field.name]
                  : undefined
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
