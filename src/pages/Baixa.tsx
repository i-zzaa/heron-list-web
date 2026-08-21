import { useCallback, useEffect, useState } from 'react';
import { deleteItem, filter, update } from '../server';

import { useToast } from '../contexts/toast';
import { buildErrorToast } from '../util/error';
import { permissionAuth } from '../contexts/permission';
import { useAuth } from '../contexts/auth';
import { Card, Filter,ButtonHeron } from '../components/index';
import { useDropdown } from '../contexts/dropDown';

import { filterBaixaFields } from '../constants/formFields';
import PaginationComponent from '../components/Pagination';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dropdown } from 'primereact/dropdown';
import { STATUS_PACIENT_COD } from '../constants/patient';
import { NotFound } from '../components/notFound';
import { Tag } from '../components/tag';
import { buildEspecialidadeColorMap } from '../util/util';
import { mapFormValuesToPayload } from '../util/forms';
import {
  buildPaginationState,
  resolveResponseData,
  resolveResponsePagination,
} from '../util/pagination';

const fieldsConst = filterBaixaFields;
const fieldsState: any = {};
fieldsConst.forEach((field: any) => (fieldsState[field.id] = ''));

export default function Baixa() {
  const { user } = useAuth()
  const { hasPermition } = permissionAuth();
  const [baixas, setBaixas] = useState<any[]>();

  const [filterCurrent, setFilter] = useState<any>({});
  const [pagination, setPagination] = useState<any>(buildPaginationState());

  const [loading, setLoading] = useState<boolean>(false);

  const [dropDownList, setDropDownList] = useState<any>([]);
  const { renderDropdownBaixa } = useDropdown();

  const { renderToast } = useToast();

  const handlePagination = async (pag: any) => {
    const currentPage = {
      ...pagination,
      currentPage: pag,
    };

    setPagination(currentPage);
    handleSubmitFilter(filterCurrent, currentPage);
  }

  const handleSubmitFilter = async (formState: any = filterCurrent, pag = pagination) => {
    setLoading(true);
    setFilter(formState)

    try {
      const format: any = mapFormValuesToPayload({
        ...formState,
        baixa: formState.baixa === undefined ? false : formState.baixa,
      });

      const response: any = await filter('baixa', format, `page=${pag.currentPage}&pageSize=${pag.pageSize}`);
      setBaixas(resolveResponseData(response));
      setPagination(resolveResponsePagination(response, pag));
    } catch (error) {
      renderToast(buildErrorToast(error, 'Erro na conexão!'));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (rowData: any) => {
    try {
      await update('baixa', {id: rowData.id, usuarioId: user.id});
      handleSubmitFilter();
    } catch (error) {
      renderToast(buildErrorToast(error, 'Não foi possível dar baixa.'));
    }
  };

  const handleDelete = async (rowData: any) => {
    try {
      await deleteItem(`baixa/${rowData.id}`);
      handleSubmitFilter();
    } catch (error) {
      renderToast(buildErrorToast(error, 'Não foi possível excluir.'));
    }
  };

  // Inclui/altera/remove o ticket vinculado à baixa — `ticketId: null` some
  // com o vínculo (o próprio Dropdown do PrimeReact já manda `null` quando
  // o usuário limpa a seleção via `showClear`).
  const handleUpdateTicket = async (rowData: any, ticketId: number | null) => {
    try {
      await update('baixa', { id: rowData.id, ticketId });
      handleSubmitFilter();
    } catch (error) {
      renderToast(buildErrorToast(error, 'Não foi possível atualizar o ticket.'));
    }
  };


  const renderDropdown = useCallback(async () => {
    const list = await renderDropdownBaixa(STATUS_PACIENT_COD.therapy);
    setDropDownList(list);
  }, []);

  const verifiedBodyTemplate = (rowData: any): any => {
    return  rowData.baixa ? <i className="pi  text-green-400 pi-check-circle"></i> :  hasPermition(`AGENDA_BAIXA_UPDATE`) && (
      <div className="text-end">
        <ButtonHeron
          text="BAIXA"
          icon="pi pi-arrow-circle-down"
          type="second"
          size="full"
          onClick={()=> handleUpdate(rowData)}
        />
      </div>
    )
};

const deleteBodyTemplate = (rowData: any): any => {
  return hasPermition(`AGENDA_BAIXA_DELETE`) && (
    <div className="text-center">
      <ButtonHeron
        text="Excluir"
        icon="pi pi-trash"
        type="transparent"
        size="icon"
        color='red'
        onClick={()=> handleDelete(rowData)}
      />
    </div>
  )
};

  const ticketBodyTemplate = (rowData: any): any => (
    <Dropdown
      value={rowData.ticketId ?? null}
      options={dropDownList?.tickets}
      optionLabel="nome"
      optionValue="id"
      placeholder="Selecionar"
      showClear
      disabled={!hasPermition('AGENDA_BAIXA_UPDATE')}
      className="w-full"
      onChange={(e: any) => handleUpdateTicket(rowData, e.value ?? null)}
    />
  );

  const especialidadeColorMap = buildEspecialidadeColorMap(dropDownList?.especialidades);

  const especialidadeBodyTemplate = (rowData: any): any =>
    rowData.especialidade && rowData.especialidade !== '-' ? (
      <Tag
        type={rowData.especialidade}
        color={especialidadeColorMap[String(rowData.especialidade).toUpperCase()]}
        disabled={false}
      />
    ) : (
      <span>-</span>
    );

  useEffect(() => {
    handleSubmitFilter()
    renderDropdown();
  }, []);

  return (
    <div className="grid ">
      <Filter
        id="form-filter-patient"
        legend="Filtro"
        fields={fieldsConst}
        screen="FILA_DEVOLUTIVA"
        onSubmit={handleSubmitFilter}
        onReset={()=> handleSubmitFilter()}
        loading={loading}
        dropdown={dropDownList}
      />

      <Card>

      {
        baixas?.length ? <DataTable value={baixas} showGridlines >
            <Column field="paciente" header="Paciente" style={{ minWidth: '9rem', textAlign: 'start', fontSize: '0.5rem' }}></Column>
            <Column field="carteirinha" header="Carteirinha"></Column>
            <Column field="convenio" header="Convenio"></Column>
            <Column field="dataEvento" header="Data Evento"></Column>
            <Column field="especialidade" header="Especialidade" dataType="boolean" bodyClassName="text-center" headerStyle={{ textAlign: 'center' }}   body={especialidadeBodyTemplate} />
            <Column field="cargaHoraria" header="Carga Horária"></Column>
            <Column field="localidade" header="Local"></Column>
            <Column field="dataBaixa" header="Data/Hora Baixa"></Column>
            <Column field="usuario" header="Usuário"></Column>
            <Column field="ticket" header="Ticket" style={{ minWidth: '10rem' }} body={ticketBodyTemplate} />
            <Column field="baixa" header="Baixa" dataType="boolean" bodyClassName="text-center" headerStyle={{ textAlign: 'center' }}  body={verifiedBodyTemplate} />
            <Column field="excluir" header="Excluir" dataType="boolean" bodyClassName="text-center" headerStyle={{ textAlign: 'center' }}  body={deleteBodyTemplate} />
        </DataTable> : 
        <NotFound />
      }
      
        {pagination.totalPages > 1 && <PaginationComponent totalPages={pagination.totalPages}  currentPage={pagination.currentPage} onChange={handlePagination}/>}
      </Card>
    </div>
  );
}
