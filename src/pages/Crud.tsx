import { useState } from 'react';
import { TabView, TabPanel } from 'primereact/tabview';

import CrudSimples from '../templates/crudSimples';
import { getList } from '../server';
import { useToast } from '../contexts/toast';
import { TemporaryPasswordModal } from '../components';
import Patient from './Patient';
import { permissionAuth } from '../contexts/permission';
import { buildErrorToast } from '../util/error';

export const Crud = () => {
  const { renderToast } = useToast();
  const { hasPermition } = permissionAuth();
  const canAccess = (permission: string) => Boolean(hasPermition(permission));
  const noop = () => undefined;

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
      return;
    }
  };

  const crudTabs = [
    {
      permission: 'CADASTRO_USUARIOS',
      header: 'Usuários',
      leftIcon: 'pi pi-user',
      screen: 'CADASTRO_USUARIOS',
      namelist: 'usuarios',
      onClick: handleResetSenha,
      iconButtonFooter: 'pi pi-sync',
      textButtonFooter: 'Reset de senha',
    },
    {
      permission: 'CADASTRO_STATUS_EVENTOS',
      header: 'Status eventos',
      leftIcon: 'pi pi-calendar-plus',
      screen: 'CADASTRO_STATUS_EVENTOS',
      namelist: 'status-eventos',
      onClick: noop,
    },
    {
      permission: 'CADASTRO_ESPECIALIDADE',
      header: 'Especialidade',
      leftIcon: 'pi pi-tag',
      screen: 'CADASTRO_ESPECIALIDADE',
      namelist: 'especialidade',
      onClick: noop,
    },
    {
      permission: 'CADASTRO_FUNCAO',
      header: 'Função',
      leftIcon: 'pi pi-slack',
      screen: 'CADASTRO_FUNCAO',
      namelist: 'funcao',
      onClick: noop,
    },
    {
      permission: 'CADASTRO_LOCALIDADE',
      header: 'Localidade',
      leftIcon: 'pi pi-map-marker',
      screen: 'CADASTRO_LOCALIDADE',
      namelist: 'localidade',
      onClick: noop,
    },
    {
      permission: 'CADASTRO_GRUPO_PERMISSOES',
      header: 'Grupo Permissões',
      leftIcon: 'pi pi-sitemap',
      screen: 'CADASTRO_GRUPO_PERMISSOES',
      namelist: 'grupo-permissoes',
      onClick: noop,
    },
  ];

  return (
    <div className="card">
      <TabView className="tabview-custom">
        {canAccess('CADASTRO_PACIENTES') && (
          <TabPanel header="Pacientes" leftIcon="pi pi-user">
            <Patient />
          </TabPanel>
        )}
        {crudTabs.map((tab) =>
          canAccess(tab.permission) ? (
            <TabPanel
              key={tab.permission}
              header={tab.header}
              leftIcon={tab.leftIcon}
            >
              <CrudSimples
                screen={tab.screen}
                namelist={tab.namelist}
                onClick={tab.onClick}
                iconButtonFooter={tab.iconButtonFooter}
                textButtonFooter={tab.textButtonFooter}
              />
            </TabPanel>
          ) : null
        )}
        {/* {hasPermition('CADASTRO_FREQUENCIA') ? (
          <TabPanel header="Frequência" leftIcon="pi pi-table">
            <CrudSimples
              screen="CADASTRO_FREQUENCIA"
              namelist="frequencia"
              onClick={() => {}}
            />
          </TabPanel>
        ) : (
          <></>
        )} */}
      </TabView>

      <TemporaryPasswordModal
        open={!!resetSenhaResult}
        senha={resetSenhaResult?.senha ?? null}
        subject={resetSenhaResult?.subject}
        onClose={() => setResetSenhaResult(null)}
      />
    </div>
  );
};
