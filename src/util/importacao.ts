import * as XLSX from 'xlsx';

// Linha da planilha de pacientes no formato que a API de importação espera.
// Os valores vão crus (número do Excel, texto): a normalização — data em
// serial, carteirinha em notação científica, apelido de especialidade — é
// feita no backend, a mesma regra do script de carga inicial.
export interface LinhaPlanilhaPaciente {
  linha: number;
  nome: string;
  carteirinha?: string | number;
  dataNascimento?: string | number;
  responsavel?: string;
  telefone?: string | number;
  convenio?: string;
  emissaoPlanoTerapeutico?: string | number;
  emissaoLaudo?: string | number;
  especialidades?: string;
  unidade?: string;
}

type Campo = Exclude<keyof LinhaPlanilhaPaciente, 'linha'>;

export const normalizarCabecalho = (texto: unknown) =>
  String(texto ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

// Cabeçalho da planilha "PLANILHA PACIENTE - CADASTRO NOVO SISTEMA" e
// variações próximas. A ordem importa: "EMISSÃO DO PLANO TERAPEUTICO" é
// testado antes de qualquer regra mais genérica.
const CAMPO_POR_CABECALHO: { campo: Campo; teste: (c: string) => boolean }[] = [
  { campo: 'emissaoPlanoTerapeutico', teste: (c) => c.includes('plano terapeutico') || c === 'pt' },
  { campo: 'emissaoLaudo', teste: (c) => c.includes('laudo') },
  { campo: 'dataNascimento', teste: (c) => c.includes('nascimento') },
  { campo: 'carteirinha', teste: (c) => c.includes('carteirinha') },
  { campo: 'responsavel', teste: (c) => c.includes('responsavel') },
  { campo: 'telefone', teste: (c) => c.includes('telefone') || c.includes('celular') },
  { campo: 'convenio', teste: (c) => c.includes('convenio') },
  { campo: 'especialidades', teste: (c) => c.startsWith('especialidade') },
  { campo: 'unidade', teste: (c) => c === 'unidade' },
  { campo: 'nome', teste: (c) => c === 'paciente' || c === 'nome' || c.startsWith('nome do paciente') },
];

const OBRIGATORIAS: { campo: Campo; nome: string }[] = [
  { campo: 'nome', nome: 'PACIENTE' },
  { campo: 'convenio', nome: 'CONVENIO' },
  { campo: 'especialidades', nome: 'ESPECIALIDADES' },
  { campo: 'unidade', nome: 'UNIDADE' },
];

export function colunasDoCabecalho(cabecalho: unknown[]): Partial<Record<Campo, number>> {
  const colunas: Partial<Record<Campo, number>> = {};
  cabecalho.forEach((celula, indice) => {
    const texto = normalizarCabecalho(celula);
    if (!texto) return;
    const achado = CAMPO_POR_CABECALHO.find(
      ({ campo, teste }) => colunas[campo] === undefined && teste(texto)
    );
    if (achado) colunas[achado.campo] = indice;
  });
  return colunas;
}

// Converte as linhas cruas da primeira aba (matriz, como o SheetJS devolve)
// nas linhas de paciente. O cabeçalho é a primeira linha que tem PACIENTE;
// linhas sem nome (fim da planilha, linhas em branco) ficam de fora.
export function linhasDaPlanilha(matriz: unknown[][]): LinhaPlanilhaPaciente[] {
  const inicio = matriz.findIndex((linha) =>
    (linha || []).some((c) => colunasDoCabecalho([c]).nome !== undefined)
  );
  if (inicio < 0) {
    throw new Error('Não achei o cabeçalho da planilha: falta a coluna PACIENTE.');
  }

  const colunas = colunasDoCabecalho(matriz[inicio]);
  const faltando = OBRIGATORIAS.filter(({ campo }) => colunas[campo] === undefined);
  if (faltando.length) {
    throw new Error(
      `Faltam colunas na planilha: ${faltando.map((c) => c.nome).join(', ')}.`
    );
  }

  const linhas: LinhaPlanilhaPaciente[] = [];
  matriz.slice(inicio + 1).forEach((celulas, indice) => {
    const valor = (campo: Campo) => {
      const coluna = colunas[campo];
      const bruto = coluna === undefined ? '' : (celulas || [])[coluna];
      return typeof bruto === 'string' ? bruto.trim() : bruto ?? '';
    };
    const nome = String(valor('nome') ?? '').trim();
    if (!nome) return;

    linhas.push({
      // Número da linha como aparece no Excel, para a pessoa achar o erro.
      linha: inicio + indice + 2,
      nome,
      carteirinha: valor('carteirinha') as any,
      dataNascimento: valor('dataNascimento') as any,
      responsavel: String(valor('responsavel') ?? ''),
      telefone: valor('telefone') as any,
      convenio: String(valor('convenio') ?? ''),
      emissaoPlanoTerapeutico: valor('emissaoPlanoTerapeutico') as any,
      emissaoLaudo: valor('emissaoLaudo') as any,
      especialidades: String(valor('especialidades') ?? ''),
      unidade: String(valor('unidade') ?? ''),
    });
  });

  return linhas;
}

export async function lerPlanilhaPacientes(arquivo: File): Promise<LinhaPlanilhaPaciente[]> {
  const planilha = XLSX.read(await arquivo.arrayBuffer(), { type: 'array' });
  const aba = planilha.Sheets[planilha.SheetNames[0]];
  if (!aba) throw new Error('A planilha está vazia.');
  const matriz = XLSX.utils.sheet_to_json<unknown[]>(aba, {
    header: 1,
    raw: true,
    defval: '',
  });
  return linhasDaPlanilha(matriz);
}

export function emLotes<T>(itens: T[], tamanho: number): T[][] {
  const lotes: T[][] = [];
  for (let i = 0; i < itens.length; i += tamanho) {
    lotes.push(itens.slice(i, i + tamanho));
  }
  return lotes;
}

// "2026-09-30" -> "30/09/2026"
export const dataBr = (data?: string) =>
  data ? data.slice(0, 10).split('-').reverse().join('/') : '';

const DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

// Resumo de quando um evento importado acontece, para a tabela de conferência.
export function quandoAcontece(evento: {
  recorrente: boolean;
  dataInicio: string;
  dataFim: string;
  start: string;
  end: string;
  intervalo: number;
  diasFrequencia: number[];
  exdate?: string[];
}): string {
  const horario = `${evento.start}–${evento.end}`;
  if (!evento.recorrente) return `${dataBr(evento.dataInicio)}, ${horario}`;

  const dias = evento.diasFrequencia.map((d) => DIAS[d]).join(', ');
  const ritmo = evento.intervalo > 1 ? `a cada ${evento.intervalo} semanas` : 'toda semana';
  const periodo = evento.dataFim
    ? `de ${dataBr(evento.dataInicio)} até ${dataBr(evento.dataFim)}`
    : `desde ${dataBr(evento.dataInicio)}, sem fim`;
  const excecoes = evento.exdate?.length
    ? ` · ${evento.exdate.length} ${evento.exdate.length === 1 ? 'data pulada' : 'datas puladas'}`
    : '';
  return `${dias}, ${horario}, ${ritmo} · ${periodo}${excecoes}`;
}
