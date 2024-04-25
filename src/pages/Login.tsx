import { useCallback, useEffect, useState } from 'react';
import Header from '../components/Header';
import Login from '../foms/Login';
import { getList } from '../server';

import package_json from '../../package.json';

export default function LoginPage() {
  const [version, setVersion] = useState('');

  const getVersion = useCallback(async () => {
    const { data } = await getList('/');
    setVersion(`versão frontend: ${package_json.version} - ${data}`);
  }, []);

  useEffect(() => {
    getVersion();
  }, [getVersion]);

  return (
    <>
      <Header heading="Agenda | Multi Alcance" />
      <Login />
      <div className="text-xs absolute bottom-0 text-gray-300 left-0  w-full flex justify-center">
        <div className="">{version}</div>
      </div>
    </>
  );
}
