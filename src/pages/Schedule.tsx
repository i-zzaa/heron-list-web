import { TabPanel, TabView } from 'primereact/tabview';
import { permissionAuth } from '../contexts/permission';
import { usePersistedTabIndex } from '../hooks/usePersistedTabIndex';
import ScheduleCalendar from './ScheduleCalendar';
import Baixa from './Baixa';

export default function Schedule() {
  const { hasPermition } = permissionAuth();
  const { activeIndex, setActiveIndex } =
    usePersistedTabIndex('tab-index-agenda');

  const renderTabPanel = () => {
    return (
      <TabView
        className="tabview-custom"
        activeIndex={activeIndex}
        onTabChange={(e) => setActiveIndex(e.index)}
      >
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
