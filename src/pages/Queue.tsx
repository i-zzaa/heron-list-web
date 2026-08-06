import { TabPanel, TabView } from 'primereact/tabview';
import { permissionAuth } from '../contexts/permission';
import Avaliation from './Avaliation';
import Devolutiva from './Devolutiva';
import Therapy from './Therapy';

export default function Queue() {
  const { hasPermition } = permissionAuth();

  const renderTabPanel = () => {
    return (
      <TabView className="tabview-custom">
        {hasPermition('FILA_AVALIACAO') ? (
          <TabPanel header="Avaliacão" leftIcon="pi pi-user">
            <Avaliation />
          </TabPanel>
        ) : (
          <></>
        )}
        {hasPermition('FILA_DEVOLUTIVA') ? (
          <TabPanel header="Devolutiva" leftIcon="pi pi-user">
            <Devolutiva />
          </TabPanel>
        ) : (
          <></>
        )}
        {hasPermition('FILA_TERAPIA') ? (
          <TabPanel header="Terapia" leftIcon="pi pi-user">
            <Therapy />
          </TabPanel>
        ) : (
          <></>
        )}
      </TabView>
    );
  };

  return <div className="card">{renderTabPanel()}</div>;
}
