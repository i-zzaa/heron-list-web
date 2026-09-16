// Relatório de Planos Terapêuticos e Laudos Médicos (Relatórios > PT/Laudos).
export const TIPO_DOCUMENTO_OPTIONS = [
  { id: 'plano_terapeutico', nome: 'Plano Terapêutico' },
  { id: 'laudo_medico', nome: 'Laudo Médico' },
];

export const SITUACAO_DOCUMENTO_OPTIONS = [
  { id: 'vencido', nome: 'Vencido' },
  { id: 'a_vencer', nome: 'A vencer' },
];

export const filterPtLaudosFields = [
  {
    permission: 'RELATORIOS_PT_LAUDOS_FILTRO_SELECT_TIPO',
    labelText: 'Tipo',
    id: 'tipo',
    name: 'tipos',
    customCol: 'col-span-6 sm:col-span-2',
    type: 'select',
  },
  {
    permission: 'RELATORIOS_PT_LAUDOS_FILTRO_SELECT_CONVENIO',
    labelText: 'Convênio',
    id: 'convenioId',
    name: 'convenios',
    customCol: 'col-span-6 sm:col-span-2',
    type: 'select',
  },
  {
    permission: 'RELATORIOS_PT_LAUDOS_FILTRO_SELECT_SITUACAO',
    labelText: 'Situação',
    id: 'situacao',
    name: 'situacoes',
    customCol: 'col-span-6 sm:col-span-2',
    type: 'select',
  },
  // O período é aplicado sobre a data de vencimento do documento.
  {
    permission: 'RELATORIOS_PT_LAUDOS_FILTRO_SELECT_DATA_INICIAL',
    labelText: 'Vencimento de',
    id: 'dataInicio',
    name: 'dataInicio',
    customCol: 'col-span-6 sm:col-span-1',
    type: 'date',
  },
  {
    permission: 'RELATORIOS_PT_LAUDOS_FILTRO_SELECT_DATA_FINAL',
    labelText: 'Vencimento até',
    id: 'dataFim',
    name: 'dataFim',
    customCol: 'col-span-6 sm:col-span-1',
    type: 'date',
  },
];
