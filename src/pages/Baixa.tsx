import { useCallback, useEffect, useState } from 'react';
import { filter, update } from '../server';

import { useToast } from '../contexts/toast';
import { permissionAuth } from '../contexts/permission';
import { useAuth } from '../contexts/auth';
import { Card, Filter,ButtonHeron } from '../components/index';
import { useDropdown } from '../contexts/dropDown';

import { filterBaixaFields } from '../constants/formFields';
import PaginationComponent from '../components/Pagination';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { STATUS_PACIENT_COD } from '../constants/patient';
import { NotFound } from '../components/notFound';
import { Tag } from '../components/tag';

const fieldsConst = filterBaixaFields;
const fieldsState: any = {};
fieldsConst.forEach((field: any) => (fieldsState[field.id] = ''));

export default function Baixa() {
  const { user } = useAuth()
  const { hasPermition } = permissionAuth();
  const [baixas, setBaixas] = useState<any[]>();

  const [filterCurrent, setFilter] = useState<any>({});
  const [pagination, setPagination] = useState<any>({
    currentPage: 1,
    pageSize: 10,
    totalPages: 0,
  });

  const [loading, setLoading] = useState<boolean>(false);

  const [dropDownList, setDropDownList] = useState<any>([]);
  const { renderDropdownBaixa } = useDropdown();

  const { renderToast } = useToast();

  const handlePagination = async (pag: any) => {
    setPagination(pag)
    handleSubmitFilter()
  }

  const handleSubmitFilter = async (formState: any = filterCurrent) => {
    setLoading(true);
    setFilter(formState)

    const format: any = {
      baixa: formState.baixa === undefined ? false : formState.baixa,
    };
    delete formState.baixa;

    await Object.keys(formState).map((key: any) => {
      format[key] = formState[key]?.id || undefined;
    });

    const { data }: any = await filter('baixa', format, `page=${pagination.currentPage}&pageSize=${pagination.pageSize}`);
    setBaixas(data.data || data.data.data);
    setPagination(data.pagination || data.data.pagination)
    setLoading(false);
  };

  const handleUpdate = async (rowData: any) => {
    try {
      await update('baixa', {id: rowData.id, usuarioId: user.id});
      handleSubmitFilter();
    } catch (response: any) {
      renderToast({
        type: 'failure',
        title: '401',
        message: response.data.message,
        open: true,
      });
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

const especialidadeBodyTemplate = (rowData: any): any =>  <Tag type={rowData.especialidade} disabled={false} />

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
            <Column field="paciente" header="Paciente"></Column>
            <Column field="carteirinha" header="Carteirinha"></Column>
            <Column field="convenio" header="Convenio"></Column>
            <Column field="dataEvento" header="Data Evento"></Column>
            <Column field="especialidade" header="Especialidade" dataType="boolean" bodyClassName="text-center" headerStyle={{ textAlign: 'center' }}  style={{ minWidth: '8rem', textAlign: 'center' }} body={especialidadeBodyTemplate} />
            <Column field="cargaHoraria" header="Carga Horária"></Column>
            <Column field="localidade" header="Local"></Column>
            <Column field="dataBaixa" header="Data/Hora Baixa"></Column>
            <Column field="usuario" header="Usuário"></Column>
            <Column field="baixa" header="Baixa" dataType="boolean" bodyClassName="text-center" headerStyle={{ textAlign: 'center' }}  style={{ minWidth: '8rem', textAlign: 'center' }} body={verifiedBodyTemplate} />
        </DataTable> : 
        <NotFound />
      }
      
        {pagination.totalPages > 1 && <PaginationComponent totalPages={pagination.totalPages}  currentPage={pagination.currentPage} onChange={handlePagination}/>}
      </Card>
    </div>
  );
}
