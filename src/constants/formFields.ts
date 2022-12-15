const loginFields = [
  {
    labelText: 'Login',
    labelFor: 'login',
    id: 'login',
    name: 'login',
    type: 'text',
    autoComplete: 'email',
    isRequired: true,
    placeholder: 'Login',
    validate: {
      pattern: {
        value: /^([a-z]{3,})+\.([a-z]{3,})$/i,
        message: 'formato padrão xxx.xxx',
      },
      required: 'Campo obrigatório!',
      minlength: 8,
    },
  },
  {
    labelText: 'Senha',
    labelFor: 'senha',
    id: 'senha',
    name: 'senha',
    type: 'password',
    isRequired: true,
    placeholder: 'Senha',
    validate: {
      required: 'Campo obrigatório!',
    },
  },
];

const filterAvaliationFields = [
  {
    permission: 'FILA_AVALIACAO_FILTRO_SELECT_PACIENTE',
    labelText: 'Paciente',
    id: 'pacientes',
    name: 'pacientes',
    customCol: 'col-span-6 sm:col-span-3',
    type: 'select',
    singleSelect: false,
  },
  {
    permission: 'FILA_AVALIACAO_FILTRO_SELECT_CONVENIO',
    labelText: 'Convênio',
    id: 'convenios',
    name: 'convenios',
    customCol: 'col-span-6 sm:col-span-3',
    type: 'select',
    singleSelect: false,
  },
  {
    permission: 'FILA_AVALIACAO_FILTRO_SELECT_ESPECIALIDADE',
    labelText: 'Especialidade',
    id: 'especialidades',
    name: 'especialidades',
    customCol: 'col-span-6 sm:col-span-3',
    type: 'select',
    singleSelect: false,
  },
  {
    permission: 'FILA_AVALIACAO_FILTRO_SELECT_PRIORIDADE',
    labelText: 'Prioridade',
    id: 'status',
    name: 'status',
    customCol: 'col-span-6 sm:col-span-3',
    type: 'select',
    singleSelect: false,
  },
  {
    permission: 'FILA_AVALIACAO_FILTRO_SELECT_PERIODOS',
    labelText: 'Períodos',
    id: 'periodos',
    name: 'periodos',
    customCol: 'col-span-6 sm:col-span-3',
    type: 'select',
    singleSelect: false,
  },
  {
    permission: 'FILA_AVALIACAO_FILTRO_SELECT_TIPO_SESSAO',
    labelText: 'Tipo sessão',
    id: 'tipoSessoes',
    name: 'tipoSessao',
    customCol: 'col-span-6 sm:col-span-3',
    type: 'select',
    singleSelect: false,
  },
  {
    permission: 'FILA_AVALIACAO_FILTRO_SELECT_AGENDADOS',
    labelText: 'Agendados',
    id: 'naFila',
    name: 'naFila',
    customCol: 'col-span-6 sm:col-span-2',
    type: 'switch',
    singleSelect: false,
  },
  {
    permission: 'FILA_AVALIACAO_FILTRO_SELECT_INATIVOS',
    labelText: 'Inativos',
    id: 'disabled',
    name: 'disabled',
    customCol: 'col-span-6 sm:col-span-2',
    type: 'switch',
    singleSelect: false,
  },
  {
    permission: 'FILA_AVALIACAO_FILTRO_SELECT_DEVOLUTIVAS',
    labelText: 'Devolutivas',
    id: 'devolutiva',
    name: 'devolutiva',
    customCol: 'col-span-6 sm:col-span-2',
    type: 'switch',
    singleSelect: false,
  },
];

const filterTerapyFields = [
  {
    permission: 'FILA_TERAPIA_FILTRO_SELECT_PACIENTE',
    labelText: 'Paciente',
    id: 'pacientes',
    name: 'pacientes',
    customCol: 'col-span-6 sm:col-span-3',
    type: 'select',
    singleSelect: false,
  },
  {
    permission: 'FILA_TERAPIA_FILTRO_SELECT_CONVENIO',
    labelText: 'Convênio',
    id: 'convenios',
    name: 'convenios',
    customCol: 'col-span-6 sm:col-span-3',
    type: 'select',
    singleSelect: false,
  },
  {
    permission: 'FILA_TERAPIA_FILTRO_SELECT_ESPECIALIDADE',
    labelText: 'Especialidade',
    id: 'especialidades',
    name: 'especialidades',
    customCol: 'col-span-6 sm:col-span-3',
    type: 'select',
    singleSelect: false,
  },
  {
    permission: 'FILA_TERAPIA_FILTRO_SELECT_PERIODOS',
    labelText: 'Períodos',
    id: 'periodos',
    name: 'periodos',
    customCol: 'col-span-6 sm:col-span-3',
    type: 'select',
    singleSelect: false,
  },
  {
    permission: 'FILA_TERAPIA_FILTRO_SELECT_PRIORIDADE',
    labelText: 'Prioridade',
    id: 'status',
    name: 'status',
    customCol: 'col-span-6 sm:col-span-3',
    type: 'select',
    singleSelect: false,
  },
  {
    permission: 'FILA_TERAPIA_FILTRO_SELECT_AGENDADOS',
    labelText: 'Agendados',
    id: 'naFila',
    name: 'naFila',
    customCol: 'col-span-3 sm:col-span-2',
    type: 'switch',
    singleSelect: false,
  },
  {
    permission: 'FILA_TERAPIA_FILTRO_SELECT_INATIVOS',
    labelText: 'Inativos',
    id: 'disabled',
    name: 'disabled',
    customCol: 'col-span-3 sm:col-span-1',
    type: 'switch',
    singleSelect: false,
  },
];

const usuariosFields: any = [
  {
    labelText: 'Nome',
    labelFor: 'nome',
    id: 'nome',
    name: 'nome',
    type: 'text',
    autoComplete: 'nome',
    isRequired: true,
    placeholder: 'Nome',
    validate: {
      pattern: {
        value: /^[ a-zA-Zá]*$/i,
        message: 'Apenas letras',
      },
      required: 'Campo obrigatório!',
      minlength: 8,
    },
  },
  {
    labelText: 'Login',
    labelFor: 'login',
    id: 'login',
    name: 'login',
    type: 'text',
    autoComplete: 'email',
    isRequired: true,
    placeholder: 'Login (nome.sobrenome)',
    validate: {
      pattern: {
        value: /^([a-z]{3,})+\.([a-z]{3,})$/i,
        message: 'formato padrão, ex.: nome.sobrenome',
      },
      required: 'Campo obrigatório!',
      minlength: 8,
    },
  },
  {
    labelText: 'Perfil',
    labelFor: 'perfies',
    id: 'perfilId',
    name: 'perfil',
    type: 'select',
    autoComplete: 'perfil',
    isRequired: true,
    placeholder: 'Selecione a permissão',
    validate: {
      required: 'Campo obrigatório!',
    },
  },
  {
    labelText: 'Especialidade',
    labelFor: 'especialidades',
    id: 'especialidadeId',
    name: 'especialidade',
    type: 'select',
    autoComplete: 'especialidade',
    isRequired: true,
    placeholder: 'Selecione a permissão',
    customCol: 'col-span-6 sm:col-span-3',
    hidden: true,
  },
  {
    labelText: 'Função',
    labelFor: 'funcoes',
    id: 'funcoesId',
    name: 'funcao',
    type: 'multiselect',
    autoComplete: 'funcao',
    isRequired: true,
    placeholder: 'Selecione a permissão',
    customCol: 'col-span-6 sm:col-span-3',
    hidden: true,
  },
  {
    labelText: 'Permissão',
    labelFor: 'permissoes',
    id: 'permissoesId',
    name: 'permissao',
    type: 'picker',
    autoComplete: 'permissao',
    isRequired: true,
    placeholder: 'Selecione a permissão',
    customCol: 'col-span-6 sm:col-span-3',
  },
];

const funcaoFields = [
  {
    labelText: 'Nome',
    labelFor: 'nome',
    id: 'nome',
    name: 'nome',
    autoComplete: 'nome',
    isRequired: true,
    placeholder: 'Nome',
    customCol: 'col-span-6 sm:col-span-6',
    type: 'text',
    validate: {
      required: true,
    },
  },
  {
    labelText: 'Especialidade',
    labelFor: 'especialidades',
    id: 'especialidadeId',
    name: 'especialidade',
    autoComplete: 'especialidades',
    isRequired: false,
    placeholder: 'Especialidades',
    customCol: 'col-span-6',
    type: 'select',
    singleSelect: false,
  },
];

const localidadeFields = [
  {
    labelText: 'Casa',
    labelFor: 'casa',
    id: 'casa',
    name: 'casa',
    autoComplete: 'casa',
    isRequired: true,
    placeholder: 'Casa',
    customCol: 'col-span-6',
    type: 'text',
    validate: {
      required: true,
    },
  },
  {
    labelText: 'Sala',
    labelFor: 'sala',
    id: 'sala',
    name: 'sala',
    autoComplete: 'sala',
    isRequired: true,
    placeholder: 'Sala',
    customCol: 'col-span-6',
    type: 'text',
    validate: {
      required: true,
    },
  },
];

const modalidadeFields = [
  {
    labelText: 'Nome',
    labelFor: 'nome',
    id: 'nome',
    name: 'nome',
    autoComplete: 'nome',
    isRequired: true,
    placeholder: 'nome',
    customCol: 'col-span-6',
    type: 'text',
    validate: {
      required: true,
    },
  },
];

const frequenciaFields = [
  {
    labelText: 'Nome',
    labelFor: 'nome',
    id: 'nome',
    name: 'nome',
    autoComplete: 'nome',
    isRequired: true,
    placeholder: 'nome',
    customCol: 'col-span-6',
    type: 'text',
    validate: {
      required: true,
    },
  },
];

const statusEventosFields = [
  {
    labelText: 'Nome',
    labelFor: 'nome',
    id: 'nome',
    name: 'nome',
    autoComplete: 'nome',
    isRequired: true,
    placeholder: 'nome',
    customCol: 'col-span-6',
    type: 'text',
    validate: {
      required: true,
    },
  },
];

const filterCalendarFields = [
  {
    permission: 'AGENDA_FILTRO_SELECT_PACIENTE',
    labelText: 'Pacientes',
    labelFor: 'pacientes',
    id: 'pacienteId',
    name: 'pacientes',
    autoComplete: 'paciente',
    isRequired: false,
    placeholder: 'Paciente',
    customCol: 'col-span-6 sm:col-span-3',
    type: 'select',
    singleSelect: false,
  },
  {
    permission: 'AGENDA_FILTRO_SELECT_TERAPEUTAS',
    labelText: 'Terapeutas',
    labelFor: 'terapeutas',
    id: 'terapeutaId',
    name: 'terapeutas',
    autoComplete: 'terapeuta',
    isRequired: false,
    placeholder: 'terapeuta',
    customCol: 'col-span-6 sm:col-span-3',
    type: 'select',
    singleSelect: false,
    hidden: true,
  },
  {
    permission: 'AGENDA_FILTRO_SELECT_STATUS_EVENTOS',
    labelText: 'Status Eventos',
    labelFor: 'statusEventos',
    id: 'statusEventosId',
    name: 'statusEventos',
    autoComplete: 'statusEventos',
    isRequired: false,
    placeholder: 'statusEventos',
    customCol: 'col-span-6 sm:col-span-3',
    type: 'select',
    singleSelect: false,
  },
  {
    permission: 'AGENDA_FILTRO_SELECT_MODALIDADE',
    labelText: 'Modalidade',
    labelFor: 'modalidades',
    id: 'modalidadeId',
    name: 'modalidades',
    autoComplete: 'modalidade',
    isRequired: false,
    placeholder: 'modalidade',
    customCol: 'col-span-6 sm:col-span-3',
    type: 'select',
    singleSelect: false,
  },
];

export {
  loginFields,
  filterAvaliationFields,
  filterCalendarFields,
  filterTerapyFields,
};

export const Fields: any = {
  usuariosFields,
  funcaoFields,
  localidadeFields,
  modalidadeFields,
  frequenciaFields,
  statusEventosFields,
};
