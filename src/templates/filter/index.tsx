import { Input } from '../../components/input';
import { ButtonHeron } from '../../components/button';
import { useForm } from 'react-hook-form';
import { useEffect } from 'react';
import { permissionAuth } from '../../contexts/permission';
import { Accordion, AccordionTab } from 'primereact/accordion';

export interface FilterProps {
  id: string;
  legend?: string;
  nameButton?: string;
  fields: any;
  dropdown: any;
  screen: string;
  loading: boolean;
  defaultValues?: any;
  onSubmit: (formState: any) => any;
  onInclude?: () => any;
  includeButtonTestId?: string;
  onReset: () => any;
}

export function Filter({
  id,
  legend,
  fields,
  screen,
  loading,
  nameButton,
  dropdown,
  defaultValues,
  onSubmit,
  onInclude,
  includeButtonTestId,
  onReset,
}: FilterProps) {
  const { setValue, handleSubmit, control, reset } = useForm({ defaultValues });
  const { hasPermition } = permissionAuth();

  const handleReset = () => {
    reset(defaultValues);
    onReset();
  };

  const handleSubmit2 = (formState: any) => {
    if (formState.devolutiva) {
      setValue('naFila', true);
      formState.naFila = true;
    }
    onSubmit(formState);
  };

  useEffect(() => {
    if (!hasPermition(`${screen}_FILTRO_SELECT_AGENDADOS`)) {
      setValue('naFila', true);
    }
  });

  return (
    <Accordion>
      <AccordionTab header={legend} tabIndex={0}>
        <form
          id={id}
          action="#"
          onSubmit={handleSubmit(handleSubmit2)}
          className="flex-1"
        >
          <div className="grid grid-cols-6 gap-4">
            {fields.map(
              (field: any) =>
                hasPermition(field.permission) && (
                  <Input
                    key={field.id}
                    labelText={field.labelText}
                    id={field.id}
                    type={field.type}
                    customCol={field.customCol}
                    control={control}
                    options={
                      field.type === 'select' ? dropdown[field.name] : undefined
                    }
                    // hidden={field.hidden}
                  />
                )
            )}
          </div>

          <div className="flex items-center mt-10 gap-2 justify-between">
            <>
              {onInclude &&
                hasPermition(`${screen}_FILTRO_BOTAO_CADASTRAR`) && (
                  <div className="sm:text-end">
                    <ButtonHeron
                      text={nameButton || 'Cadastrar'}
                      icon="pi pi-user-plus"
                      type="primary"
                      size="sm"
                      onClick={onInclude}
                      testId={includeButtonTestId}
                    />
                  </div>
                )}
              <div className="hidden sm:w-2/4 ml-auto sm:grid grid-cols-2 gap-2">
                <>
                  {hasPermition(`${screen}_FILTRO_BOTAO_LIMPAR`) && (
                    <div className="text-end">
                      <ButtonHeron
                        text="Limpar"
                        icon="pi pi-filter-slash"
                        type="second"
                        size="full"
                        onClick={handleReset}
                      />
                    </div>
                  )}
                  {hasPermition(`${screen}_FILTRO_BOTAO_PESQUISAR`) && (
                    <div className="text-end">
                      <ButtonHeron
                        text="Pesquisar"
                        icon="pi pi-filter"
                        type="primary"
                        size="full"
                        loading={loading}
                        onClick={() => handleSubmit(handleSubmit2)}
                      />
                    </div>
                  )}
                </>
              </div>
              <div className="sm:w-2/4 ml-auto grid sm:hidden grid-cols-2 gap-2">
                <>
                  {hasPermition(`${screen}_FILTRO_BOTAO_LIMPAR`) && (
                    <div className="text-end">
                      <ButtonHeron
                        text="Limpar"
                        icon="pi pi-filter-slash"
                        type="second"
                        size="icon"
                        onClick={handleReset}
                      />
                    </div>
                  )}
                  {hasPermition(`${screen}_FILTRO_BOTAO_PESQUISAR`) && (
                    <div className="text-end">
                      <ButtonHeron
                        text="Pesquisar"
                        icon="pi pi-filter"
                        type="primary"
                        size="icon"
                        loading={loading}
                        onClick={() => handleSubmit(handleSubmit2)}
                      />
                    </div>
                  )}
                </>
              </div>
            </>
          </div>
        </form>
      </AccordionTab>
    </Accordion>
  );
}
