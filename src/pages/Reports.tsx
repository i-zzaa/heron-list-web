import { useEffect, useState } from 'react';
import { TabPanel, TabView } from 'primereact/tabview';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import * as XLSX from 'xlsx';

import { ButtonHeron, Card, Filter } from '../components/index';
import { LoadingHeron } from '../components/loading';
import { NotFound } from '../components/notFound';
import { useDropdown } from '../contexts/dropDown';
import { permissionAuth } from '../contexts/permission';
import { useToast } from '../contexts/toast';
import { usePersistedTabIndex } from '../hooks/usePersistedTabIndex';
import { getPost } from '../server';
import { buildErrorToast } from '../util/error';
import { resolveResponseData } from '../util/pagination';
import { formatdate } from '../util/util';
import {
  filterPtLaudosFields,
  TIPO_DOCUMENTO_OPTIONS,
} from '../constants/report';

interface DocumentoResumo {
  dataEmissao: string;
  dataVencimento: string;
  vencido: boolean;
  diasParaVencer: number;
}

// Uma linha por paciente; o documento que não foi pesquisado (ou que o
// paciente não tem emitido) vem null.
interface RelatorioPacienteItem {
  pacienteId: number;
  pacienteNome: string;
  convenio: string | null;
  planoTerapeutico: DocumentoResumo | null;
  laudoMedico: DocumentoResumo | null;
}

const DOCUMENTOS_RELATORIO: {
  tipo: string;
  campo: 'planoTerapeutico' | 'laudoMedico';
  sigla: string;
}[] = [
  { tipo: 'plano_terapeutico', campo: 'planoTerapeutico', sigla: 'PT' },
  { tipo: 'laudo_medico', campo: 'laudoMedico', sigla: 'Laudo' },
];

const getTipoDocumentoLabel = (tipo: string) =>
  TIPO_DOCUMENTO_OPTIONS.find((option) => option.id === tipo)?.nome || tipo;

const getSituacaoLabel = (documento: DocumentoResumo) =>
  documento.vencido
    ? `Vencido há ${Math.abs(documento.diasParaVencer)} dia(s)`
    : `Vence em ${documento.diasParaVencer} dia(s)`;

export default function Reports() {
  const [loading, setLoading] = useState<boolean>(false);
  const [dropDownList, setDropDownList] = useState<any>({});
  const [registros, setRegistros] = useState<RelatorioPacienteItem[]>([]);
  // Tipo da última pesquisa (não o valor atual do filtro): decide quais
  // colunas a tabela mostra pro resultado que está na tela.
  const [tipoPesquisado, setTipoPesquisado] = useState<string | null>(null);

  const { hasPermition } = permissionAuth();
  const { renderDropdownReport } = useDropdown();
  const { renderToast } = useToast();

  const { activeIndex, setActiveIndex } =
    usePersistedTabIndex('tab-index-relatorios');

  const documentosVisiveis = DOCUMENTOS_RELATORIO.filter(
    (documento) => !tipoPesquisado || documento.tipo === tipoPesquisado
  );

  const handleSubmitPtLaudos = async (formState: any) => {
    setLoading(true);
    try {
      const tipo = formState?.tipo?.id || undefined;
      const response = await getPost('paciente/relatorio-documentos', {
        tipo,
        convenioId: formState?.convenioId?.id || undefined,
        situacao: formState?.situacao?.id || undefined,
        dataInicio: formState?.dataInicio || undefined,
        dataFim: formState?.dataFim || undefined,
      });
      setTipoPesquisado(tipo || null);
      setRegistros(resolveResponseData(response?.data) || []);
    } catch (error) {
      setRegistros([]);
      renderToast(
        buildErrorToast(error, 'Não foi possível carregar o relatório.')
      );
    } finally {
      setLoading(false);
    }
  };

  const gerarExcel = () => {
    const workbook = XLSX.utils.book_new();

    const planilha = XLSX.utils.json_to_sheet(
      registros.map((registro) => {
        const linha: Record<string, string> = {
          Paciente: registro.pacienteNome,
          Convênio: registro.convenio || '-',
        };

        documentosVisiveis.forEach(({ campo, sigla }) => {
          const documento = registro[campo];
          linha[`Emissão ${sigla}`] = documento
            ? formatdate(documento.dataEmissao)
            : '-';
          linha[`Vencimento ${sigla}`] = documento
            ? formatdate(documento.dataVencimento)
            : '-';
          linha[`Situação ${sigla}`] = documento
            ? getSituacaoLabel(documento)
            : '-';
        });

        return linha;
      })
    );

    XLSX.utils.book_append_sheet(workbook, planilha, 'PT-Laudos');
    XLSX.writeFile(workbook, 'Relatório PT-Laudos.xlsx');
  };

  const renderDocumento = (documento: DocumentoResumo | null) => {
    if (!documento) {
      return <span className="text-gray-400">Não emitido</span>;
    }

    return (
      <span className="font-inter text-sm">
        Emissão {formatdate(documento.dataEmissao)} · Vencimento{' '}
        {formatdate(documento.dataVencimento)}
      </span>
    );
  };

  const renderSituacao = (documento: DocumentoResumo | null) => {
    if (!documento) {
      return <span className="text-gray-400">-</span>;
    }

    return (
      <span
        className={`w-fit px-2 py-1 rounded text-xs whitespace-nowrap ${
          documento.vencido
            ? 'bg-red-400/10 text-red-400'
            : 'bg-green-400/10 text-green-600'
        }`}
      >
        {getSituacaoLabel(documento)}
      </span>
    );
  };

  const renderScreenPtLaudos = () => {
    return (
      <>
        <Filter
          id="form-filter-pt-laudos"
          legend="Filtro"
          fields={filterPtLaudosFields}
          screen="RELATORIOS_PT_LAUDOS"
          onSubmit={handleSubmitPtLaudos}
          onReset={() => setRegistros([])}
          loading={loading}
          dropdown={dropDownList}
          requireFilledField
          defaultOpen
        />

        <Card>
          <div className="flex justify-center">
            {loading ? (
              <LoadingHeron />
            ) : registros.length ? (
              <div className="w-full text-md">
                <div className="sm:text-end mb-4">
                  <ButtonHeron
                    text="Download Excel"
                    icon="pi pi-download"
                    type="primary"
                    size="sm"
                    onClick={gerarExcel}
                  />
                </div>

                <DataTable
                  value={registros}
                  responsiveLayout="scroll"
                  paginator
                  rows={20}
                >
                  <Column sortable field="pacienteNome" header="Paciente" />
                  <Column
                    sortable
                    field="convenio"
                    header="Convênio"
                    body={(registro: RelatorioPacienteItem) =>
                      registro.convenio || '-'
                    }
                  />
                  {documentosVisiveis.flatMap(({ tipo, campo, sigla }) => [
                    <Column
                      key={tipo}
                      sortable
                      field={`${campo}.dataVencimento`}
                      header={getTipoDocumentoLabel(tipo)}
                      body={(registro: RelatorioPacienteItem) =>
                        renderDocumento(registro[campo])
                      }
                    />,
                    <Column
                      key={`${tipo}-situacao`}
                      sortable
                      field={`${campo}.diasParaVencer`}
                      header={`Situação ${sigla}`}
                      body={(registro: RelatorioPacienteItem) =>
                        renderSituacao(registro[campo])
                      }
                    />,
                  ])}
                </DataTable>
              </div>
            ) : (
              <NotFound />
            )}
          </div>
        </Card>
      </>
    );
  };

  useEffect(() => {
    const loadDropdown = async () => {
      setDropDownList(await renderDropdownReport());
    };

    loadDropdown();
  }, []);

  return (
    <div className="grid gap-8">
      <TabView
        className="tabview-custom"
        activeIndex={activeIndex}
        onTabChange={(e) => setActiveIndex(e.index)}
      >
        {hasPermition('RELATORIOS_PT_LAUDOS') ? (
          <TabPanel header="PT/Laudos" leftIcon="pi pi-file">
            {renderScreenPtLaudos()}
          </TabPanel>
        ) : null}
      </TabView>
    </div>
  );
}
