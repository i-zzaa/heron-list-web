import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { useToast } from '../../contexts/toast';
import { useForm } from 'react-hook-form';
import {
  Card,
  Modal,
  SearchAdd,
  List,
  Confirm,
  ButtonHeron,
  Input,
  TemporaryPasswordModal,
} from '../../components/index';
import { create, getList, search, update } from '../../server';
import { buildErrorToast } from '../../util/error';

import { Fields } from '../../constants/formFields';
import { useDropdown } from '../../contexts/dropDown';
import { moneyFormat } from '../../util/util';
import Pagination from '../../components/Pagination';
import { PERFIL } from '../../constants/user';
import {
  buildPaginationState,
  resolveResponseData,
  resolveResponsePagination,
} from '../../util/pagination';

interface Props {
  namelist: string;
  onClick: (e: any) => void;
  iconButtonFooter?: string;
  textButtonFooter?: string;
  screen: string;
}

export default function CrudSimples({
  namelist,
  onClick,
  iconButtonFooter,
  textButtonFooter,
  screen,
}: Props) {
  const [list, setList] = useState<any>([]);
  const [pagination, setPagination] = useState<any>(
    buildPaginationState(1, 10, 0)
  );
  const [item, setItem] = useState<any>({});
  const [value, setValues] = useState<any>([]);
  const [open, setOpen] = useState<boolean>(false);
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [hidden, setHidden] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [openConfirm, setOpenConfirm] = useState<boolean>(false);
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(
    null
  );

  const isTerapeuta = [
    'especialidadeId',
    'funcoesId',
    'comissao',
    // 'fazDevolutiva',
    'cargaHoraria',
  ];

  const [comissao, setComissao] = useState([]);
  const [cargaHoraria, setCargaHoraria] = useState({});

  const [fields, setFields] = useState([]);
  const [dropDownList, setDropDownList] = useState<any>([]);
  const { renderDropdownCrud, renderEspecialidadeFuncao } = useDropdown();

  const { renderToast } = useToast();

  const {
    handleSubmit,
    control,
    formState: { errors },
    setValue,
    unregister,
    reset,
  } = useForm<any>();

  const buildFormPayload = (userState: any) => {
    const formatValues = { ...userState };

    Object.keys(userState).forEach((index) => {
      if (!index.includes('Id')) {
        return;
      }

      if (!userState[index] || typeof userState[index][0] === 'number') {
        delete formatValues[index];
        return;
      }

      if (Array.isArray(userState[index]) && userState[index].length) {
        formatValues[index] = formatValues[index].map((item_: any) => item_.id);
        return;
      }

      formatValues[index] = userState[index].id;
    });

    delete formatValues.search;
    return formatValues;
  };

  const resolveFieldsKey = () => {
    if (namelist === 'status-eventos') return 'statusEventosFields';
    if (namelist === 'grupo-permissoes') return 'grupoPermissoesFields';
    return `${namelist}Fields`;
  };

  const renderList = useCallback(
    async (page: number = 1, pageSize: number = 10) => {
      setLoading(true);

      try {
        const response = await getList(
          `${namelist}?page=${page}&pageSize=${pageSize}`
        );
        setList(resolveResponseData(response));
        setPagination(
          resolveResponsePagination(
            response,
            buildPaginationState(page, pageSize, 0)
          )
        );
      } catch (error) {
        renderToast(buildErrorToast(error, 'Não foi possível carregar a lista.'));
      } finally {
        setLoading(false);
        setOpen(false);
      }
    },
    [namelist]
  );

  const handleClick = async (word: any) => {
    try {
      if (word.search === undefined || word.search === '') {
        renderList();
        return;
      }
      setLoading(true);
      const response = await search(namelist, word.search);
      setValue('search', '');
      const lista = response.status === 200 ? response.data : [];
      setList(lista);
      setPagination(buildPaginationState(1, 0, 0));
    } catch (error) {
      renderToast(buildErrorToast(error, 'Não foi possível realizar a busca.'));
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (userState: any) => {
    setLoading(true);

    try {
      let data;
      const formatValues = buildFormPayload(userState);

      if (isEdit) {
        formatValues.id = item.id;
        data = await update(namelist, formatValues);
      } else {
        data = await create(namelist, formatValues);
      }

      // POST /usuarios devolve senhaTemporaria (texto plano, só nesta
      // resposta) quando um usuário novo é criado — não se aplica a edição
      // nem às demais entidades deste CRUD genérico.
      if (!isEdit && namelist === 'usuarios' && data?.data?.senhaTemporaria) {
        setTemporaryPassword(data.data.senhaTemporaria);
      }

      reset();
      setPagination(buildPaginationState(1, 10, 0));
      renderList();
      setIsEdit(false);
      setOpen(false);
      renderToast({
        type: 'success',
        title: '',
        message: 'Sucesso!',
        open: true,
      });
    } catch (error) {
      renderToast(buildErrorToast(error, 'Não foi possível salvar.'));
    } finally {
      setLoading(false);
    }
  };

  const handleTrashItem = async () => {
    try {
      await update(namelist, item);

      renderList();
      setOpenConfirm(false);
      renderToast({
        type: 'success',
        title: ' Sucesso!! ',
        message: 'Atualizado com sucesso!',
        open: true,
      });
    } catch (error) {
      renderToast(buildErrorToast(error, 'Não foi possível realizar!'));
    }
  };

  const actionFieldId = async (valueForm: any, fieldId: string) => {
    switch (fieldId) {
      case 'perfilId':
        const valid = valueForm.nome !== PERFIL.terapeuta;
        setHidden(valid);
        if (!valid) {
          unregister(isTerapeuta, { keepDirtyValues: true });
        }
        break;
      case 'especialidadeId':
        setValue('funcoesId', []);
        const especialidadeFuncao = await renderEspecialidadeFuncao(
          valueForm?.nome
        );
        setDropDownList({ ...dropDownList, funcoes: especialidadeFuncao });
        break;
      case 'cargaHoraria':
        setCargaHoraria(valueForm);
        setValue('cargaHoraria', valueForm);
        break;
      case 'funcoesId':
        const current: any = await Promise.all(
          valueForm.map((itemValue: any) => {
            const currentComissao = comissao.filter(
              (item: any) => item.funcao === itemValue.nome
            );
            if (currentComissao.length) {
              return currentComissao[0];
            }

            return {
              funcao: itemValue.nome,
              funcaoId: itemValue.id,
              valor: moneyFormat.format(80),
              tipo: 'Fixo',
            };
          })
        );

        setValue('comissao', current);
        setComissao(current);
        break;
      default:
        break;
    }
  };

  const handleChange = (valueForm: any, fieldId: string) => {
    switch (namelist) {
      case 'usuarios':
        actionFieldId(valueForm, fieldId);
        break;

      default:
        break;
    }
  };

  const findOptionById = (options: any[] = [], value: any) => {
    if (!value?.id) {
      return value;
    }

    return options.find((option) => option.id === value.id) || value;
  };

  const mapOptionsById = (options: any[] = [], values: any[] = []) => {
    if (!Array.isArray(values)) {
      return [];
    }

    return values.map((item) => findOptionById(options, item));
  };

  const buildComissaoFromFuncoes = (funcoes: any[] = []) => {
    if (!Array.isArray(funcoes)) {
      return [];
    }

    return funcoes.map((itemFuncao: any) => ({
      funcaoId: itemFuncao.funcao?.id || itemFuncao.funcaoId,
      valor: itemFuncao.comissao || moneyFormat.format(80),
      tipo: itemFuncao.tipo || 'Fixo',
      funcao: itemFuncao.funcao?.nome || itemFuncao.funcao,
    }));
  };

  const renderAgendar = useCallback(async () => {
    const list = await renderDropdownCrud();
    setDropDownList(list);
  }, [renderDropdownCrud]);

  const setOptions = (field: any) => {
    switch (field.type) {
      case 'select':
      case 'multiselect':
      case 'picker':
        return dropDownList[field.name];
      default:
        return undefined;
    }
  };

  const getFieldValue = (field: any) => {
    switch (field.type) {
      case 'picker':
        return value;
      case 'dataTableSessaoHeron':
        return comissao;
      case 'dataTable':
        return cargaHoraria;
      default:
        return undefined;
    }
  };

  useLayoutEffect(() => {
    renderAgendar();
  }, [renderAgendar]);

  useEffect(() => {
    const _fields = Fields[resolveFieldsKey()];
    const fieldsState: any = {};
    _fields.forEach((field: any) => (fieldsState[field.id] = ''));
    setFields(_fields);
  }, [namelist]);

  useEffect(() => {
    renderList();
  }, [renderList]);

  useEffect(() => {
    unregister(isTerapeuta, { keepDirtyValues: true });
  }, [unregister]);

  return (
    <>
      <SearchAdd
        onClick={() => {
          reset();
          setIsEdit(false);
          setOpen(true);
        }}
        onSubmit={handleSubmit(handleClick)}
        textButton="Cadastrar usuário"
        iconButton="pi pi-plus"
        control={control}
        loading={loading}
        screen={screen}
        addButtonTestId={`cadastro-add-${namelist}`}
      />

      <Card>
        <List
          loading={loading}
          screen={screen}
          type="simples"
          onClickTrash={(item_: any) => {
            item_.ativo = false;
            setItem(item_);
            setOpenConfirm(true);
          }}
          onClickEdit={async (item_: any) => {
            const elemento = { ...item_ };
            const shouldReloadCrudDropdown =
              !dropDownList?.perfies ||
              !dropDownList?.grupoPermissoes ||
              !dropDownList?.especialidades;

            const currentDropDownList = shouldReloadCrudDropdown
              ? await renderDropdownCrud()
              : dropDownList;

            if (shouldReloadCrudDropdown) {
              setDropDownList(currentDropDownList);
            }

            const especialidadeFromItem =
              elemento.especialidadeId || elemento.terapeuta?.especialidade;

            let funcoesOptions = currentDropDownList.funcoes || [];

            if (especialidadeFromItem?.nome) {
              funcoesOptions = await renderEspecialidadeFuncao(
                especialidadeFromItem.nome
              );
              setDropDownList((prev: any) => ({
                ...prev,
                funcoes: funcoesOptions,
              }));
            }

            if (elemento.perfil || elemento.perfilId) {
              elemento.perfilId = findOptionById(
                currentDropDownList.perfies,
                elemento.perfilId || elemento.perfil
              );
            }

            if (elemento.grupoPermissao || elemento.grupoPermissaoId) {
              elemento.grupoPermissaoId = findOptionById(
                currentDropDownList.grupoPermissoes,
                elemento.grupoPermissaoId || elemento.grupoPermissao
              );
            }

            if (especialidadeFromItem) {
              elemento.especialidadeId = findOptionById(
                currentDropDownList.especialidades,
                especialidadeFromItem
              );
            }

            if (
              !elemento.funcoesId &&
              Array.isArray(elemento.terapeuta?.funcoes)
            ) {
              elemento.funcoesId = elemento.terapeuta.funcoes.map(
                (itemFuncao: any) => ({
                  id: itemFuncao.funcao?.id || itemFuncao.funcaoId,
                  nome: itemFuncao.funcao?.nome,
                })
              );
            }

            if (Array.isArray(elemento.funcoesId)) {
              elemento.funcoesId = mapOptionsById(
                funcoesOptions,
                elemento.funcoesId
              );
            }

            if (!Array.isArray(elemento.comissao)) {
              elemento.comissao = buildComissaoFromFuncoes(
                elemento.terapeuta?.funcoes
              );
            }

            setCargaHoraria({});
            setComissao([]);
            Object.keys(elemento).forEach((index: any) => {
              if (index === 'cargaHoraria') {
                setCargaHoraria(elemento.cargaHoraria);
              }

              if (index === 'comissao') {
                setComissao(elemento.comissao);
                setValue(index, elemento[index]);
                return;
              }

              if (
                typeof elemento[index] === 'object' &&
                // !Array.isArray(elemento[index]) &&
                index !== PERFIL.terapeuta.toLowerCase() &&
                index !== 'comissao' &&
                index !== 'cargaHoraria' &&
                index.indexOf('Id') === -1
              ) {
                if (!elemento[`${index}Id`]) {
                  elemento[`${index}Id`] = elemento[index];
                }
                index = `${index}Id`;
              }

              setValue(index, elemento[index]);
            });

            setIsEdit(true);
            setItem(elemento);
            setOpen(true);

            if (namelist === 'grupo-permissoes') {
              setValues(elemento.permissoesId);
            }

            if (
              elemento.hasOwnProperty('terapeuta') &&
              elemento?.terapeuta !== null
            ) {
              setHidden(false);
            } else {
              setHidden(true);
              unregister(isTerapeuta, { keepDirtyValues: true });
            }
          }}
          onClick={(item_: any) => onClick(item_.id)}
          items={list}
          iconButtonFooter={iconButtonFooter}
          textButtonFooter={textButtonFooter}
          onClickLink={() => {}}
          onClickReturn={(item_: any) => {
            item_.ativo = true;
            setIsEdit(true);
            onSubmit(item_);
          }}
        />

        {pagination.totalPages > 1 && (
          <Pagination
            totalPages={pagination.totalPages}
            currentPage={pagination.currentPage}
            onChange={renderList}
          />
        )}
      </Card>

      <Modal
        title="Cadastro"
        open={open}
        width={
          ['usuarios', 'grupo-permissoes'].includes(namelist)
            ? '75vw'
            : '50vw'
        }
        onClose={() => {
          setOpen(false);
          reset();
        }}
      >
        {
          <form
            onSubmit={handleSubmit(onSubmit)}
            action="#"
            className="grid gap-6"
            data-testid={`crud-form-${namelist}`}
          >
            <div className="grid grid-cols-6 items-center gap-2">
              {fields.map((field: any) => (
                <Input
                  key={field.id}
                  labelText={field.labelText}
                  id={field.id}
                  type={field.type}
                  options={setOptions(field)}
                  validate={
                    !!field.validate
                      ? field.validate
                      : !hidden && { required: 'Campo obrigatório!' }
                  }
                  errors={errors}
                  control={control}
                  onChange={(values: any) => handleChange(values, field.id)}
                  hidden={namelist === 'usuarios' && field.hidden && hidden}
                  value={getFieldValue(field)}
                  customCol={field.customCol}
                />
              ))}
            </div>

            <ButtonHeron
              text={isEdit ? 'Atualizar' : 'Cadastrar'}
              type={isEdit ? 'second' : 'primary'}
              size="full"
              loading={loading}
              testId={`crud-save-${namelist}`}
            />
          </form>
        }
      </Modal>

      <Confirm
        onAccept={handleTrashItem}
        onReject={() => setOpenConfirm(false)}
        onClose={() => setOpenConfirm(false)}
        title="Desativar"
        message="Deseja realmente desativar?"
        icon="pi pi-exclamation-triangle"
        open={openConfirm}
      />

      <TemporaryPasswordModal
        open={!!temporaryPassword}
        senha={temporaryPassword}
        onClose={() => setTemporaryPassword(null)}
      />
    </>
  );
}
