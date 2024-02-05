import { TabView, TabPanel } from 'primereact/tabview';

import CrudSimples from '../templates/crudSimples';
import { getList } from '../server';
import { useToast } from '../contexts/toast';
import Patient from './Patient';
import { permissionAuth } from '../contexts/permission';

export const Crud = () => {
  const { renderToast } = useToast();
  const { hasPermition } = permissionAuth();

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

  return (
    <div className="card">
      <TabView className="tabview-custom">        
        {hasPermition('CADASTRO_PACIENTES') ? (
          <TabPanel header="Pacientes" leftIcon="pi pi-user">
            <Patient />
          </TabPanel>
        ) : (
          <></>
        )}
        {hasPermition('CADASTRO_USUARIOS') ? (
          <TabPanel header="Usuários" leftIcon="pi pi-user">
            <CrudSimples
              screen="CADASTRO_USUARIOS"
              namelist="usuarios"
              onClick={handleResetSenha}
              iconButtonFooter="pi pi-sync"
              textButtonFooter="Reset de senha"
            />
          </TabPanel>
        ) : (
          <></>
        )}
        {hasPermition('CADASTRO_STATUS_EVENTOS') ? (
          <TabPanel header="Status eventos" leftIcon="pi pi-calendar-plus">
            <CrudSimples
              screen="CADASTRO_STATUS_EVENTOS"
              namelist="status-eventos"
              onClick={() => {}}
            />
          </TabPanel>
        ) : (
          <></>
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
        {hasPermition('CADASTRO_FUNCAO') ? (
          <TabPanel header="Função" leftIcon="pi pi-slack">
            <CrudSimples
              screen="CADASTRO_FUNCAO"
              namelist="funcao"
              onClick={() => {}}
            />
          </TabPanel>
        ) : (
          <></>
        )}
        {hasPermition('CADASTRO_LOCALIDADE') ? (
          <TabPanel header="Localidade" leftIcon="pi pi-map-marker">
            <CrudSimples
              screen="CADASTRO_LOCALIDADE"
              namelist="localidade"
              onClick={() => {}}
            />
          </TabPanel>
        ) : (
          <></>
        )}
              {hasPermition('CADASTRO_GRUPO_PERMISSOES') ? (
          <TabPanel header="Grupo Permissões" leftIcon="pi pi-sitemap">
            <CrudSimples
              screen="CADASTRO_GRUPO_PERMISSOES"
              namelist="grupo-permissoes"
              onClick={() => {}}
            />
          </TabPanel>
        ) : (
          <></>
        )}

      </TabView>
    </div>
  );
};
