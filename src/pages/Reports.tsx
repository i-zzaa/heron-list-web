import { useEffect, useState } from 'react';
import { TabPanel, TabView } from 'primereact/tabview';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import * as XLSX from 'xlsx';

import { ButtonHeron, Filter } from '../components/index';
import { LoadingHeron } from '../components/loading';
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

type CampoDocumento = 'planoTerapeutico' | 'laudoMedico';
type StatusDocumento = 'vencido' | 'vence_em_breve' | 'em_dia';
type FiltroRapido = 'todos' | StatusDocumento | 'nao_emitido';

const DOCUMENTOS_RELATORIO: {
  tipo: string;
  campo: CampoDocumento;
  sigla: string;
}[] = [
  { tipo: 'plano_terapeutico', campo: 'planoTerapeutico', sigla: 'PT' },
  { tipo: 'laudo_medico', campo: 'laudoMedico', sigla: 'Laudo' },
];

// Documento a vencer dentro desse prazo ganha destaque de "atenção".
const DIAS_VENCE_EM_BREVE = 30;

// Na lista do celular os pacientes aparecem em blocos, em vez de paginados.
const PACIENTES_POR_BLOCO_MOBILE = 20;

// Mesmo visual de card do filtro (templates/filter).
const CARD_CLASS = 'bg-white rounded-xl border border-gray-200 shadow-heron';

const TONS_STATUS: Record<StatusDocumento, { badge: string; dot: string }> = {
  vencido: { badge: 'bg-red-400/10 text-[#b91c1c]', dot: 'bg-red-400' },
  vence_em_breve: { badge: 'bg-[#fef3c7] text-[#92400e]', dot: 'bg-[#f59e0b]' },
  em_dia: { badge: 'bg-green-400/10 text-[#15803d]', dot: 'bg-green-400' },
};

const FILTROS_RAPIDOS: {
  id: FiltroRapido;
  label: string;
  icon: string;
  tom: string;
}[] = [
  {
    id: 'todos',
    label: 'Pacientes',
    icon: 'pi pi-users',
    tom: 'bg-violet-800/10 text-violet-800',
  },
  {
    id: 'vencido',
    label: 'Com documento vencido',
    icon: 'pi pi-times-circle',
    tom: TONS_STATUS.vencido.badge,
  },
  {
    id: 'vence_em_breve',
    label: `Vencem em até ${DIAS_VENCE_EM_BREVE} dias`,
    icon: 'pi pi-clock',
    tom: TONS_STATUS.vence_em_breve.badge,
  },
  {
    id: 'nao_emitido',
    label: 'Sem documento emitido',
    icon: 'pi pi-file',
    tom: 'bg-background text-gray-800',
  },
];

const getTipoDocumentoLabel = (tipo: string) =>
  TIPO_DOCUMENTO_OPTIONS.find((option) => option.id === tipo)?.nome || tipo;

const getStatusDocumento = (documento: DocumentoResumo): StatusDocumento => {
  if (documento.vencido) return 'vencido';
  return documento.diasParaVencer <= DIAS_VENCE_EM_BREVE
    ? 'vence_em_breve'
    : 'em_dia';
};

const getSituacaoLabel = (documento: DocumentoResumo) => {
  const dias = Math.abs(documento.diasParaVencer);
  const sufixo = dias === 1 ? 'dia' : 'dias';

  if (documento.vencido) {
    return dias === 0 ? 'Venceu hoje' : `Vencido há ${dias} ${sufixo}`;
  }
  if (dias === 0) return 'Vence hoje';
  if (dias === 1) return 'Vence amanhã';
  return `Vence em ${dias} ${sufixo}`;
};

function SituacaoBadge({ documento }: { documento: DocumentoResumo | null }) {
  if (!documento) {
    return (
      <span className="inline-flex items-center gap-1.5 w-fit px-2 py-0.5 rounded-full border border-dashed border-gray-300 text-md text-gray-800 whitespace-nowrap">
        Não emitido
      </span>
    );
  }

  const tom = TONS_STATUS[getStatusDocumento(documento)];

  return (
    <span
      className={`inline-flex items-center gap-1.5 w-fit px-2 py-0.5 rounded-full text-md font-bold whitespace-nowrap ${tom.badge}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${tom.dot}`} />
      {getSituacaoLabel(documento)}
    </span>
  );
}

function DocumentoCelula({ documento }: { documento: DocumentoResumo | null }) {
  return (
    <div className="flex flex-col gap-1">
      <SituacaoBadge documento={documento} />
      {documento && (
        // Em tela estreita a emissão desce pra linha de baixo em vez de
        // estourar a largura do cartão.
        <span className="flex flex-wrap gap-x-1 font-inter text-md text-gray-800">
          <span className="whitespace-nowrap">
            {documento.vencido ? 'Venceu' : 'Vence'}{' '}
            {formatdate(documento.dataVencimento)}
          </span>
          <span className="whitespace-nowrap text-gray-400">
            · Emitido {formatdate(documento.dataEmissao)}
          </span>
        </span>
      )}
    </div>
  );
}

interface EstadoVazioProps {
  icon: string;
  titulo: string;
  descricao: string;
  children?: JSX.Element;
}

function EstadoVazio({ icon, titulo, descricao, children }: EstadoVazioProps) {
  return (
    <div className="flex flex-col items-center text-center gap-2 px-6 py-12">
      <span className="w-12 h-12 mb-1 flex items-center justify-center rounded-full bg-violet-800/10 text-violet-800">
        <i className={icon} style={{ fontSize: 18 }} />
      </span>
      <h3 className="text-[15px] font-bold text-gray-800">{titulo}</h3>
      <p className="max-w-sm text-md text-gray-800">{descricao}</p>
      {children}
    </div>
  );
}

export default function Reports() {
  const [loading, setLoading] = useState<boolean>(false);
  const [dropDownList, setDropDownList] = useState<any>({});
  const [registros, setRegistros] = useState<RelatorioPacienteItem[]>([]);
  // Diferencia "ainda não pesquisou" de "pesquisou e não veio nada".
  const [pesquisou, setPesquisou] = useState<boolean>(false);
  // Tipo da última pesquisa (não o valor atual do filtro): decide quais
  // colunas a tabela mostra pro resultado que está na tela.
  const [tipoPesquisado, setTipoPesquisado] = useState<string | null>(null);
  const [filtroRapido, setFiltroRapido] = useState<FiltroRapido>('todos');
  const [quantidadeMobile, setQuantidadeMobile] = useState(
    PACIENTES_POR_BLOCO_MOBILE
  );

  const { hasPermition } = permissionAuth();
  const { renderDropdownReport } = useDropdown();
  const { renderToast } = useToast();

  const { activeIndex, setActiveIndex } = usePersistedTabIndex(
    'tab-index-relatorios'
  );

  const documentosVisiveis = DOCUMENTOS_RELATORIO.filter(
    (documento) => !tipoPesquisado || documento.tipo === tipoPesquisado
  );

  const atendeFiltro = (
    registro: RelatorioPacienteItem,
    filtro: FiltroRapido
  ) => {
    if (filtro === 'todos') return true;

    return documentosVisiveis.some(({ campo }) => {
      const documento = registro[campo];
      if (filtro === 'nao_emitido') return !documento;
      return !!documento && getStatusDocumento(documento) === filtro;
    });
  };

  const registrosFiltrados = registros.filter((registro) =>
    atendeFiltro(registro, filtroRapido)
  );

  const limparResultado = () => {
    setRegistros([]);
    setPesquisou(false);
    setFiltroRapido('todos');
  };

  const handleSubmitPtLaudos = async (formState: any) => {
    setLoading(true);
    setFiltroRapido('todos');
    setQuantidadeMobile(PACIENTES_POR_BLOCO_MOBILE);
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
      setPesquisou(true);
    } catch (error) {
      setRegistros([]);
      renderToast(
        buildErrorToast(error, 'Não foi possível carregar o relatório.')
      );
    } finally {
      setLoading(false);
    }
  };

  // Exporta o que está na tela: se um card do resumo estiver selecionado,
  // a planilha sai só com esses pacientes.
  const gerarExcel = () => {
    const workbook = XLSX.utils.book_new();

    const planilha = XLSX.utils.json_to_sheet(
      registrosFiltrados.map((registro) => {
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
            : 'Não emitido';
        });

        return linha;
      })
    );

    XLSX.utils.book_append_sheet(workbook, planilha, 'PT-Laudos');
    XLSX.writeFile(workbook, 'Relatório PT-Laudos.xlsx');
  };

  const renderResumo = () => (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {FILTROS_RAPIDOS.map((filtro) => {
        const ativo = filtroRapido === filtro.id;
        const total = registros.filter((registro) =>
          atendeFiltro(registro, filtro.id)
        ).length;

        return (
          <button
            key={filtro.id}
            type="button"
            aria-pressed={ativo}
            data-testid={`relatorio-resumo-${filtro.id}`}
            onClick={() => {
              setFiltroRapido(ativo ? 'todos' : filtro.id);
              setQuantidadeMobile(PACIENTES_POR_BLOCO_MOBILE);
            }}
            className={`${CARD_CLASS} flex items-center gap-3 p-3 sm:p-4 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 ${
              ativo
                ? 'border-violet-800 ring-1 ring-violet-800'
                : 'hover:border-violet-600'
            }`}
          >
            <span
              className={`hidden sm:flex w-10 h-10 shrink-0 items-center justify-center rounded-lg ${filtro.tom}`}
            >
              <i className={filtro.icon} />
            </span>
            <span className="min-w-0">
              <span className="block font-inter text-xl leading-none font-bold text-gray-800">
                {total}
              </span>
              <span className="block mt-1 text-md text-gray-800 leading-tight">
                {filtro.label}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );

  // Coluna do documento: emissão e vencimento em texto corrido, como antes
  // do novo tema — a situação fica na coluna ao lado, não empilhada aqui.
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

  const renderTabela = () => (
    <div className="hidden md:block">
      <DataTable
        value={registrosFiltrados}
        responsiveLayout="scroll"
        paginator={registrosFiltrados.length > 20}
        rows={20}
      >
        <Column sortable field="pacienteNome" header="Paciente" />
        <Column
          sortable
          field="convenio"
          header="Convênio"
          body={(registro: RelatorioPacienteItem) => registro.convenio || '-'}
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
  );

  const renderListaMobile = () => (
    <div className="md:hidden">
      <ul className="divide-y divide-gray-200">
        {registrosFiltrados.slice(0, quantidadeMobile).map((registro) => (
          <li key={registro.pacienteId} className="px-4 py-4">
            <p className="text-[14px] font-bold text-gray-800">
              {registro.pacienteNome}
            </p>
            <p className="text-md text-gray-800">
              {registro.convenio || 'Sem convênio'}
            </p>

            <div className="grid gap-3 mt-3">
              {documentosVisiveis.map(({ tipo, campo }) => (
                <div key={tipo} className="rounded-lg bg-background px-3 py-2">
                  <p className="text-md font-bold text-violet-800 mb-1">
                    {getTipoDocumentoLabel(tipo)}
                  </p>
                  <DocumentoCelula documento={registro[campo]} />
                </div>
              ))}
            </div>
          </li>
        ))}
      </ul>

      {registrosFiltrados.length > quantidadeMobile && (
        <div className="px-4 pb-4">
          <ButtonHeron
            text={`Mostrar mais (${
              registrosFiltrados.length - quantidadeMobile
            } restantes)`}
            icon="pi pi-angle-down"
            type="outline"
            size="full"
            onClick={() =>
              setQuantidadeMobile((atual) => atual + PACIENTES_POR_BLOCO_MOBILE)
            }
          />
        </div>
      )}
    </div>
  );

  const renderResultado = () => {
    if (loading) {
      return (
        <section className={CARD_CLASS}>
          <LoadingHeron />
        </section>
      );
    }

    if (!pesquisou) {
      return (
        <section className={CARD_CLASS}>
          <EstadoVazio
            icon="pi pi-search"
            titulo="Monte o seu relatório"
            descricao="Preencha ao menos um filtro e clique em Pesquisar para ver os planos terapêuticos e laudos médicos dos pacientes."
          />
        </section>
      );
    }

    if (!registros.length) {
      return (
        <section className={CARD_CLASS}>
          <EstadoVazio
            icon="pi pi-folder-open"
            titulo="Nenhum paciente encontrado"
            descricao="Não há documentos para os filtros escolhidos. Tente ampliar o período ou remover algum filtro."
          />
        </section>
      );
    }

    const nomesDocumentos = documentosVisiveis
      .map(({ tipo }) => getTipoDocumentoLabel(tipo))
      .join(' e ');

    return (
      <>
        {renderResumo()}

        <section className={`${CARD_CLASS} overflow-hidden`}>
          <header className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 sm:px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3 min-w-0 sm:mr-auto">
              <span className="w-9 h-9 shrink-0 flex items-center justify-center rounded-lg bg-violet-800/10 text-violet-800">
                <i className="pi pi-file" />
              </span>
              <div className="min-w-0">
                <h2 className="text-[15px] font-bold text-violet-800">
                  {nomesDocumentos}
                </h2>
                <p
                  className="text-md text-gray-800"
                  data-testid="relatorio-contagem"
                >
                  {filtroRapido === 'todos'
                    ? `${registros.length} ${
                        registros.length === 1 ? 'paciente' : 'pacientes'
                      }`
                    : `Mostrando ${registrosFiltrados.length} de ${registros.length} pacientes`}
                </p>
              </div>
            </div>

            <div className="w-full sm:w-auto sm:min-w-[10rem]">
              <ButtonHeron
                text="Exportar Excel"
                icon="pi pi-download"
                type="outline"
                size="full"
                disabled={!registrosFiltrados.length}
                onClick={gerarExcel}
              />
            </div>
          </header>

          {registrosFiltrados.length ? (
            <>
              {renderTabela()}
              {renderListaMobile()}
            </>
          ) : (
            <EstadoVazio
              icon="pi pi-check-circle"
              titulo="Nenhum paciente nessa situação"
              descricao="Nenhum paciente do resultado se encaixa no card selecionado."
            >
              <button
                type="button"
                onClick={() => setFiltroRapido('todos')}
                className="mt-2 text-md font-bold text-violet-800 hover:underline"
              >
                Ver todos os pacientes
              </button>
            </EstadoVazio>
          )}
        </section>
      </>
    );
  };

  const renderScreenPtLaudos = () => {
    return (
      <div className="grid grid-cols-1 gap-4">
        <Filter
          id="form-filter-pt-laudos"
          legend="Filtro"
          fields={filterPtLaudosFields}
          screen="RELATORIOS_PT_LAUDOS"
          onSubmit={handleSubmitPtLaudos}
          onReset={limparResultado}
          loading={loading}
          dropdown={dropDownList}
          requireFilledField
          defaultOpen
        />

        {renderResultado()}
      </div>
    );
  };

  useEffect(() => {
    const loadDropdown = async () => {
      setDropDownList(await renderDropdownReport());
    };

    loadDropdown();
  }, []);

  return (
    // grid-cols-1 (minmax(0, 1fr)) impede que o conteúdo largo estoure a
    // tela no celular.
    <div className="grid grid-cols-1 gap-8">
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
