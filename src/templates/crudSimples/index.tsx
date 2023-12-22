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
} from '../../components/index';
import { create, getList, search, update } from '../../server';

import { Fields } from '../../constants/formFields';
import { useDropdown } from '../../contexts/dropDown';
import { moneyFormat } from '../../util/util';
import Pagination from '../../components/Pagination';

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
  const [pagination, setPagination] = useState<any>({
    pageSize: 0,
    totalPage: 0,
  });
  const [item, setItem] = useState<any>({});
  const [value, setValues] = useState<any>([]);
  const [open, setOpen] = useState<boolean>(false);
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [hidden, setHidden] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [openConfirm, setOpenConfirm] = useState<boolean>(false);

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

  const renderList = useCallback(async (page: number = 1, pageSize: number= 10) => {
    setLoading(true);

    try {
      const response = await getList(`${namelist}?page=${page}&pageSize=${pageSize}`);
      setList(response.data);
      setPagination(response.pagination)
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
    if (open) {
      setOpen(false);
    }
  }, []);

  const handleClick = async (word: any) => {
    try {
      if (word.search === undefined || word.search === ""){
        renderList();  
        return;
      }
      setLoading(true);
      const response = await search(namelist, word.search);
      setValue('search', '')
      const lista = response.status === 200 ? response.data : [];
      setList(lista);
      setPagination({
        pageSize: 0,
        totalPage: 0,
      })

      setLoading(false);
    } catch (error) {
      setLoading(false);
      msgError(error);
    }
  };

  const onSubmit = async (userState: any) => {
    try {
      setLoading(true);

      let data;
      const formatValues = {
        ...userState,
      };

      Object.keys(userState).forEach((index) => {
        if (index.indexOf('Id') !== -1) {
          if (!userState[index] || typeof userState[index][0] === 'number') {
            delete formatValues[index];
            return;
          }

          if (Array.isArray(userState[index]) && userState[index].length) {
            formatValues[index] = formatValues[index].map(
              (item_: any) => item_.id
            );
          } else {
            formatValues[index] = userState[index].id;
          }
        }
      });

      delete formatValues.search;

      if (isEdit) {
        formatValues.id = item.id;
        data = await update(namelist, formatValues);
      } else {
        data = await create(namelist, formatValues);
      }

      reset();
      renderList();
      setIsEdit(false);
      setOpen(false);
      renderToast({
        type: 'success',
        title: '',
        message: 'Sucesso!',
        open: true,
      });
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
    } catch (message) {
      msgError(message);
    }
  };

  const msgError = ({ data }: any) => {
    renderToast({
      type: 'failure',
      title: '401',
      message: data?.message || 'Não foi possível realizar!',
      open: true,
    });
  };

  const actionFieldId = async (valueForm: any, fieldId: string) => {
    switch (fieldId) {
      case 'perfilId':
        const valid = valueForm.nome !== 'Terapeuta' 
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
        const current: any = await Promise.all(valueForm.map((itemValue: any) => {
          const currentComissao = comissao.filter((item: any) => item.funcao === itemValue.nome)
          if (currentComissao.length) {
            return currentComissao[0]
          }else {
              return {
                funcao: itemValue.nome,
                funcaoId: itemValue.id,
                valor: moneyFormat.format(80),
                tipo: 'Fixo',
            };
          }
        }))

        setValue('comissao', current);
        setComissao(current);
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

  const renderAgendar = useCallback(async () => {
    const list = await renderDropdownCrud();
    setDropDownList(list);
  }, []);

  const setOptions = (field: any) => {
    switch (field.type) {
      case 'select':
      case 'multiselect':
      case 'picker':
        return dropDownList[field.name];
      default:
        break;
    }
  };

  const seValue = (field: any) => {
    switch (field.type) {
      case 'picker':
        return value;
      case 'dataTableSessaoHeron':
        return comissao;
      case 'dataTable':
        return cargaHoraria;
      default:
        break;
    }
  };

  useLayoutEffect(() => {
    renderAgendar();
  }, [renderAgendar]);

  useEffect(() => {
    let namelistField = `${namelist}Fields`

    if (namelist === 'status-eventos') namelistField = 'statusEventosFields'

    const _fields = Fields[namelistField];
    const fieldsState: any = {};
    _fields.forEach((field: any) => (fieldsState[field.id] = ''));
    setFields(_fields);
  }, []);

  useEffect(() => {
    renderList();
  }, [renderList]);

  useEffect(() => {
    unregister(isTerapeuta, { keepDirtyValues: true });
  }, []);

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
          onClickEdit={(item_: any) => {
            const elemento = { ...item_ };

            setCargaHoraria({});
            setComissao([]);
            Object.keys(elemento).forEach((index: any) => {
              if (
                typeof elemento[index] === 'object' &&
                // !Array.isArray(elemento[index]) &&
                index !== 'terapeuta' &&
                index !== 'cargaHoraria' &&
                index.indexOf('Id') === -1
              ) {
                elemento[`${index}Id`] = elemento[index];
                index = `${index}Id`;
              }

              if (index === 'cargaHoraria') {
                setCargaHoraria(elemento.cargaHoraria);
              }

              if (index === 'comissao') {
                setComissao(elemento.comissao);
              }

              setValue(index, elemento[index]);
            });

            setIsEdit(true);
            setItem(elemento);
            setOpen(true);

            if (namelist === 'usuarios') {
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

       {pagination.totalPages > 1 && <Pagination totalPages={pagination.totalPages}  currentPage={pagination.currentPage} onChange={renderList}/>}

      </Card>

      <Modal
        title="Cadastro"
        open={open}
        width={namelist === 'usuarios' ? '75vw' : '50vw'}
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
                  value={seValue(field)}
                  customCol={field.customCol}
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
    </>
  );
}
