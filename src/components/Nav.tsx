import { NavLink, useLocation } from 'react-router-dom';
import { AuthContext, useAuth } from '../contexts/auth';
import { permissionAuth } from '../contexts/permission';
import { ROUTES, RoutesProps } from '../routes/OtherRoutes';
import { firtUpperCase } from '../util/util';
import { useContext, useEffect, useState } from 'react';
import { LayoutContext } from '../contexts/layout.context';

export const Nav = () => {
  const { Logout } = useAuth();
  const { hasPermition, permissions } = permissionAuth();
  const { open, setOpen } = useContext(LayoutContext);
  const [ menuSidebar, setMenuSidebar ] = useState<RoutesProps[]>([]);
  const { user, perfil } = useContext(AuthContext);

  const location = useLocation()
  
  const renderNav = () => {
    const arrRouterLinks = ROUTES.filter((route: RoutesProps) =>
      hasPermition(route.permission || route.path) && route.path !== '*'
    );
    setMenuSidebar(arrRouterLinks);
  };


  useEffect(() => {
    renderNav()
    // if(permissions.length ){ 
    // };
  }, [permissions]);

  return (
    <aside onMouseEnter={()=>  setOpen(true)} onMouseLeave={()=> setOpen(false)} className={`fixed border-box shadow-3xl ${open ? 'w-36' :'w-12'} h-[98vh] mt-[1vh] ml-1 rounded-3xl  bg-primary duration-700`}>
      {open ? <div className="bg-logo-md-write bg-no-repeat bg-cover h-20 "></div> :  <div className="bg-logo-mini bg-no-repeat bg-cover h-12 w-12 duration-700"></div>}
     
      <div className='border-y border-primary-text my-6 py-2'>
      <h3 className="text-primary-text text-center font-light text-sm  duration-1000"> {  open ? user.nome : user?.nome?.charAt(0) }</h3>  
      { open && <h3 className="text-gray-200 text-center font-light text-xs  duration-1000"> { firtUpperCase(perfil) } </h3>  }
     </div>

      <ul className="list-none p-0 mt-8">
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
      <i onClick={Logout} className={`pi pi-sign-out duration-700 text-primary-text hover:scale-125 cursor-pointer  w-4 col-span-1 fixed bottom-8 ${open ? ' left-[4rem]' : ' left-6'}`} />
    </aside>
  );
};
