import moment from 'moment';
moment.locale('pt-br');
import { PacientsProps } from '../foms/PatientForm';

export const colorsData: any = {
  TO: '#ef6c00',
  FONO: '#f6bf26',
  PSICO: '#8e24aa',
  MOTRICIDADE: '#8e24aa',
  MUSICOTERAPIA: '#795548',
  PSICOPEDAG: '#000000',
};

export const bgData: any = {
  TO: 'bg-to',
  FONO: 'bg-fono',
  PSICO: 'bg-psico',
  MOTRICIDADE: 'bg-motricidade',
  MUSICOTERAPIA: 'bg-musicoterapia',
  PSICOPEDAG: 'bg-psico-pdeg',
};

export const colorsTextData: any = {
  TO: '#ffffff',
  FONO: '#ffffff',
  PSICO: '#ffffff',
  MUSICOTERAPIA: '#ffffff',
  MOTRICIDADE: '#ffffff',
  PSICOPEDAG: '#ffffff',
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

export const setColorChips = () => {
  setTimeout(() => {
    const chips: any = document.querySelectorAll('.p-multiselect-token') || [];
    chips.forEach((chip: any) => {
      const color = colorsData[chip.textContent.toUpperCase()];
      const text = colorsTextData[chip.textContent.toUpperCase()];

      chip.style.background = color;
      chip.style.color = text;
    });
  }, 0);
};

export const formatdate = (date: any) => {
  return moment(date).format('DD/MM/YYYY');
};

export const formatdateeua = (date: any) => {
  moment.locale('pt-br');
  // return moment(date).add(1, 'days').format('YYYY-MM-DD');
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
  'Terca-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
];

export const horariosUteis = [
  '07:00',
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
  '07:00': false,
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
    id: value.id,
    nome: value.nome,
    dataNascimento: value.dataNascimento,
    telefone: value.telefone,
    responsavel: value.responsavel,
    carteirinha: value.carteirinha,
    periodoId: value.vaga.periodo,
    convenioId: value.convenio,
    statusId: value.status,
    dataContato: value.vaga.dataContato,
    dataVoltouAba: value?.vaga?.dataVoltouAba,
    sessao: value?.sessao,
    vagaId: value.vaga.id,
    especialidades: value.vaga.especialidades.map((item: any) => {
      return {
        nome: item.especialidade.nome,
        id: item.especialidade.id,
      };
    }),
    tipoSessaoId: value.tipoSessao,
    observacao: value.vaga.observacao,
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
