import { useState } from 'react';

import CrudSimples from '../templates/crudSimples';
import { getList } from '../server';
import { useToast } from '../contexts/toast';
import { TemporaryPasswordModal } from '../components';
import Patient from './Patient';
import { permissionAuth } from '../contexts/permission';
import { buildErrorToast } from '../util/error';
import { usePersistedTabIndex } from '../hooks/usePersistedTabIndex';
import { SecaoCadastro } from './cadastro/ListaCadastro';
import './cadastro/cadastro.css';

interface Cadastro extends SecaoCadastro {
  permission: string;
  grupo: string;
  // Rótulo curto do menu (o título da seção pode ser mais longo).
  menu: string;
  namelist?: string;
  onClick?: (id: number) => void;
  iconButtonFooter?: string;
  textButtonFooter?: string;
  // Nome no singular/plural para a contagem da lista e a busca.
  singular: string;
  // Texto do botão de criar ("Novo usuário", "Nova sala").
  novo: string;
  plural: string;
}

const GRUPOS = ['Pessoas', 'Atendimento', 'Estrutura', 'Acesso e suporte'];

export const Crud = () => {
  const { renderToast } = useToast();
  const { hasPermition } = permissionAuth();
  const { activeIndex, setActiveIndex } =
    usePersistedTabIndex('tab-index-cadastro');

  const [resetSenhaResult, setResetSenhaResult] = useState<{
    senha: string;
    subject?: string;
  } | null>(null);

  const handleResetSenha = async (userId: number) => {
    try {
      // GET /usuarios/reset-senha/:id devolve senhaTemporaria em texto
      // plano só nesta resposta — não tem mais mensagem pronta pra toast.
      const result: any = await getList(`/usuarios/reset-senha/${userId}`);
      setResetSenhaResult({
        senha: result?.senhaTemporaria,
        subject: result?.nome || result?.login,
      });
      renderToast({
        type: 'success',
        title: '',
        message: 'Senha redefinida com sucesso!',
        open: true,
      });
    } catch (error) {
      renderToast(buildErrorToast(error, 'Não foi possível resetar a senha.'));
    }
  };

  const cadastros: Cadastro[] = [
    {
      permission: 'CADASTRO_PACIENTES',
      grupo: 'Pessoas',
      menu: 'Pacientes',
      titulo: 'Pacientes',
      descricao:
        'Pacientes em terapia, com convênio, unidade e especialidades.',
      icone: 'pi pi-users',
      singular: 'paciente',
      novo: 'Novo paciente',
      plural: 'pacientes',
    },
    {
      permission: 'CADASTRO_USUARIOS',
      grupo: 'Pessoas',
      menu: 'Usuários',
      titulo: 'Usuários',
      descricao: 'Quem acessa o sistema: terapeutas, recepção e gestão.',
      icone: 'pi pi-user',
      namelist: 'usuarios',
      onClick: handleResetSenha,
      iconButtonFooter: 'pi pi-key',
      textButtonFooter: 'Redefinir senha',
      singular: 'usuário',
      novo: 'Novo usuário',
      plural: 'usuários',
    },
    {
      permission: 'CADASTRO_ESPECIALIDADE',
      grupo: 'Atendimento',
      menu: 'Especialidades',
      titulo: 'Especialidades',
      descricao: 'Áreas de atendimento e a cor de cada uma na agenda.',
      icone: 'pi pi-tag',
      namelist: 'especialidade',
      singular: 'especialidade',
      novo: 'Nova especialidade',
      plural: 'especialidades',
    },
    {
      permission: 'CADASTRO_FUNCAO',
      grupo: 'Atendimento',
      menu: 'Funções',
      titulo: 'Funções',
      descricao:
        'Funções de cada especialidade, usadas no agendamento e no financeiro.',
      icone: 'pi pi-slack',
      namelist: 'funcao',
      singular: 'função',
      novo: 'Nova função',
      plural: 'funções',
    },
    {
      permission: 'CADASTRO_STATUS_EVENTOS',
      grupo: 'Atendimento',
      menu: 'Status de eventos',
      titulo: 'Status de eventos',
      descricao: 'Situações de uma sessão na agenda e se ela é cobrada.',
      icone: 'pi pi-calendar-plus',
      namelist: 'status-eventos',
      singular: 'status',
      novo: 'Novo status',
      plural: 'status',
    },
    {
      permission: 'CADASTRO_UNIDADE',
      grupo: 'Estrutura',
      menu: 'Unidades',
      titulo: 'Unidades',
      descricao: 'Unidades da clínica.',
      icone: 'pi pi-building',
      namelist: 'unidade',
      singular: 'unidade',
      novo: 'Nova unidade',
      plural: 'unidades',
    },
    {
      permission: 'CADASTRO_LOCALIDADE',
      grupo: 'Estrutura',
      menu: 'Salas',
      titulo: 'Salas (localidades)',
      descricao: 'Casas e salas de atendimento de cada unidade.',
      icone: 'pi pi-map-marker',
      namelist: 'localidade',
      singular: 'sala',
      novo: 'Nova sala',
      plural: 'salas',
    },
    {
      permission: 'CADASTRO_CONVENIO',
      grupo: 'Estrutura',
      menu: 'Convênios',
      titulo: 'Convênios',
      descricao: 'Convênios e particular, usados no cadastro do paciente.',
      icone: 'pi pi-id-card',
      namelist: 'convenio',
      singular: 'convênio',
      novo: 'Novo convênio',
      plural: 'convênios',
    },
    {
      permission: 'CADASTRO_GRUPO_PERMISSOES',
      grupo: 'Acesso e suporte',
      menu: 'Grupos de permissão',
      titulo: 'Grupos de permissão',
      descricao: 'O que cada grupo de usuários pode ver e fazer.',
      icone: 'pi pi-sitemap',
      namelist: 'grupo-permissoes',
      singular: 'grupo',
      novo: 'Novo grupo',
      plural: 'grupos',
    },
    {
      permission: 'CADASTRO_TICKET',
      grupo: 'Acesso e suporte',
      menu: 'Tickets',
      titulo: 'Tickets',
      descricao: 'Chamados de suporte.',
      icone: 'pi pi-ticket',
      namelist: 'ticket',
      singular: 'ticket',
      novo: 'Novo ticket',
      plural: 'tickets',
    },
  ];

  const visiveis = cadastros.filter((c) => Boolean(hasPermition(c.permission)));
  const indice = Math.min(activeIndex, Math.max(visiveis.length - 1, 0));
  const atual = visiveis[indice];

  return (
    <div className="cad-heron" data-testid="cadastro-page">
      <nav className="cad-nav" aria-label="Cadastros">
        <span className="cad-nav-titulo">Cadastros</span>
        <div
          className="cad-nav-grupos"
          role="tablist"
          aria-orientation="vertical"
        >
          {GRUPOS.map((grupo) => {
            const itens = visiveis.filter((c) => c.grupo === grupo);
            if (!itens.length) return null;
            return (
              <div key={grupo} className="cad-grupo">
                <span className="cad-grupo-nome">{grupo}</span>
                <div className="cad-nav-lista">
                  {itens.map((cadastro) => {
                    const i = visiveis.indexOf(cadastro);
                    return (
                      <button
                        key={cadastro.permission}
                        type="button"
                        role="tab"
                        id={`cad-tab-${cadastro.permission}`}
                        aria-selected={i === indice}
                        aria-controls="cad-painel"
                        className="cad-nav-item"
                        onClick={() => setActiveIndex(i)}
                      >
                        <i className={cadastro.icone} />
                        {cadastro.menu}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </nav>

      {atual && (
        <div
          id="cad-painel"
          role="tabpanel"
          aria-labelledby={`cad-tab-${atual.permission}`}
          className="cad-painel"
          data-cadastro-painel
          // key: trocar de cadastro remonta a seção (estado, filtro e lista
          // limpos), como o TabView fazia.
          key={atual.permission}
        >
          {atual.permission === 'CADASTRO_PACIENTES' ? (
            <Patient secao={atual} />
          ) : (
            <CrudSimples
              secao={atual}
              screen={atual.permission}
              namelist={atual.namelist!}
              onClick={atual.onClick || (() => undefined)}
              iconButtonFooter={atual.iconButtonFooter}
              textButtonFooter={atual.textButtonFooter}
              singular={atual.singular}
              novo={atual.novo}
              plural={atual.plural}
            />
          )}
        </div>
      )}

      <TemporaryPasswordModal
        open={!!resetSenhaResult}
        senha={resetSenhaResult?.senha ?? null}
        subject={resetSenhaResult?.subject}
        onClose={() => setResetSenhaResult(null)}
      />
    </div>
  );
};
