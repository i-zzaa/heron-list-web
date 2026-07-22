import { Routes, Route } from 'react-router-dom';
import { permissionAuth } from '../contexts/permission';
import { Layout } from '../foms/Layout';
import { Nav } from '../components/Nav';
import { Crud } from '../pages/Crud';
import Dashboard from '../pages/Dashboard';
import Home from '../pages/Home';
import Queue from '../pages/Queue';
import Schedule from '../pages/Schedule';
import Financial from '../pages/Financial';
import AmilGuides from '../pages/AmilGuides';
import { useContext } from 'react';
import { LayoutContext } from '../contexts/layout.context';

export enum CONSTANTES_ROUTERS {
  HOME = 'home',
  DASHBOARD = 'dashboard',
  QUEUE = 'fila',
  CRUD = 'cadastro',
  CALENDAR = 'agenda',
  FINANCEIRO = 'financeiro',
  AMIL_GUIDES = 'guia',
}
export interface RoutesProps {
  path: string;
  componentRoute: any;
  icon: string;
  permission?: string;
}

export const ROUTES = [
  { path: '*', componentRoute: Home, icon: '', permission: '*' },
  { path: CONSTANTES_ROUTERS.HOME, componentRoute: Home, icon: 'pi pi-home', permission: CONSTANTES_ROUTERS.HOME },
  // { path: CONSTANTES_ROUTERS.DASHBOARD, componentRoute: Dashboard, icon: 'pi pi-chart-pie' },
  { path: CONSTANTES_ROUTERS.CRUD, componentRoute: Crud, icon: 'pi pi-credit-card', permission: CONSTANTES_ROUTERS.CRUD },
  { path: CONSTANTES_ROUTERS.QUEUE, componentRoute: Queue , icon: 'pi pi-sort-amount-down', permission: CONSTANTES_ROUTERS.QUEUE},
  { path: CONSTANTES_ROUTERS.CALENDAR, componentRoute: Schedule, icon: 'pi pi-calendar', permission: CONSTANTES_ROUTERS.CALENDAR },
  { path: CONSTANTES_ROUTERS.FINANCEIRO, componentRoute: Financial , icon: 'pi pi-money-bill', permission: CONSTANTES_ROUTERS.FINANCEIRO},
  { path: CONSTANTES_ROUTERS.AMIL_GUIDES, componentRoute: AmilGuides, icon: 'pi pi-file', permission: 'GUIAS_AMIL' },
]

const OtherRoutes = () => {
  const { hasPermition } = permissionAuth();
  const { open } = useContext(LayoutContext);

  const routes: RoutesProps[] = ROUTES;

  return (
    <div className="min-h-full overflow-hidden bg-background h-screen w-full">
      <Nav />
      <main className={`${ open ? 'ml-36' : 'ml-14'} p-4 duration-700`}>
        <Routes>
          {routes.map((route: RoutesProps, index: number) => (
            <Route
              key={index}
              path={route.path}
              element={
                hasPermition(route.permission || route.path) ? (
                  <Layout>
                    <route.componentRoute />
                  </Layout>
                ) : null
              }
            />
          ))}
        </Routes>
      </main>
    </div>
  );
};

export default OtherRoutes;
