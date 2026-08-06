import { TabPanel, TabView } from 'primereact/tabview';
import { permissionAuth } from '../contexts/permission';
import Avaliation from './Avaliation';
import Therapy from './Therapy';
import ScheduleCalendar from './ScheduleCalendar';
import Baixa from './Baixa';

export default function Schedule() {
  const { hasPermition } = permissionAuth();

  const renderTabPanel = () => {
    return (
      <TabView className="tabview-custom">
        {hasPermition('AGENDA_CALENDARIO') ? (
          <TabPanel header="Agenda" leftIcon="pi pi-calendar">
            <ScheduleCalendar />
          </TabPanel>
        ) : (
          <></>
        )}
        {hasPermition('AGENDA_BAIXA') ? (
          <TabPanel header="Baixa" leftIcon="pi pi-book">
            <Baixa />
          </TabPanel>
        ) : (
          <></>
        )}
      </TabView>
    );
  };

  return <div className="card">{renderTabPanel()}</div>;
}
