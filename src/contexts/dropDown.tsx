import { createContext, useContext, useCallback, useMemo } from 'react';
import { dropDown } from '../server';
import {
  COORDENADOR,
  COORDENADOR_TERAPEUTA,
  permissionAuth,
  TERAPEUTA,
} from './permission';

export interface DropdownContextData {
  renderPacientes: (statusPacienteCod: string) => void;
  renderStatusEventos: () => void;
  renderModalidade: (statusPacienteCod: string) => void;
  renderFrequencia: () => void;
  renderLocalidade: () => void;
  renderFuncao: () => void;
  renderTerapeutas: () => void;
  renderEspecialidadeFuncao: (especialidade: string) => void;
  renderEspecialidadeTerapeuta: (especialidade: string) => void;
  renderTerapeutaFuncao: (terapeutaId: number) => void;
  renderDropdownCalendario: (statusPacienteCod: string) => any;
  renderDropdownCrud: () => any;
  renderDropdownPatientCrud: (statusPacienteCod: string) => any;
  renderPacienteEspecialidade: (
    pacienteId: number,
    statusPacienteCod: string
  ) => any;
  renderDropdownQueue: (statusPacienteCod: string) => any;
  renderDropdownCalendar: (statusPacienteCod: string) => any;
  renderDropdownFinancial: (statusPacienteCod: string) => any;
  renderDropdownBaixa: (statusPacienteCod: string) => any;
  renderDropdownQueueCalendar: (
    statusPacienteCod: string,
    pacienteId: number
  ) => any;
}

interface Props {
  children: JSX.Element;
}

const DropdownContext = createContext<DropdownContextData>(
  {} as DropdownContextData
);

export const DropdownProvider = ({ children }: Props) => {
  const { perfil } = permissionAuth();

  const weekOption = [
    { nome: 'S', value: 1 },
    { nome: 'T', value: 2 },
    { nome: 'Q', value: 3 },
    { nome: 'Q', value: 4 },
    { nome: 'S', value: 5 },
    { nome: 'S', value: 6 },
  ];

  const renderPacientes = useCallback(async (statusPacienteCod: string) => {
    const response: any = await dropDown('paciente',
      `statusPacienteCod=${statusPacienteCod}`
    );
    return response;
  }, []);

  const renderPacientesTerapeuta = useCallback(async (terapeutaId: number) => {
    const response: any = await dropDown('terapeuta/paciente',
      `terapeutaId=${terapeutaId}`
    );
    return response;
  }, []);

  const renderEspecialidade = useMemo(async () => {
    const response: any = await dropDown('especialidade');
    return response;
  }, []);

  const renderStatusEventos = useCallback(async () => {
    const response: any = await dropDown('status-eventos');
    return response;
  }, []);

  const renderModalidade = useCallback(async (statusPacienteCod: string) => {
    const response: any = await dropDown('modalidade',
      `statusPacienteCod=${statusPacienteCod}`
    );
    return response;
  }, []);

  const renderFrequencia = useCallback(async () => {
    const response: any = await dropDown('frequencia');
    return response;
  }, []);

  const renderGrupoPermissoes = useCallback(async () => {
    const response: any = await dropDown('grupo-permissoes');
    return response;
  }, []);

  const renderLocalidade = useCallback(async () => {
    const response: any = await dropDown('localidade');
    return response;
  }, []);

  const renderFuncao = useCallback(async () => {
    const response: any = await dropDown('funcao');
    return response;
  }, []);

  const renderPerfil = useMemo(async () => {
    const response: any = await dropDown('perfil');
    return response;
  }, []);

  const renderPeriodo = useCallback(async () => {
    const response: any = await dropDown('periodo');
    return response;
  }, []);

  const renderStatus = useCallback(async (statusPacienteCod: string) => {
    const response: any = await dropDown(
      `status?statusPacienteCod=${statusPacienteCod}`
    );
    return response;
  }, []);

  const renderTipoSessao = useCallback(async () => {
    const response: any = await dropDown('tipo-sessao');
    return response;
  }, []);

  const renderPacienteEspecialidade = useCallback(
    async (pacienteId: number, statusPacienteCod: string) => {
      const response: any = await dropDown(
        'paciente/especialidade',
        `pacienteId=${pacienteId}&statusPacienteCod=${statusPacienteCod}`
      );
      return response;
    },
    []
  );

  const renderEspecialidadeFuncao = useCallback(
    async (especialidade: string) => {
      const response: any = await dropDown(
        'funcao/especialidade',
        `especialidade=${especialidade}`
      );
      return response;
    },
    []
  );

  const renderEspecialidadeTerapeuta = useCallback(
    async (especialidade: string) => {
      const response: any = await dropDown(
        'terapeuta/especialidade',
        `especialidade=${especialidade}`
      );
      return response;
    },
    []
  );

  const renderTerapeutaFuncao = useCallback(async (terapeutaId: number) => {
    const response: any = await dropDown(
      'funcao/terapeuta',
      `terapeutaId=${terapeutaId}`
    );
    return response;
  }, []);

  const renderConvenio = useMemo(async () => {
    const response: any = await dropDown('convenio');
    return response;
  }, []);

  const renderPermissao = useMemo(async () => {
    const response: any = await dropDown('permissao');
    return response;
  }, []);

  const renderTerapeutas = async () => {
    const response: any = await dropDown('terapeuta');
    return response;
  };

  const renderIntervalos = async () => {
    const response: any = await dropDown('intervalo');
    return response;
  };

  const renderDropdownCalendario = async (statusPacienteCod: string) => {
    const dropDownList = {
      pacientes: await renderPacientes(statusPacienteCod),
      statusEventos: await renderStatusEventos(),
      modalidades: await renderModalidade(statusPacienteCod),
      frequencias: await renderFrequencia(),
      localidades: await renderLocalidade(),
      funcoes: await renderFuncao(),
      terapeutas: await renderTerapeutas(),
      especialidades: await renderEspecialidade,
      intervalos: await renderIntervalos(),
      diasFrequencia: weekOption,
    };

    return dropDownList;
  };

  const renderDropdownQueueCalendar = async (
    statusPacienteCod: string,
    pacienteId: number
  ) => {
    const dropDownList = {
      pacientes: await renderPacientes(statusPacienteCod),
      statusEventos: await renderStatusEventos(),
      modalidades: await renderModalidade(statusPacienteCod),
      frequencias: await renderFrequencia(),
      localidades: await renderLocalidade(),
      funcoes: await renderFuncao(),
      terapeutas: await renderTerapeutas(),
      especialidades: await renderPacienteEspecialidade(
        pacienteId,
        statusPacienteCod
      ),
      intervalos: await renderIntervalos(),
      diasFrequencia: weekOption,
    };

    return dropDownList;
  };

  const renderDropdownQueue = async (statusPacienteCod: string) => {
    const dropDownList = {
      pacientes: await renderPacientes(statusPacienteCod),
      convenios: await renderConvenio,
      especialidades: await renderEspecialidade,
      tipoSessao: await renderTipoSessao(),
      periodos: await renderPeriodo(),
      status: await renderStatus(statusPacienteCod),
    };

    return dropDownList;
  };

  const renderDropdownPatientCrud = async (statusPacienteCod: string) => {
    const dropDownList = {
      pacientes: await renderPacientes(statusPacienteCod),
      statusEventos: await renderStatusEventos(),
      modalidades: await renderModalidade(statusPacienteCod),
      terapeutas: await renderTerapeutas(),
      especialidades: await renderEspecialidade,
      convenios: await renderConvenio,
      tipoSessao: await renderTipoSessao(),
      status: await renderStatus(statusPacienteCod),
    };

    return dropDownList;
  };

  const renderDropdownBaixa = async (statusPacienteCod: string) => {
    const dropDownList = {
      pacientes: await renderPacientes(statusPacienteCod),
      convenios: await renderConvenio,
      terapeutas: await renderTerapeutas(),
      localidades: await renderLocalidade(),
    };

    return dropDownList;
  };

  const renderDropdownCalendar = async (statusPacienteCod: string) => {
    let pacientes;
    if (
      perfil === COORDENADOR ||
      perfil === COORDENADOR_TERAPEUTA ||
      perfil === TERAPEUTA
    ) {
      const auth: any = await sessionStorage.getItem('auth');
      const user = JSON.parse(auth);
      pacientes = await renderPacientesTerapeuta(user.id);
    } else {
      pacientes = await renderPacientes(statusPacienteCod);
    }

    const dropDownList = {
      pacientes: pacientes,
      statusEventos: await renderStatusEventos(),
      modalidades: await renderModalidade(statusPacienteCod),
      terapeutas: await renderTerapeutas(),
    };

    return dropDownList;
  };

  const renderDropdownFinancial = async (statusPacienteCod: string) => {
    const dropDownList = {
      terapeutas: await renderTerapeutas(),
      pacientes: await renderPacientes(statusPacienteCod),
      statusEventos: await renderStatusEventos(),
    };

    return dropDownList;
  };

  const renderDropdownCrud = async () => {
    const dropDownList = {
      funcoes: await renderFuncao(),
      especialidades: await renderEspecialidade,
      perfies: await renderPerfil,
      permissoes: await renderPermissao,
      grupoPermissoes: await renderGrupoPermissoes()
    };

    return dropDownList;
  };

  return (
    <DropdownContext.Provider
      value={{
        renderPacientes,
        renderStatusEventos,
        renderModalidade,
        renderFrequencia,
        renderLocalidade,
        renderFuncao,
        renderTerapeutas,
        renderDropdownCalendario,
        renderDropdownCrud,
        renderEspecialidadeFuncao,
        renderEspecialidadeTerapeuta,
        renderTerapeutaFuncao,
        renderDropdownPatientCrud,
        renderPacienteEspecialidade,
        renderDropdownQueue,
        renderDropdownQueueCalendar,
        renderDropdownCalendar,
        renderDropdownFinancial,
        renderDropdownBaixa
      }}
    >
      {children}
    </DropdownContext.Provider>
  );
};

export function useDropdown() {
  const context = useContext(DropdownContext);
  return context;
}
