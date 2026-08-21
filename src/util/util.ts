import moment from 'moment';
moment.locale('pt-br');
import { PacientsProps } from '../foms/PatientForm';

export const colorsData: any = {
  TO: '#ef6c00',
  FONO: '#f6bf26',
  PSICO: '#8e24aa',
  MOTRICIDADE: '#4285F4',
  MUSICOTERAPIA: '#795548',
  PSICOPEDAG: '#000000',
};

export const colorsTextData: any = {
  TO: '#ffffff',
  FONO: '#ffffff',
  PSICO: '#ffffff',
  MUSICOTERAPIA: '#ffffff',
  MOTRICIDADE: '#ffffff',
  PSICOPEDAG: '#ffffff',
};

// Monta um mapa NOME_EM_MAIÚSCULO -> cor a partir do catálogo de
// especialidades (cada item com `nome`/`cor` vindo do backend, cadastrado
// em Cadastro > Especialidade). Usar em telas que só têm o nome da
// especialidade solto (sem o objeto completo aninhado), pra ainda assim
// pintar com a cor real cadastrada em vez de uma cor fixa no front.
export const buildEspecialidadeColorMap = (
  especialidades: any[] = []
): Record<string, string> => {
  return (especialidades || []).reduce((map: Record<string, string>, item: any) => {
    const nome = item?.nome;
    if (nome && item?.cor) {
      map[nome.toUpperCase()] = item.cor;
    }
    return map;
  }, {});
};

export const corEspecialidade = (type: string): string => {
  let tipo = '';
  switch (type.toUpperCase()) {
    case 'TO':
      tipo = 'bg-to';
      break;
    case 'FONO':
      tipo = 'bg-fono';
      break;
    case 'PSICO':
      tipo = 'bg-psico';
      break;
    case 'MOTRICIDADE':
      tipo = 'bg-motricidade';
      break;
    case 'MUSICOTERAPIA':
      tipo = 'bg-musicoterapia';
      break;
    case 'PSICOPEDAG':
      tipo = 'bg-psico-pdeg';
      break;
    default:
      tipo = 'p-multiselect-token';
      break;
  }

  return tipo;
};

export const firtUpperCase = (string: string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

// Pinta os chips do multiselect de Especialidade com a cor de verdade
// cadastrada em Cadastro > Especialidade (`especialidades` traz `cor` por
// item, ex. vindo do catálogo completo). O mapa fixo de códigos
// (colorsData) só entra como fallback pra quem ainda usa a sigla (TO,
// FONO, PSICO...) em vez do nome completo da especialidade — sem isso,
// nomes como "Fisioterapia"/"Fonoaudiologia" nunca batiam com as siglas e
// o chip ficava sempre na cor padrão do PrimeReact, sem nenhuma cor real.
export const setColorChips = (especialidades: any[] = []) => {
  const colorMap = buildEspecialidadeColorMap(especialidades);

  setTimeout(() => {
    const chips: any = document.querySelectorAll('.p-multiselect-token') || [];
    chips.forEach((chip: any) => {
      const nome = chip.textContent.toUpperCase();
      const color = colorMap[nome] || colorsData[nome];
      if (!color) return;

      chip.style.background = color;
      chip.style.color = colorsTextData[nome] || '#ffffff';
    });
  }, 0);
};

export const formatdate = (date: any) => {
  return moment(date).format('DD/MM/YYYY');
};

export const formatdateeua = (date: any) => {
  moment.locale('pt-br');
  return moment(date).format('YYYY-MM-DD');
};

export const formatdateEuaAddDay = (date: any) => {
  return moment(date).add(1, 'days').format('YYYY-MM-DD');
};

export const diffWeek = (dataInicio: any, dataAtual: any) => {
  const inicio = moment(dataInicio);
  const atual = moment(dataAtual);
  return atual.diff(inicio, 'weeks') + 1;
};

export const weekDay = [
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
];

export const horariosUteis = [
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
  '20:00',
];

export const horariosUteisObj = {
  '08:00': false,
  '09:00': false,
  '10:00': false,
  '11:00': false,
  '12:00': false,
  '13:00': false,
  '14:00': false,
  '15:00': false,
  '16:00': false,
  '17:00': false,
  '18:00': false,
  '19:00': false,
  '20:00': false,
};

export const getDateFormat = (date: any) => {
  const dateFormat = moment(date); //.add(1, 'days'); // Thursday Feb 2015
  const dow = Number(dateFormat.day() - 1);

  return `${weekDay[dow]}, ${dateFormat.format('ll')}`;
};

export const formtDatePatient = (value: PacientsProps) => {
  return {
    id: value?.id,
    nome: value?.nome || '',
    dataNascimento: value?.dataNascimento || '',
    telefone: value?.telefone || '',
    responsavel: value?.responsavel || '',
    carteirinha: value?.carteirinha || '',
    periodoId: value?.vaga?.periodo || null,
    convenioId: value?.convenio || null,
    statusId: value?.status || null,
    dataContato: value?.vaga?.dataContato || '',
    dataVoltouAba: value?.vaga?.dataVoltouAba || '',
    sessao: value?.sessao || [],
    vagaId: value?.vaga?.id || null,
    especialidades: (value?.vaga?.especialidades || []).map((item: any) => {
      return {
        nome: item?.especialidade?.nome || '',
        id: item?.especialidade?.id || null,
      };
    }),
    tipoSessaoId: value?.tipoSessao || null,
    observacao: value?.vaga?.observacao || '',
    // Sem isso, abrir o cadastro pra editar sempre mostrava esses dois
    // campos em branco — mesmo com a data de emissão já preenchida no
    // paciente — porque essa função monta o objeto do formulário campo a
    // campo e esses dois nunca tinham entrado na lista. Os nomes batem com
    // o que o backend realmente devolve (`dataEmissaoPlanoTerapeutico` /
    // `dataEmissaoLaudoMedico`), não com o nome curto que a gente supôs
    // antes de conferir a resposta real.
    dataEmissaoPlanoTerapeutico: value?.dataEmissaoPlanoTerapeutico || '',
    dataEmissaoLaudoMedico: value?.dataEmissaoLaudoMedico || '',
  };
};

export const getPrimeiroDoMes = (ano: number, mes: number) => {
  return moment(new Date(ano, mes - 1, 1)).format('YYYY-MM-DD');
};

export const getUltimoDoMes = (ano: number, mes: number) => {
  return moment(new Date(ano, mes, 0)).format('YYYY-MM-DD');
};

export const formaTime = (duration: any) => {
  const time = moment.duration(duration);
  return `${time.hours().toString().padStart(2, '0')}:${time
    .minutes()
    .toString()
    .padStart(2, '0')}:${time.seconds().toString().padStart(2, '0')}`;
};

export const moneyFormat = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export const isInPast = (date: string) => {
  return moment(date).isBefore(new Date());
};

export enum DEVICE {
  mobile = 'DEVICE_MOBILE',
  web = 'DEVICE_WEB',
}
