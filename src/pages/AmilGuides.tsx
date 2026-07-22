import { useEffect, useMemo, useState } from 'react';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import moment from 'moment';

import { ButtonHeron, Card, Filter, Modal, Title } from '../components/index';
import { LoadingHeron } from '../components/loading';
import { NotFound } from '../components/notFound';
import PaginationComponent from '../components/Pagination';
import { useToast } from '../contexts/toast';
import { actionAmilGuide, filterAmilGuides, getAmilGuideDropdowns } from '../server';

interface AmilGuideItem {
  id?: number;
  protocolo?: string;
  numeroGuia?: string;
  numeroSolicitacao?: string;
  status?: string;
  dataEnvio?: string;
  dataAtualizacao?: string;
  pacienteNome?: string;
  paciente?: {
    nome?: string;
    cpf?: string;
  };
  observacao?: string;
  codigoAutorizacao?: string;
  linkAcompanhamento?: string;
  valor?: number;
  origem?: string;
  detalhes?: Record<string, any>;
}

const formatDate = (value?: string) => {
  if (!value) return '-';
  const date = moment(value);
  return date.isValid() ? date.format('DD/MM/YYYY HH:mm') : value;
};

const getStatusClass = (status?: string) => {
  const normalized = (status || '').toLowerCase();

  if (normalized.includes('aprov') || normalized.includes('autoriz')) {
    return 'bg-emerald-100 text-emerald-700';
  }

  if (normalized.includes('erro') || normalized.includes('falha')) {
    return 'bg-red-100 text-red-700';
  }

  if (normalized.includes('pend') || normalized.includes('aguard')) {
    return 'bg-amber-100 text-amber-700';
  }

  return 'bg-slate-100 text-slate-700';
};

const filterFields = [
  {
    permission: 'GUIAS_AMIL',
    labelText: 'Número da guia',
    id: 'numeroGuia',
    name: 'numeroGuia',
    customCol: 'col-span-6 sm:col-span-3',
    type: 'text',
  },
  {
    permission: 'GUIAS_AMIL',
    labelText: 'Número do lote',
    id: 'numeroLote',
    name: 'numeroLote',
    customCol: 'col-span-6 sm:col-span-3',
    type: 'text',
  },
  {
    permission: 'GUIAS_AMIL',
    labelText: 'Protocolo',
    id: 'protocolo',
    name: 'protocolo',
    customCol: 'col-span-6 sm:col-span-3',
    type: 'text',
  },
  {
    permission: 'GUIAS_AMIL',
    labelText: 'Paciente',
    id: 'paciente',
    name: 'pacientes',
    customCol: 'col-span-6 sm:col-span-3',
    type: 'select',
  },
  {
    permission: 'GUIAS_AMIL',
    labelText: 'Status',
    id: 'status',
    name: 'status',
    customCol: 'col-span-6 sm:col-span-3',
    type: 'select',
  },
  {
    permission: 'GUIAS_AMIL',
    labelText: 'Origem',
    id: 'origem',
    name: 'origens',
    customCol: 'col-span-6 sm:col-span-3',
    type: 'select',
  },
  {
    permission: 'GUIAS_AMIL',
    labelText: 'Data início',
    id: 'dataInicio',
    name: 'dataInicio',
    customCol: 'col-span-6 sm:col-span-3',
    type: 'date',
  },
  {
    permission: 'GUIAS_AMIL',
    labelText: 'Data fim',
    id: 'dataFim',
    name: 'dataFim',
    customCol: 'col-span-6 sm:col-span-3',
    type: 'date',
  },
];

export default function AmilGuides() {
  const [guides, setGuides] = useState<AmilGuideItem[]>([]);
  const [selectedGuide, setSelectedGuide] = useState<AmilGuideItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState({
    total: 0,
    enviados: 0,
    pendentes: 0,
    comErro: 0,
  });
  const [openModal, setOpenModal] = useState(false);
  const [filterState, setFilterState] = useState<Record<string, any>>({});
  const [pagination, setPagination] = useState<any>({
    pageSize: 10,
    totalPages: 0,
    currentPage: 1,
  });
  const [dropdown, setDropdown] = useState<Record<string, any[]>>({
    pacientes: [],
    status: [],
    origens: [],
  });

  const { renderToast } = useToast();

  const loadGuides = async (
    currentFilter: Record<string, any> = filterState,
    pag = pagination
  ) => {
    setLoading(true);
    try {
      const format: Record<string, any> = {};

      Object.entries(currentFilter).forEach(([key, value]) => {
        if (value === '' || value === null || value === undefined) {
          return;
        }

        const normalizedValue =
          value && typeof value === 'object' && 'target' in value && value.target?.value !== undefined
            ? value.target.value
            : value && typeof value === 'object' && 'value' in value && value.value !== undefined
              ? value.value
              : value?.id || value;

        format[key] = normalizedValue;
      });

      const response: any = await filterAmilGuides(
        format,
        pag.currentPage || 1,
        pag.pageSize || 10
      );
      const payload = response?.data?.data ?? response?.data ?? [];
      const items = Array.isArray(payload) ? payload : payload.items ?? [];
      const metrics = response?.pagination ?? response?.meta ?? response?.data?.pagination ?? {};
      const summaryFromBackend = response?.summary || response?.resumo || response?.data?.summary || response?.data?.resumo || {};
      const totalItems = Number(metrics.total ?? summaryFromBackend.total ?? items.length ?? 0);
      const pageSize = Number(metrics.limit ?? pag.pageSize ?? 10);
      const totalPages = Number(metrics.totalPages || Math.ceil(totalItems / pageSize) || 0);

      setGuides(items);
      setSummary({
        total: Number(summaryFromBackend.total ?? totalItems ?? 0),
        enviados: Number(summaryFromBackend.enviados ?? summaryFromBackend.enviadas ?? 0),
        pendentes: Number(summaryFromBackend.pendentes ?? summaryFromBackend.aguardando ?? 0),
        comErro: Number(summaryFromBackend.comErro ?? summaryFromBackend.erros ?? 0),
      });
      setPagination({
        ...pag,
        currentPage: Number(metrics.page ?? pag.currentPage ?? 1),
        pageSize,
        totalPages,
      });
    } catch (error: any) {
      setGuides([]);
      renderToast({
        type: 'failure',
        title: 'Falha ao consultar guias',
        message: error?.message || 'Não foi possível carregar as guias no momento.',
        open: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePagination = async (pag: number) => {
    const nextPagination = {
      ...pagination,
      currentPage: pag,
    };

    setPagination(nextPagination);
    loadGuides(filterState, nextPagination);
  };

  const handleFilter = (formState: Record<string, any>) => {
    setFilterState(formState);
    const nextPagination = {
      ...pagination,
      currentPage: 1,
    };

    setPagination(nextPagination);
    loadGuides(formState, nextPagination);
  };

  const handleReset = () => {
    setFilterState({});
    const nextPagination = {
      ...pagination,
      currentPage: 1,
    };

    setPagination(nextPagination);
    loadGuides({}, nextPagination);
  };

  const handleResend = async (guide: AmilGuideItem) => {
    if (!guide?.id) return;

    try {
      const response: any = await actionAmilGuide(guide.id, 'reenviar');
      const message = response?.data?.message || 'Reenvio solicitado com sucesso.';
      renderToast({
        type: 'success',
        title: 'Guia atualizada',
        message,
        open: true,
      });
      loadGuides(filterState);
    } catch (error: any) {
      renderToast({
        type: 'failure',
        title: 'Não foi possível reenviar',
        message: error?.message || 'Tente novamente em alguns instantes.',
        open: true,
      });
    }
  };

  const openDetail = (guide: AmilGuideItem) => {
    setSelectedGuide(guide);
    setOpenModal(true);
  };

  const loadDropdowns = async () => {
    try {
      const response = await getAmilGuideDropdowns();
      const normalized = {
        pacientes: response?.pacientes || [],
        status: response?.status || [],
        origens: response?.origens || [],
      };

      setDropdown(normalized);
    } catch (error) {
      setDropdown({ pacientes: [], status: [], origens: [] });
    }
  };

  useEffect(() => {
    loadGuides({}, pagination);
    loadDropdowns();
  }, []);

  const summaryCards = useMemo(
    () => [
      {
        label: 'Total',
        value: summary.total,
        icon: 'pi pi-file ',
      },
      {
        label: 'Enviadas',
        value: summary.enviados,
        icon: 'pi pi-check-circle text-green-400' ,
      },
      {
        label: 'Pendentes',
        value: summary.pendentes,
        icon: 'pi pi-clock text-yellow-400',
      },
      {
        label: 'Com erro',
        value: summary.comErro,
        icon: 'pi pi-exclamation-circle text-red-400',
      },
    ],
    [summary]
  );

  return (
    <div className="grid gap-4">
      <Filter
        id="filter-amil-guides"
        legend="Filtro"
        fields={filterFields}
        screen="GUIAS_AMIL"
        loading={loading}
        onSubmit={handleFilter}
        onReset={handleReset}
        dropdown={dropdown}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((item) => (
          <Card key={item.label}>
            <div className="flex gap-4 items-center">
              <i className={`${item.icon} text-violet-700`} />
              <div className="grid">
                <span className="text-gray-600 text-sm">{item.label}</span>
                <span className="font-inter">{item.value}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        {loading ? (
          <LoadingHeron />
        ) : guides.length ? (
          <div className="overflow-x-auto">
            <DataTable value={guides} responsiveLayout="scroll" emptyMessage="Nenhuma guia encontrada.">
              <Column
                field="numeroGuia"
                header="Guia"
                body={(rowData: AmilGuideItem) => (
                  <div className="min-w-[180px]">
                    <div className="font-semibold text-violet-800">
                      {rowData.numeroGuia || rowData.protocolo || 'Sem número'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {rowData.numeroSolicitacao || rowData.codigoAutorizacao || '-'}
                    </div>
                  </div>
                )}
              />
              <Column
                field="paciente"
                header="Paciente"
                body={(rowData: AmilGuideItem) => (
                  <div className="min-w-[220px]">
                    <div className="font-medium">{rowData.paciente?.nome || rowData.pacienteNome || '-'}</div>
                    <div className="text-xs text-gray-500">{rowData.paciente?.cpf || '-'}</div>
                  </div>
                )}
              />
              <Column
                field="status"
                header="Status"
                body={(rowData: AmilGuideItem) => (
                  <span className={`rounded-full px-2 py-1 text-xs font-semibold ${getStatusClass(rowData.status)}`}>
                    {rowData.status || 'Não informado'}
                  </span>
                )}
              />
              <Column
                field="dataEnvio"
                header="Envio"
                body={(rowData: AmilGuideItem) => <span className="font-inter">{formatDate(rowData.dataEnvio)}</span>}
              />
              <Column
                field="dataAtualizacao"
                header="Atualização"
                body={(rowData: AmilGuideItem) => <span className="font-inter">{formatDate(rowData.dataAtualizacao)}</span>}
              />
              <Column
                header="Ações"
                body={(rowData: AmilGuideItem) => (
                  <div className="flex flex-wrap gap-2 min-w-[220px]">
                    <ButtonHeron text="Detalhes" icon="pi pi-eye" type="second" size="sm" onClick={() => openDetail(rowData)} />
                    <ButtonHeron text="Reenviar" icon="pi pi-refresh" type="primary" size="sm" onClick={() => handleResend(rowData)} />
                  </div>
                )}
              />
            </DataTable>
          </div>
        ) : (
          <div className="py-10">
            <NotFound />
          </div>
        )}
      </Card>

      {pagination.totalPages > 1 && (
        <PaginationComponent
          totalPages={pagination.totalPages}
          currentPage={pagination.currentPage}
          onChange={handlePagination}
        />
      )}

      <Modal title="Detalhes da guia" open={openModal} onClose={() => setOpenModal(false)}>
        {selectedGuide ? (
          <div className="grid gap-3 text-sm text-gray-700">
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <span className="text-gray-500 block">Número</span>
                <strong>{selectedGuide.numeroGuia || selectedGuide.protocolo || '-'}</strong>
              </div>
              <div>
                <span className="text-gray-500 block">Status</span>
                <strong>{selectedGuide.status || '-'}</strong>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <span className="text-gray-500 block">Paciente</span>
                <strong>{selectedGuide.paciente?.nome || selectedGuide.pacienteNome || '-'}</strong>
              </div>
              <div>
                <span className="text-gray-500 block">CPF</span>
                <strong>{selectedGuide.paciente?.cpf || '-'}</strong>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <span className="text-gray-500 block">Data de envio</span>
                <strong>{formatDate(selectedGuide.dataEnvio)}</strong>
              </div>
              <div>
                <span className="text-gray-500 block">Última atualização</span>
                <strong>{formatDate(selectedGuide.dataAtualizacao)}</strong>
              </div>
            </div>
            <div>
              <span className="text-gray-500 block">Observação</span>
              <strong>{selectedGuide.observacao || '-'}</strong>
            </div>
            <div>
              <span className="text-gray-500 block">Link de acompanhamento</span>
              <strong>{selectedGuide.linkAcompanhamento || '-'}</strong>
            </div>
            <div>
              <span className="text-gray-500 block">Detalhes adicionais</span>
              <pre className="whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-xs">
                {JSON.stringify(selectedGuide.detalhes || selectedGuide, null, 2)}
              </pre>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
