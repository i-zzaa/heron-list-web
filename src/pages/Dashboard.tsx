import { useEffect, useRef, useState } from 'react';
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
import { Card } from '../components/index';
import { LoadingHeron } from '../components/loading';
import { NotFound } from '../components/notFound';
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
    return {
      label,
      value: Number(pick(item, 'total', 'valor', 'quantidade') ?? 0),
      color: getSpecialtyColor(label),
    };
  });
};

interface Pendencia {
  descricao: string;
  total?: number;
  icon: string;
  color: string;
}

// Categorias reais informadas pelo backend: avisar hoje / evolução não
// lançada / conflito de agenda — só essas três, não as cinco genéricas de
// um mockup.
const PENDENCIA_META: Record<string, { icon: string; color: string }> = {
  'avisar-hoje': { icon: 'pi pi-bell', color: 'text-yellow-500' },
  avisarhoje: { icon: 'pi pi-bell', color: 'text-yellow-500' },
  'evolucao-nao-lancada': { icon: 'pi pi-file-edit', color: 'text-red-400' },
  evolucaonaolancada: { icon: 'pi pi-file-edit', color: 'text-red-400' },
  'conflito-agenda': { icon: 'pi pi-calendar-times', color: 'text-red-400' },
  conflitoagenda: { icon: 'pi pi-calendar-times', color: 'text-red-400' },
};

const buildPendencias = (raw: any): Pendencia[] => {
  const items = resolveResponseData(raw) || [];
  return items.map((item: any) => {
    const tipo = String(pick(item, 'tipo', 'codigo', 'chave') ?? '')
      .toLowerCase()
      .trim();
    const meta = PENDENCIA_META[tipo] || {
      icon: 'pi pi-info-circle',
      color: 'text-gray-400',
    };

    return {
      descricao: pick(item, 'descricao', 'mensagem', 'texto', 'label') ?? '-',
      total: pick(item, 'total', 'quantidade', 'valor'),
      ...meta,
    };
  });
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

const STATUS_BADGE_CLASS: Record<string, string> = {
  confirmada: 'bg-green-400/10 text-green-400',
  realizada: 'bg-green-400/10 text-green-400',
  atendido: 'bg-green-400/10 text-green-400',
  'em atendimento': 'bg-[#3b82f6]/10 text-[#3b82f6]',
  aguardando: 'bg-yellow-400/10 text-yellow-600',
  falta: 'bg-red-400/10 text-red-400',
  cancelada: 'bg-red-400/10 text-red-400',
};

const getStatusBadgeClass = (status: string) =>
  STATUS_BADGE_CLASS[status?.toLowerCase()?.trim()] || 'bg-gray-200 text-gray-800';

const getInitials = (name?: string) =>
  (name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || '?';

const PanelTitle = ({ icon, text }: { icon: string; text: string }) => (
  <div className="flex items-center gap-2 mb-4">
    <i className={`${icon} text-violet-800`} />
    <h3 className="font-semibold text-gray-800 text-sm">{text}</h3>
  </div>
);

const HorizontalBars = ({
  items,
}: {
  items: { label: string; value: number; color?: string }[];
}) => {
  const max = Math.max(...items.map((item) => item.value), 1);

  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <div key={item.label} className="grid grid-cols-[1fr_auto] items-center gap-3 text-sm">
          <div>
            <span className="text-gray-600 block mb-1">{item.label}</span>
            <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
              <div
                className={item.color ? 'h-full rounded-full' : 'h-full rounded-full bg-violet-800'}
                style={{
                  width: `${Math.min((item.value / max) * 100, 100)}%`,
                  backgroundColor: item.color,
                }}
              />
            </div>
          </div>
          <span className="font-inter text-gray-700 w-8 text-right">{item.value}</span>
        </div>
      ))}
    </div>
  );
};

const chartBarOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: { grid: { display: false } },
    y: { grid: { display: false }, beginAtZero: true },
  },
  plugins: {
    legend: { display: false },
  },
};

const chartDonutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom' as const, display: true, align: 'start' as const, labels: { boxWidth: 10, font: { size: 11 } } },
  },
};

const chartHorizontalBarOptions = {
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y' as const,
  scales: {
    x: { grid: { display: false }, beginAtZero: true, ticks: { precision: 0 } },
    y: { grid: { display: false } },
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
      barThickness: 22,
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
  hoje: 'Visão operacional de hoje',
  semana: 'Visão operacional da semana',
  mes: 'Visão operacional do mês',
};

export default function Dashboard() {
  const { hasPermition } = permissionAuth();
  const { renderToast } = useToast();

  // Backend ainda não confirmou suporte a esse filtro em todos os
  // endpoints (a maioria foi descrita como "hoje" por natureza — fila
  // atual, sessões de hoje etc.). Manda `periodo` na querystring mesmo
  // assim: endpoint que ainda não suporta simplesmente ignora o parâmetro
  // e devolve o de sempre, sem quebrar nada; quando o backend passar a
  // tratar, já funciona sem mudança nenhuma aqui.
  const [periodo, setPeriodo] = useState<Periodo>('hoje');
  const [loading, setLoading] = useState(true);
  // O spinner de página inteira só faz sentido na primeira carga. Ao trocar
  // de pílula depois, os cards já têm dado na tela — melhor manter tudo
  // visível (inclusive as pílulas, pra dar pra trocar de novo) e só indicar
  // "atualizando" de leve, em vez de sumir com a página inteira de novo.
  const hasLoadedOnce = useRef(false);

  const [resumo, setResumo] = useState<ResumoCard[]>([]);
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

  return (
    // Sem cabeçalho de perfil/alterar senha aqui — Home.tsx (onde este
    // componente é montado) já tem esse bloco; ver Home.tsx.
    <div className="grid gap-4 mt-6" data-testid="dashboard-page">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Dashboard da Clínica</h1>
          <p className="text-sm text-gray-400">
            {PERIODO_SUBTITLE[periodo]}
            {loading && hasLoadedOnce.current && (
              <i className="pi pi-spin pi-spinner ml-2" style={{ fontSize: 11 }} />
            )}
          </p>
        </div>

        <div className="flex items-center gap-1 rounded-full bg-gray-200 p-1" data-testid="dashboard-periodo-filter">
          {PERIODO_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setPeriodo(option.value)}
              data-testid={`dashboard-periodo-${option.value}`}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                periodo === option.value
                  ? 'bg-violet-800 text-white'
                  : 'text-gray-500 hover:text-violet-800'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {Boolean(hasPermition('DASHBOARD_RESUMO')) && resumo.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {resumo.map((card) => (
            <Card key={card.label}>
              <div className="flex gap-4 items-center">
                <i className={`${card.icon} text-violet-800`} style={{ fontSize: 20 }} />
                <div className="grid">
                  <span className="text-gray-500 text-xs">{card.label}</span>
                  <span className="font-inter text-lg font-semibold text-gray-800">
                    {card.value}
                    {card.value !== '—' ? card.suffix : ''}
                  </span>
                  {card.deltaDescricao && (
                    <span className="text-xs text-gray-400">{card.deltaDescricao}</span>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Proporção 2:1:1 igual à referência — o gráfico de barras precisa
          de mais espaço horizontal pra caber os rótulos das especialidades
          do que o donut e as barrinhas de ocupação. */}
      <div className="grid gap-4 xl:grid-cols-4">
        {Boolean(hasPermition('DASHBOARD_SESSOES_ESPECIALIDADE')) && (
          <div className="xl:col-span-2">
            <Card>
              <PanelTitle icon="pi pi-chart-bar" text="Sessões por especialidade" />
              {especialidadeChart?.labels?.length ? (
                <div style={{ height: 220 }}>
                  <Bar options={chartBarOptions} data={especialidadeChart} />
                </div>
              ) : (
                <NotFound />
              )}
            </Card>
          </div>
        )}

        {Boolean(hasPermition('DASHBOARD_SESSOES_STATUS')) && (
          <Card>
            <PanelTitle icon="pi pi-chart-pie" text="Sessões por status" />
            {statusChart?.chart?.labels?.length ? (
              <div className="relative" style={{ height: 220 }}>
                <Doughnut options={chartDonutOptions} data={statusChart.chart} />
              </div>
            ) : (
              <NotFound />
            )}
          </Card>
        )}

        {Boolean(hasPermition('DASHBOARD_OCUPACAO_PERIODO')) && (
          <Card>
            <PanelTitle icon="pi pi-clock" text="Ocupação por período" />
            {ocupacao.length ? (
              <HorizontalBars items={ocupacao.map((item) => ({ ...item, value: item.value }))} />
            ) : (
              <NotFound />
            )}
          </Card>
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {Boolean(hasPermition('DASHBOARD_FLUXO_PACIENTES')) && (
          <Card>
            <PanelTitle icon="pi pi-sort-amount-down" text="Fluxo de pacientes" />
            {fluxo.length ? (
              <div style={{ height: 220 }}>
                <Bar options={chartHorizontalBarOptions} data={toFunnelChartData(fluxo)} />
              </div>
            ) : (
              <NotFound />
            )}
          </Card>
        )}

        {Boolean(hasPermition('DASHBOARD_FILA_ESPECIALIDADE')) && (
          <Card>
            <PanelTitle icon="pi pi-users" text="Fila de espera por especialidade" />
            {filaEspecialidade.length ? <HorizontalBars items={filaEspecialidade} /> : <NotFound />}
          </Card>
        )}

        {Boolean(hasPermition('DASHBOARD_PENDENCIAS')) && (
          <Card>
            <PanelTitle icon="pi pi-bell" text="Pendências importantes" />
            {pendencias.length ? (
              <div className="grid gap-3">
                {pendencias.map((item, index) => (
                  <div key={index} className="flex items-center gap-3 text-sm">
                    <i className={`${item.icon} ${item.color}`} />
                    <span className="flex-1 text-gray-700">
                      {item.total !== undefined ? `${item.total} ` : ''}
                      {item.descricao}
                    </span>
                    <i className="pi pi-chevron-right text-gray-300" style={{ fontSize: 10 }} />
                  </div>
                ))}
              </div>
            ) : (
              <NotFound />
            )}
          </Card>
        )}
      </div>

      {/* Tabela + top terapeutas na mesma linha (3:2), igual à referência —
          antes eram duas linhas inteiras separadas. */}
      <div className="grid gap-4 xl:grid-cols-5">
        {Boolean(hasPermition('DASHBOARD_SESSOES_HOJE')) && (
          <div className="xl:col-span-3">
            <Card>
              <PanelTitle icon="pi pi-calendar" text="Próximas sessões de hoje" />
              {sessoesHoje.length ? (
                <div className="overflow-x-auto">
                  <DataTable value={sessoesHoje} responsiveLayout="scroll">
                    <Column field="horario" header="Horário" />
                    <Column field="paciente" header="Paciente" />
                    <Column field="terapia" header="Terapia" />
                    <Column field="profissional" header="Profissional" />
                    <Column field="sala" header="Sala" />
                    <Column
                      field="status"
                      header="Status"
                      body={(row: SessaoHoje) => (
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${getStatusBadgeClass(row.status)}`}>
                          {row.status}
                        </span>
                      )}
                    />
                  </DataTable>
                </div>
              ) : (
                <NotFound />
              )}
            </Card>
          </div>
        )}

        {Boolean(hasPermition('DASHBOARD_TOP_TERAPEUTAS')) && (
          <div className="xl:col-span-2">
            <Card>
              <PanelTitle icon="pi pi-star" text="Top terapeutas do dia" />
              {topTerapeutas.length ? (
                <div className="grid gap-3">
                  {topTerapeutas.map((item) => (
                    <div key={item.nome} className="flex items-center gap-3 rounded-xl border border-gray-200 p-3">
                      <div className="w-10 h-10 rounded-full bg-violet-800 text-white flex items-center justify-center font-bold text-sm shrink-0">
                        {getInitials(item.nome)}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-800">{item.nome}</div>
                        <div className="text-xs text-gray-400">
                          {item.sessoes} sessões
                          {item.presenca !== null ? ` · ${item.presenca}% presença` : ''}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <NotFound />
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
