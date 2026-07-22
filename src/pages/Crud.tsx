import { TabView, TabPanel } from 'primereact/tabview';

import CrudSimples from '../templates/crudSimples';
import { getList } from '../server';
import { useToast } from '../contexts/toast';
import Patient from './Patient';
import { permissionAuth } from '../contexts/permission';

export const Crud = () => {
  const { renderToast } = useToast();
  const { hasPermition } = permissionAuth();
  const canAccess = (permission: string) => Boolean(hasPermition(permission));
  const noop = () => undefined;

  const handleResetSenha = async (userId: number) => {
    try {
      const { message }: any = await getList(`/usuarios/reset-senha/${userId}`);
      renderToast({
        type: 'success',
        title: '',
        message,
        open: true,
      });
    } catch ({ message }: any) {
      renderToast({
        type: 'failure',
        title: '401',
        message: `${message}`,
        open: true,
      });
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
    </div>
  );
};
