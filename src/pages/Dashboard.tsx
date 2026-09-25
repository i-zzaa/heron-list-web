import { ReactNode, useEffect, useRef, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';

import { getList } from '../server';
import { LoadingHeron } from '../components/loading';
import { permissionAuth } from '../contexts/permission';
import { useToast } from '../contexts/toast';
import { buildErrorToast } from '../util/error';
import { resolveResponseData } from '../util/pagination';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  ArcElement
);

// ---------------------------------------------------------------------
// Parsing defensivo
//
// Esses 9 endpoints (/dashboard/*) acabaram de ser publicados pelo backend
// e não deu pra confirmar o formato exato de resposta de cada um ao vivo no
// momento da implementação. Os nomes de campo abaixo são a melhor suposição
// com base na convenção do resto da API (pt-BR, chaves como "valor"/
// "total"/"nome"/"data"). `pick` tenta várias chaves candidatas em ordem —
// se o formato real vier diferente, ajustar só a lista de candidatos em
// cada `buildX`; o resto do componente depende apenas do shape já
// normalizado que essas funções devolvem.
// ---------------------------------------------------------------------
const pick = (obj: any, ...keys: string[]) => {
  for (const key of keys) {
    const value = key.split('.').reduce((acc, part) => acc?.[part], obj);
    if (value !== undefined && value !== null) return value;
  }
  return undefined;
};

const unwrap = (raw: any) => raw?.data ?? raw ?? {};

interface ResumoCard {
  label: string;
  value: number | string;
  // O backend já manda o texto pronto ("+0 hoje", "-2 desde ontem", "sem
  // sessões suficientes pra comparar") em vez de um número de variação cru
  // — mostrar direto em vez de tentar recalcular sinal/cor a partir dele.
  deltaDescricao: string | null;
  icon: string;
  suffix?: string;
}

const buildResumo = (raw: any): ResumoCard[] => {
  const source = unwrap(raw);

  const build = (obj: any, label: string, icon: string, suffix = ''): ResumoCard => {
    if (typeof obj === 'number' || typeof obj === 'string') {
      return { label, value: obj, deltaDescricao: null, icon, suffix };
    }

    return {
      label,
      value: pick(obj, 'valor', 'total', 'quantidade') ?? '—',
      deltaDescricao: pick(obj, 'deltaDescricao', 'descricaoDelta') ?? null,
      icon,
      suffix,
    };
  };

  return [
    build(
      pick(source, 'pacientesAtivos', 'pacientes_ativos'),
      'Pacientes ativos',
      'pi pi-users'
    ),
    build(
      pick(source, 'sessoesHoje', 'sessoes_hoje'),
      'Sessões hoje',
      'pi pi-calendar'
    ),
    build(
      pick(source, 'filaEspera', 'fila_espera'),
      'Fila de espera',
      'pi pi-clock'
    ),
    build(
      pick(source, 'taxaPresenca', 'taxa_presenca'),
      'Taxa de presença',
      'pi pi-user-plus',
      '%'
    ),
  ];
};

const buildEspecialidadeChart = (raw: any) => {
  const items = resolveResponseData(raw) || [];
  const labels = items.map(
    (item: any) => pick(item, 'especialidade', 'nome', 'label') ?? '-'
  );
  const values = items.map((item: any) =>
    Number(pick(item, 'total', 'valor', 'quantidade', 'sessoes') ?? 0)
  );
  // Cada especialidade já vem com sua cor cadastrada (mesma usada em
  // outras telas) — usar em vez de uma cor fixa deixa o gráfico consistente
  // com o resto do sistema.
  const colors = items.map((item: any) => pick(item, 'cor', 'color') ?? '#662977');

  return {
    labels,
    datasets: [
      {
        label: 'Sessões realizadas',
        data: values,
        backgroundColor: colors,
        borderRadius: 6,
      },
    ],
  };
};

const STATUS_COLORS = ['#662977', '#a78bda', '#f87171', '#facc15', '#4ade80', '#94a3b8'];

const buildStatusChart = (raw: any) => {
  const items = resolveResponseData(raw) || [];
  const labels = items.map(
    (item: any) => pick(item, 'status', 'nome', 'label') ?? '-'
  );
  const values = items.map((item: any) =>
    Number(pick(item, 'total', 'valor', 'quantidade') ?? 0)
  );
  const total = values.reduce((sum: number, value: number) => sum + value, 0);

  return {
    total,
    chart: {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: labels.map(
            (_: string, index: number) => STATUS_COLORS[index % STATUS_COLORS.length]
          ),
          borderWidth: 0,
        },
      ],
    },
  };
};

const buildOcupacao = (raw: any): { label: string; value: number }[] => {
  const items = resolveResponseData(raw);
  if (Array.isArray(items) && items.length) {
    return items.map((item: any) => ({
      label: pick(item, 'periodo', 'nome', 'label') ?? '-',
      value: Number(pick(item, 'percentual', 'valor', 'ocupacao') ?? 0),
    }));
  }

  const source = unwrap(raw);
  return [
    { label: 'Manhã', value: Number(pick(source, 'manha', 'manhã') ?? 0) },
    { label: 'Tarde', value: Number(pick(source, 'tarde') ?? 0) },
    { label: 'Noite', value: Number(pick(source, 'noite') ?? 0) },
  ];
};

// Etapas reais da clínica (ver regras-de-negocio-geral.md): fila de
// avaliação -> avaliação -> fila de terapia -> terapia. Não são as mesmas
// etapas de um mockup genérico de "funil de vendas" — são as filas de
// atendimento que já existem no resto do sistema.
const FLUXO_STAGE_ORDER = ['Fila avaliação', 'Avaliação', 'Fila terapia', 'Terapia'];

const buildFluxo = (raw: any): { label: string; value: number }[] => {
  const items = resolveResponseData(raw);
  if (Array.isArray(items) && items.length) {
    return items.map((item: any) => ({
      label: pick(item, 'etapa', 'nome', 'label') ?? '-',
      value: Number(pick(item, 'total', 'valor', 'quantidade') ?? 0),
    }));
  }

  const source = unwrap(raw);
  return FLUXO_STAGE_ORDER.map((stage) => ({
    label: stage,
    value: Number(pick(source, stage) ?? 0),
  }));
};

// Mesma paleta fixa de especialidades usada em outras telas (ver Tag em
// components/tag e as cores `to`/`psico`/`fono`/... do tailwind.config.cjs)
// — esse endpoint não devolve uma cor por item, diferente de
// sessoes-especialidade.
const SPECIALTY_COLORS: Record<string, string> = {
  to: '#ef6c00',
  psico: '#8e24aa',
  fono: '#f6bf26',
  psicopedag: '#000000',
  motricidade: '#4285F4',
  musicoterapia: '#795548',
};

const getSpecialtyColor = (name: string) => {
  const key = String(name || '').toLowerCase().replace(/\s+/g, '');
  return SPECIALTY_COLORS[key] || '#662977';
};

const buildFilaEspecialidade = (raw: any): { label: string; value: number; color: string }[] => {
  const items = resolveResponseData(raw) || [];
  return items.map((item: any) => {
    const label = pick(item, 'especialidade', 'nome', 'label') ?? '-';
    // Cor cadastrada na especialidade, vinda do backend — mesmo campo já
    // usado em sessoes-especialidade. A paleta fixa (getSpecialtyColor)
    // fica só como fallback pra item sem cor cadastrada.
    const color = pick(item, 'cor', 'color') ?? getSpecialtyColor(label);
    return {
      label,
      value: Number(pick(item, 'total', 'valor', 'quantidade') ?? 0),
      color,
    };
  });
};

interface Pendencia {
  descricao: string;
  total?: number;
  icon: string;
  tom: 'alerta' | 'aviso' | 'info';
}

// Categorias reais informadas pelo backend: avisar hoje / evolução não
// lançada / conflito de agenda / documentos (Plano/Laudo) vencendo.
const PENDENCIA_META: Record<string, { icon: string; tom: Pendencia['tom'] }> = {
  'avisar-hoje': { icon: 'pi pi-bell', tom: 'aviso' },
  avisarhoje: { icon: 'pi pi-bell', tom: 'aviso' },
  'evolucao-nao-lancada': { icon: 'pi pi-file-edit', tom: 'alerta' },
  evolucaonaolancada: { icon: 'pi pi-file-edit', tom: 'alerta' },
  'conflito-agenda': { icon: 'pi pi-calendar-times', tom: 'alerta' },
  conflitoagenda: { icon: 'pi pi-calendar-times', tom: 'alerta' },
  'documentos-vencendo': { icon: 'pi pi-file', tom: 'aviso' },
  documentosvencendo: { icon: 'pi pi-file', tom: 'aviso' },
};

const buildPendencias = (raw: any): Pendencia[] => {
  const items = resolveResponseData(raw) || [];
  return items.map((item: any) => {
    const tipo = String(pick(item, 'tipo', 'codigo', 'chave') ?? '')
      .toLowerCase()
      .trim();
    const meta = PENDENCIA_META[tipo] || { icon: 'pi pi-info-circle', tom: 'info' as const };

    return {
      descricao: pick(item, 'descricao', 'mensagem', 'texto', 'label') ?? '-',
      total: pick(item, 'total', 'quantidade', 'valor'),
      ...meta,
    };
  });
};

// Pacientes ativos por convênio (/dashboard/pacientes-convenio), com a
// divisão por unidade.
interface ConvenioResumo {
  nome: string;
  quantidade: number;
  percentual: number;
  unidades: { nome: string; quantidade: number }[];
  cor: string;
}

// Roxo do projeto primeiro, depois cores que já aparecem no sistema
// (especialidades) — o maior convênio fica sempre na cor da marca.
const CONVENIO_CORES = ['#662977', '#a78bda', '#f6bf26', '#ef6c00', '#4285F4', '#4ade80', '#795548', '#94a3b8'];

const buildPacientesConvenio = (raw: any): ConvenioResumo[] => {
  const items = resolveResponseData(raw) || [];
  return items.map((item: any, index: number) => ({
    nome: pick(item, 'nome', 'convenio') ?? '-',
    quantidade: Number(pick(item, 'quantidade', 'total') ?? 0),
    percentual: Number(pick(item, 'percentual') ?? 0),
    unidades: (item?.unidades || []).map((u: any) => ({
      nome: pick(u, 'nome') ?? '-',
      quantidade: Number(pick(u, 'quantidade') ?? 0),
    })),
    cor: CONVENIO_CORES[index % CONVENIO_CORES.length],
  }));
};

interface SessaoHoje {
  horario: string;
  paciente: string;
  terapia: string;
  profissional: string;
  sala: string;
  status: string;
}

const buildSessoesHoje = (raw: any): SessaoHoje[] => {
  const items = resolveResponseData(raw) || [];
  return items.map((item: any) => ({
    horario: pick(item, 'horario', 'hora', 'inicio', 'horaInicio') ?? '-',
    paciente: pick(item, 'paciente', 'pacienteNome', 'nomePaciente') ?? '-',
    terapia: pick(item, 'terapia', 'especialidade', 'especialidadeNome') ?? '-',
    profissional:
      pick(item, 'profissional', 'terapeuta', 'terapeutaNome', 'nomeTerapeuta') ?? '-',
    sala: pick(item, 'sala', 'local', 'localidade', 'localidadeNome') ?? '-',
    status: pick(item, 'status', 'statusEvento', 'statusNome') ?? '-',
  }));
};

interface TopTerapeuta {
  nome: string;
  sessoes: number;
  presenca: number | null;
}

const buildTopTerapeutas = (raw: any): TopTerapeuta[] => {
  const items = resolveResponseData(raw) || [];
  return items.map((item: any) => ({
    nome: pick(item, 'nome', 'terapeuta', 'terapeutaNome') ?? '-',
    sessoes: Number(pick(item, 'sessoes', 'totalSessoes', 'quantidade') ?? 0),
    presenca: pick(item, 'presenca', 'taxaPresenca', 'percentualPresenca') ?? null,
  }));
};

const STATUS_TOM: Record<string, string> = {
  confirmada: 'ok',
  confirmado: 'ok',
  realizada: 'ok',
  atendido: 'ok',
  aguardando: 'aviso',
  avisar: 'aviso',
  falta: 'erro',
  cancelada: 'erro',
};

const statusTom = (status: string) => {
  const chave = String(status || '').toLowerCase().trim();
  if (chave.startsWith('cancelad')) return 'erro';
  return STATUS_TOM[chave] || '';
};

const getInitials = (name?: string) =>
  (name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || '?';

const Painel = ({
  icon,
  titulo,
  subtitulo,
  extra,
  className = '',
  children,
}: {
  icon: string;
  titulo: string;
  subtitulo?: string;
  extra?: ReactNode;
  className?: string;
  children: ReactNode;
}) => (
  <section className={`home-painel ${className}`}>
    <div className="home-painel-topo">
      <div className="home-painel-titulo">
        <span className="home-icone">
          <i className={icon} />
        </span>
        <div>
          <h3>{titulo}</h3>
          {subtitulo && <small>{subtitulo}</small>}
        </div>
      </div>
      {extra && <div className="home-painel-extra">{extra}</div>}
    </div>
    {children}
  </section>
);

const Vazio = ({ texto = 'Sem dados no período' }: { texto?: string }) => (
  <div className="home-vazio">
    <i className="pi pi-inbox" />
    {texto}
  </div>
);

const BarrasHorizontais = ({
  items,
  sufixo = '',
}: {
  items: { label: string; value: number; color?: string }[];
  sufixo?: string;
}) => {
  const max = Math.max(...items.map((item) => item.value), 1);

  return (
    <div className="home-barras">
      {items.map((item) => (
        <div key={item.label} className="home-barra-linha">
          <span>{item.label}</span>
          <b>
            {item.value}
            {sufixo}
          </b>
          <div className="home-barra-trilho">
            <span
              style={{
                width: `${Math.min((item.value / max) * 100, 100)}%`,
                backgroundColor: item.color,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

const PacientesPorConvenio = ({ convenios }: { convenios: ConvenioResumo[] }) => {
  const max = Math.max(...convenios.map((c) => c.quantidade), 1);

  return (
    <>
      <div className="conv-barra" role="img" aria-label="Distribuição dos pacientes por convênio">
        {convenios.map((c) => (
          <span
            key={c.nome}
            title={`${c.nome}: ${c.quantidade} (${c.percentual}%)`}
            style={{ width: `${c.percentual}%`, backgroundColor: c.cor }}
          />
        ))}
      </div>
      <ul className="conv-lista">
        {convenios.map((c) => (
          <li key={c.nome} className="conv-item">
            <span className="conv-cor" style={{ backgroundColor: c.cor }} />
            <span className="conv-nome" title={c.nome}>
              {c.nome}
            </span>
            <span className="conv-numero">
              {c.quantidade}
              <small>{c.percentual || !c.quantidade ? `${c.percentual}%` : '<1%'}</small>
            </span>
            <span className="conv-trilho">
              <span style={{ width: `${(c.quantidade / max) * 100}%`, backgroundColor: c.cor }} />
            </span>
            {c.unidades.length > 1 && (
              <span className="conv-unidades">
                {c.unidades.map((u) => (
                  <span key={u.nome}>
                    {u.nome} {u.quantidade}
                  </span>
                ))}
              </span>
            )}
          </li>
        ))}
      </ul>
    </>
  );
};

const chartBarOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: { grid: { display: false }, ticks: { font: { size: 11 } } },
    y: { grid: { color: '#f1f1f4' }, border: { display: false }, beginAtZero: true, ticks: { precision: 0 } },
  },
  plugins: {
    legend: { display: false },
  },
};

const chartDonutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '68%',
  plugins: {
    legend: {
      // Ao lado do gráfico cabe no desktop; no celular os nomes cortavam.
      position: (typeof window !== 'undefined' && window.innerWidth < 640 ? 'bottom' : 'right') as
        | 'bottom'
        | 'right',
      labels: { boxWidth: 10, boxHeight: 10, usePointStyle: true, font: { size: 11 } },
    },
  },
};

const chartHorizontalBarOptions = {
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y' as const,
  scales: {
    x: { grid: { color: '#f1f1f4' }, border: { display: false }, beginAtZero: true, ticks: { precision: 0 } },
    y: { grid: { display: false }, ticks: { font: { size: 11 } } },
  },
  plugins: {
    legend: { display: false },
  },
};

// Tons de violeta em degradê, do mais escuro (primeira etapa) ao mais
// claro — reforça visualmente a ideia de funil das etapas de atendimento.
const FUNNEL_SHADES = ['#662977', '#7c3a91', '#9558ab', '#c99bd6'];

const toFunnelChartData = (items: { label: string; value: number }[]) => ({
  labels: items.map((item) => item.label),
  datasets: [
    {
      label: 'Pacientes',
      data: items.map((item) => item.value),
      backgroundColor: items.map((_, index) => FUNNEL_SHADES[index % FUNNEL_SHADES.length]),
      borderRadius: 6,
      barThickness: 20,
    },
  ],
});

type Periodo = 'hoje' | 'semana' | 'mes';

const PERIODO_OPTIONS: { value: Periodo; label: string }[] = [
  { value: 'hoje', label: 'Hoje' },
  { value: 'semana', label: 'Semana' },
  { value: 'mes', label: 'Mês' },
];

const PERIODO_SUBTITLE: Record<Periodo, string> = {
  hoje: 'Números de hoje',
  semana: 'Números desta semana',
  mes: 'Números deste mês',
};

export default function Dashboard() {
  const { hasPermition } = permissionAuth();
  const { renderToast } = useToast();

  // Endpoint que não trata `periodo` simplesmente ignora o parâmetro e
  // devolve o estado atual (fila, fluxo, convênios), sem quebrar nada.
  const [periodo, setPeriodo] = useState<Periodo>('hoje');
  const [loading, setLoading] = useState(true);
  // O spinner de página inteira só faz sentido na primeira carga. Ao trocar
  // de período depois, os painéis já têm dado na tela — só indica
  // "atualizando" de leve.
  const hasLoadedOnce = useRef(false);

  const [resumo, setResumo] = useState<ResumoCard[]>([]);
  const [pacientesConvenio, setPacientesConvenio] = useState<ConvenioResumo[]>([]);
  const [especialidadeChart, setEspecialidadeChart] = useState<any>(null);
  const [statusChart, setStatusChart] = useState<{ total: number; chart: any } | null>(null);
  const [ocupacao, setOcupacao] = useState<{ label: string; value: number }[]>([]);
  const [fluxo, setFluxo] = useState<{ label: string; value: number }[]>([]);
  const [filaEspecialidade, setFilaEspecialidade] = useState<
    { label: string; value: number; color: string }[]
  >([]);
  const [pendencias, setPendencias] = useState<Pendencia[]>([]);
  const [sessoesHoje, setSessoesHoje] = useState<SessaoHoje[]>([]);
  const [topTerapeutas, setTopTerapeutas] = useState<TopTerapeuta[]>([]);

  useEffect(() => {
    let cancelled = false;

    const loadSection = async (
      permission: string,
      endpoint: string,
      apply: (raw: any) => void
    ) => {
      if (!hasPermition(permission)) return;

      try {
        const raw = await getList(`${endpoint}?periodo=${periodo}`);
        if (!cancelled) apply(raw);
      } catch (error) {
        if (!cancelled) {
          renderToast(buildErrorToast(error, `Não foi possível carregar "${endpoint}".`));
        }
      }
    };

    const loadAll = async () => {
      setLoading(true);

      await Promise.allSettled([
        loadSection('DASHBOARD_RESUMO', '/dashboard/resumo', (raw) => setResumo(buildResumo(raw))),
        loadSection('DASHBOARD_RESUMO', '/dashboard/pacientes-convenio', (raw) =>
          setPacientesConvenio(buildPacientesConvenio(raw))
        ),
        loadSection('DASHBOARD_SESSOES_ESPECIALIDADE', '/dashboard/sessoes-especialidade', (raw) =>
          setEspecialidadeChart(buildEspecialidadeChart(raw))
        ),
        loadSection('DASHBOARD_SESSOES_STATUS', '/dashboard/sessoes-status', (raw) =>
          setStatusChart(buildStatusChart(raw))
        ),
        loadSection('DASHBOARD_OCUPACAO_PERIODO', '/dashboard/ocupacao-periodo', (raw) =>
          setOcupacao(buildOcupacao(raw))
        ),
        loadSection('DASHBOARD_FLUXO_PACIENTES', '/dashboard/fluxo-pacientes', (raw) =>
          setFluxo(buildFluxo(raw))
        ),
        loadSection('DASHBOARD_FILA_ESPECIALIDADE', '/dashboard/fila-especialidade', (raw) =>
          setFilaEspecialidade(buildFilaEspecialidade(raw))
        ),
        loadSection('DASHBOARD_PENDENCIAS', '/dashboard/pendencias', (raw) =>
          setPendencias(buildPendencias(raw))
        ),
        loadSection('DASHBOARD_SESSOES_HOJE', '/dashboard/sessoes-hoje', (raw) =>
          setSessoesHoje(buildSessoesHoje(raw))
        ),
        loadSection('DASHBOARD_TOP_TERAPEUTAS', '/dashboard/top-terapeutas', (raw) =>
          setTopTerapeutas(buildTopTerapeutas(raw))
        ),
      ]);

      if (!cancelled) {
        setLoading(false);
        hasLoadedOnce.current = true;
      }
    };

    loadAll();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodo]);

  if (loading && !hasLoadedOnce.current) {
    return <LoadingHeron />;
  }

  const pode = (tag: string) => Boolean(hasPermition(tag));
  const totalConvenios = pacientesConvenio.reduce((soma, c) => soma + c.quantidade, 0);

  return (
    <div className="flex flex-col gap-4" data-testid="dashboard-page">
      <div className="home-secao">
        <div>
          <h2>Visão da clínica</h2>
          <small>
            {PERIODO_SUBTITLE[periodo]}
            {loading && hasLoadedOnce.current && (
              <i className="pi pi-spin pi-spinner home-atualizando" />
            )}
          </small>
        </div>

        <div className="home-periodo" role="group" aria-label="Período" data-testid="dashboard-periodo-filter">
          {PERIODO_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setPeriodo(option.value)}
              data-testid={`dashboard-periodo-${option.value}`}
              aria-pressed={periodo === option.value}
              className={`home-pilula ${periodo === option.value ? 'ativa' : ''}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {pode('DASHBOARD_RESUMO') && resumo.length > 0 && (
        <div className="home-grade">
          {resumo.map((card) => (
            <section key={card.label} className="home-painel home-kpi s3">
              <span className="home-icone">
                <i className={card.icon} />
              </span>
              <div>
                <span className="home-kpi-rotulo">{card.label}</span>
                <span className="home-kpi-valor">
                  {card.value}
                  {card.value !== '—' ? card.suffix : ''}
                </span>
                {card.deltaDescricao && <span className="home-kpi-delta">{card.deltaDescricao}</span>}
              </div>
            </section>
          ))}
        </div>
      )}

      <div className="home-grade">
        {pode('DASHBOARD_RESUMO') && (
          <Painel
            icon="pi pi-id-card"
            titulo="Pacientes por convênio"
            subtitulo="Pacientes ativos hoje"
            extra={
              totalConvenios ? (
                <>
                  <b>{totalConvenios}</b> pacientes
                </>
              ) : undefined
            }
            className="s5"
          >
            {pacientesConvenio.length ? (
              <PacientesPorConvenio convenios={pacientesConvenio} />
            ) : (
              <Vazio texto="Nenhum paciente ativo" />
            )}
          </Painel>
        )}

        {pode('DASHBOARD_SESSOES_ESPECIALIDADE') && (
          <Painel
            icon="pi pi-chart-bar"
            titulo="Sessões por especialidade"
            subtitulo="Sessões realizadas no período"
            className="s7"
          >
            {especialidadeChart?.labels?.length ? (
              <div style={{ height: 280 }}>
                <Bar options={chartBarOptions} data={especialidadeChart} />
              </div>
            ) : (
              <Vazio />
            )}
          </Painel>
        )}

        {pode('DASHBOARD_SESSOES_HOJE') && (
          <Painel
            icon="pi pi-calendar"
            titulo="Próximas sessões de hoje"
            extra={sessoesHoje.length ? <><b>{sessoesHoje.length}</b> sessões</> : undefined}
            className="s8"
          >
            {sessoesHoje.length ? (
              <div className="home-tabela">
                <DataTable value={sessoesHoje} size="small" responsiveLayout="scroll">
                  <Column
                    field="horario"
                    header="Horário"
                    body={(row: SessaoHoje) => <span className="home-horario">{row.horario}</span>}
                  />
                  <Column field="paciente" header="Paciente" />
                  <Column field="terapia" header="Terapia" />
                  <Column field="profissional" header="Profissional" />
                  <Column field="sala" header="Sala" />
                  <Column
                    field="status"
                    header="Status"
                    body={(row: SessaoHoje) => (
                      <span className={`home-status ${statusTom(row.status)}`}>{row.status}</span>
                    )}
                  />
                </DataTable>
              </div>
            ) : (
              <Vazio texto="Nenhuma sessão para hoje" />
            )}
          </Painel>
        )}

        {pode('DASHBOARD_PENDENCIAS') && (
          <Painel icon="pi pi-bell" titulo="Pendências" subtitulo="O que precisa de atenção" className="s4">
            {pendencias.length ? (
              <ul className="home-pendencias">
                {pendencias.map((item, index) => (
                  <li key={index} className={`home-pendencia ${item.tom}`}>
                    <i className={item.icon} />
                    <span className="home-pendencia-texto">
                      {item.total !== undefined && <b>{item.total}</b>}
                      {item.descricao}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <Vazio texto="Nenhuma pendência" />
            )}
          </Painel>
        )}

        {pode('DASHBOARD_SESSOES_STATUS') && (
          <Painel
            icon="pi pi-chart-pie"
            titulo="Sessões por status"
            extra={statusChart?.total ? <><b>{statusChart.total}</b> sessões</> : undefined}
            className="s4"
          >
            {statusChart?.chart?.labels?.length ? (
              <div style={{ height: 220 }}>
                <Doughnut options={chartDonutOptions} data={statusChart.chart} />
              </div>
            ) : (
              <Vazio />
            )}
          </Painel>
        )}

        {pode('DASHBOARD_OCUPACAO_PERIODO') && (
          <Painel icon="pi pi-clock" titulo="Ocupação por período" subtitulo="Horários ocupados" className="s4">
            {ocupacao.length ? <BarrasHorizontais items={ocupacao} sufixo="%" /> : <Vazio />}
          </Painel>
        )}

        {pode('DASHBOARD_FLUXO_PACIENTES') && (
          <Painel icon="pi pi-sort-amount-down" titulo="Fluxo de pacientes" subtitulo="Da fila à terapia" className="s4">
            {fluxo.length ? (
              <div style={{ height: 220 }}>
                <Bar options={chartHorizontalBarOptions} data={toFunnelChartData(fluxo)} />
              </div>
            ) : (
              <Vazio />
            )}
          </Painel>
        )}

        {pode('DASHBOARD_FILA_ESPECIALIDADE') && (
          <Painel icon="pi pi-users" titulo="Fila de espera por especialidade" className="s6">
            {filaEspecialidade.length ? (
              <BarrasHorizontais items={filaEspecialidade} />
            ) : (
              <Vazio texto="Ninguém na fila" />
            )}
          </Painel>
        )}

        {pode('DASHBOARD_TOP_TERAPEUTAS') && (
          <Painel icon="pi pi-star" titulo="Terapeutas com mais sessões" subtitulo="No período" className="s6">
            {topTerapeutas.length ? (
              <ol className="home-ranking">
                {topTerapeutas.map((item, index) => (
                  <li key={item.nome}>
                    <span className="home-posicao">{index + 1}</span>
                    <span className="home-avatar">{getInitials(item.nome)}</span>
                    <span className="home-ranking-nome">
                      <strong title={item.nome}>{item.nome}</strong>
                      {item.presenca !== null && <small>{item.presenca}% de presença</small>}
                    </span>
                    <span className="home-ranking-sessoes">{item.sessoes} sessões</span>
                  </li>
                ))}
              </ol>
            ) : (
              <Vazio />
            )}
          </Painel>
        )}
      </div>
    </div>
  );
}
