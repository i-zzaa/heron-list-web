export const STATUS_EVENTOS = [
  { id: 6, nome: 'Atendido', cobrar: true },
  { id: 3, nome: 'Atestado', cobrar: false },
  { id: 1, nome: 'Avisar', cobrar: false },
  { id: 2, nome: 'Cancelado c/ Antecedência', cobrar: false },
  { id: 12, nome: 'Cancelado Clínica', cobrar: false },
  { id: 11, nome: 'Cancelado s/ Antecedência', cobrar: true },
  { id: 8, nome: 'Cancelado Terapeuta', cobrar: false },
  { id: 5, nome: 'Confirmado', cobrar: false },
  { id: 4, nome: 'Falta', cobrar: true },
  { id: 10, nome: 'Feriado', cobrar: false },
  { id: 9, nome: 'Terapeuta de Férias', cobrar: false },
];

export const STATUS_INICIAL = STATUS_EVENTOS.find(
  (status) => status.nome.trim() === 'Avisar'
);

export const STATUS_COBRAR_TRUE = STATUS_EVENTOS.filter((status) => status.cobrar);

export const STATUS_COBRAR_FALSE = STATUS_EVENTOS.filter(
  (status) => !status.cobrar && status.nome.trim() !== 'Avisar'
);

export const STATUS_CANCELADOS = STATUS_EVENTOS.filter((status) =>
  status.nome.toLowerCase().includes('cancelado')
);

export const MODALIDADES = [
  { id: 1, nome: 'Avaliação' },
  { id: 2, nome: 'Devolutiva' },
  { id: 3, nome: 'Terapia' },
];

export const FREQUENCIAS = [
  { id: 2, nome: 'Recorrente' },
  { id: 1, nome: 'Único' },
];

export const INTERVALOS = [
  { id: 1, nome: 'Todas Semanas' },
  { id: 2, nome: '2 Semanas' },
  { id: 3, nome: '3 Semanas' },
];

export const LOCALIDADES = [{ id: 1, nome: 'Casa 1 - Sala Rei Leão' }];

export const FUNCOES = [{ id: 5, nome: 'Acompanhante Terapêutica' }];

export const TERAPEUTAS = [{ id: 27, nome: 'ALDA CARRARA' }];

export const ESPECIALIDADES = [{ id: 100, nome: 'Psicologia' }];

export const PACIENTES = [{ id: 123, nome: 'Paciente E2E Agenda' }];

export const DADOS_PADRAO = {
  dataInicial: '2026-08-03',
  horaInicio: '08:00',
  horaFim: '09:00',
  frequencia: 'Recorrente',
  statusInicial: 'Avisar',
  localidade: 'Casa 1 - Sala Rei Leão',
  funcao: 'Acompanhante Terapêutica',
  terapeuta: 'ALDA CARRARA',
  paciente: 'Paciente E2E Agenda',
  especialidade: 'Psicologia',
};

export const STATUS_TRUE_PRIORITARIOS = [
  'Atendido',
  'Falta',
  'Cancelado s/ Antecedência',
];

export const STATUS_FALSE_PRIORITARIOS = [
  'Confirmado',
  'Atestado',
  'Cancelado Clínica',
  'Cancelado Terapeuta',
  'Feriado',
  'Terapeuta de Férias',
];
