import { Input } from '../../components/input';
import { ButtonHeron } from '../../components/button';
import { useForm } from 'react-hook-form';
import { ReactNode, useEffect } from 'react';
import { permissionAuth } from '../../contexts/permission';
import { Accordion, AccordionTab } from 'primereact/accordion';
import './styles.css';

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
  // Botões ao lado do Cadastrar/Agendar (ex.: importar planilha). A tela
  // decide a permissão de cada um.
  extraActions?: ReactNode;
  onReset: () => any;
  // Quando true, o Pesquisar fica desabilitado até algum campo do filtro
  // ser preenchido.
  requireFilledField?: boolean;
  // Quando true, o filtro já abre expandido.
  defaultOpen?: boolean;
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
  extraActions,
  onReset,
  requireFilledField = false,
  defaultOpen = false,
}: FilterProps) {
  const { setValue, handleSubmit, control, reset, watch } = useForm({
    defaultValues,
  });
  const { hasPermition } = permissionAuth();

  const showInclude =
    !!onInclude && !!hasPermition(`${screen}_FILTRO_BOTAO_CADASTRAR`);

  const handleReset = () => {
    reset(defaultValues);
    onReset();
  };

  // Só os campos do filtro contam — `naFila` é setado por baixo dos panos
  // (ver useEffect abaixo) e não é algo que o usuário preencheu.
  // `watch()` re-renderiza o filtro a cada alteração, então só assina
  // quando a tela pediu essa regra.
  const formValues: any = requireFilledField ? watch() : {};
  const searchDisabled =
    requireFilledField &&
    !fields.some((field: any) => {
      const value = formValues?.[field.id];
      return value !== undefined && value !== null && value !== '';
    });

  const handleSubmit2 = (formState: any) => {
    // Enter num campo também submete o form, mesmo com o botão desabilitado.
    if (searchDisabled) {
      return;
    }

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
    <div className="filter-heron">
      <Accordion
        activeIndex={defaultOpen ? 0 : null}
        expandIcon="pi pi-chevron-down"
        collapseIcon="pi pi-chevron-up"
      >
        <AccordionTab
          header={
            <div className="flex items-center gap-3">
              <span className="filter-heron__icon">
                <i className="pi pi-sliders-h" />
              </span>
              <span className="text-[15px] font-bold text-violet-800">
                {legend}
              </span>
            </div>
          }
          tabIndex={0}
        >
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
                        field.type === 'select'
                          ? dropdown[field.name]
                          : undefined
                      }
                      // hidden={field.hidden}
                    />
                  )
              )}
            </div>

            <div className="filter-heron__actions flex flex-col-reverse sm:flex-row sm:items-center gap-2">
              <>
                {(showInclude || extraActions) && (
                  <div className="sm:mr-auto flex flex-col sm:flex-row gap-2">
                    {showInclude && (
                      <ButtonHeron
                        text={nameButton || 'Cadastrar'}
                        icon="pi pi-user-plus"
                        type="primary"
                        size="full"
                        onClick={onInclude}
                        testId={includeButtonTestId}
                      />
                    )}
                    {extraActions}
                  </div>
                )}
                <div className="grid grid-cols-2 sm:flex gap-2 sm:ml-auto">
                  <>
                    {hasPermition(`${screen}_FILTRO_BOTAO_LIMPAR`) && (
                      <ButtonHeron
                        text="Limpar"
                        icon="pi pi-filter-slash"
                        type="outline"
                        size="full"
                        onClick={handleReset}
                      />
                    )}
                    {hasPermition(`${screen}_FILTRO_BOTAO_PESQUISAR`) && (
                      <ButtonHeron
                        text="Pesquisar"
                        icon="pi pi-search"
                        type="primary"
                        size="full"
                        loading={loading}
                        disabled={searchDisabled}
                        onClick={() => handleSubmit(handleSubmit2)}
                      />
                    )}
                  </>
                </div>
              </>
            </div>
          </form>
        </AccordionTab>
      </Accordion>
    </div>
  );
}
