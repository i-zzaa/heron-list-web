import { NavLink, useLocation } from 'react-router-dom';
import { AuthContext, useAuth } from '../contexts/auth';
import { permissionAuth } from '../contexts/permission';
import { CONSTANTES_ROUTERS, ROUTES, RoutesProps } from '../routes/OtherRoutes';
import { firtUpperCase } from '../util/util';
import { useContext, useMemo } from 'react';
import { LayoutContext } from '../contexts/layout.context';

export const Nav = () => {
  const { Logout } = useAuth();
  const { hasPermition, permissions } = permissionAuth();
  const { open, setOpen } = useContext(LayoutContext);
  const { user, perfil } = useContext(AuthContext);

  const location = useLocation();

  // Perfil sai da lista principal e vira sua própria entrada, fixada
  // embaixo (acima do logout) — não é "mais uma tela do sistema", é
  // configuração da conta do usuário.
  const menuSidebar = useMemo(() => {
    return ROUTES.filter(
      (route: RoutesProps) =>
        hasPermition(route.permission || route.path) &&
        route.path !== '*' &&
        route.path !== CONSTANTES_ROUTERS.PROFILE
    );
  }, [hasPermition, permissions]);

  const profileRoute = useMemo(
    () => ROUTES.find((route: RoutesProps) => route.path === CONSTANTES_ROUTERS.PROFILE),
    []
  );
  const isProfileActive = profileRoute
    ? location.pathname.startsWith(profileRoute.path)
    : false;

  return (
    <aside onMouseEnter={()=>  setOpen(true)} onMouseLeave={()=> setOpen(false)} className={`fixed border-box shadow-3xl ${open ? 'w-36' :'w-12'} h-[98vh] mt-[1vh] ml-1 rounded-3xl  bg-primary duration-700 flex flex-col`}>
      {open ? <div className="bg-logo-md-write bg-no-repeat bg-cover h-20 "></div> :  <div className="bg-logo-mini bg-no-repeat bg-cover h-12 w-12 duration-700"></div>}

      {/* O bloco de nome/perfil é o próprio link pra tela de Perfil — em
          vez de um item separado no menu, é onde o usuário já espera
          clicar pra ver/editar a própria conta. */}
      <NavLink
        to={profileRoute?.path || CONSTANTES_ROUTERS.PROFILE}
        data-testid="nav-profile-link"
        className={`block border-y border-primary-text my-6 py-2 duration-700 ${
          isProfileActive ? 'bg-primary-hover' : 'hover:bg-primary-hover'
        }`}
      >
        <h3 className={`text-center font-light text-sm duration-1000 ${isProfileActive ? 'text-primary-text-hover' : 'text-primary-text'}`}> {  open ? user.nome : user?.nome?.charAt(0) }</h3>
        { open && <h3 className={`text-center font-light text-xs duration-1000 ${isProfileActive ? 'text-primary-text-hover' : 'text-gray-200'}`}> { firtUpperCase(perfil) } </h3>  }
      </NavLink>

      <ul className="list-none p-0 mt-8 flex-1 overflow-y-auto overflow-x-hidden">
          {
            menuSidebar.map((element: any) => {
              const isActive = location.pathname.startsWith(element.path)

              return (
                <li  key={element.path} className={`${isActive ? 'bg-primary-hover text-primary-text-hover' :  'text-primary-text'} hover:px-0 hover:bg-primary-hover  hover:text-primary-text-hover duration-700`} >
                  <NavLink  to={element.path} className='grid grid-cols-3 items-center text-sm px-4 py-4 '>
                    <i className={element.icon} />

                    {open &&  <span  className='duration-700'>{firtUpperCase(element.path) }</span>}
                  </NavLink>
                </li>
              )
            })
          }
      </ul>

      <div className="grid grid-cols-3 items-center px-4 py-3">
        <i
          onClick={Logout}
          className="pi pi-sign-out duration-700 text-primary-text hover:scale-125 cursor-pointer w-4"
        />
      </div>
    </aside>
  );
};
