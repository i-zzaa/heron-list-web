import { TabPanel, TabView } from "primereact";
import { COORDENADOR, COORDENADOR_TERAPEUTA, permissionAuth } from "../contexts/permission";
import Avaliation from "./Avaliation";
import Therapy from "./Therapy";

export default function Queue() {
  const { perfil } = permissionAuth();

  const renderTabPanel = () => {
    if (perfil === COORDENADOR || perfil === COORDENADOR_TERAPEUTA) {
      return  <Avaliation />
    } else {
      return (
        <TabView className="tabview-custom" >
          <TabPanel header="Avaliacão" leftIcon="pi pi-user" >
            <Avaliation />
          </TabPanel>
          <TabPanel header="Terapia" leftIcon="pi pi-user">
          <Therapy />
        </TabPanel>
      </TabView>
      )
    }
  }

  return (
    <div className="card">
      {renderTabPanel()}
    </div>
  );
}
