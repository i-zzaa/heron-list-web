import { useCallback, useEffect, useState } from 'react';
import Login from '../foms/Login';
import { Title } from '../components/index';
import { getList } from '../server';
import logoMark from '../assets/logo-sm.png';
import logoLg from '../assets/logo-lg.jpg';

import package_json from '../../package.json';

export default function LoginPage() {
  const [version, setVersion] = useState('');

  const getVersion = useCallback(async () => {
    const { data } = await getList('/');
    setVersion(`v${package_json.version} · ${data}`);
  }, []);

  useEffect(() => {
    getVersion();
  }, [getVersion]);

  return (
    <div className="h-screen w-full flex bg-white">
      {/* Brand panel — carries the identity, hidden below the breakpoint where the
          form panel needs the full width. Its right edge is a wave, not a
          straight seam, drawn with an SVG rather than the panel's own box. */}
      <div className="hidden lg:flex lg:w-[44%] relative flex-col justify-center items-center px-12 overflow-hidden">
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            fill="#662977"
            d="M0,0 L88,0 C100,9 78,16 90,26 C102,36 76,42 88,52
               C100,62 78,68 90,78 C100,85 88,92 100,100 L0,100 Z"
          />
        </svg>

        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white opacity-[0.06] blur-3xl" />
        <div className="absolute -bottom-32 -left-16 w-96 h-96 rounded-full bg-white opacity-[0.05] blur-3xl" />

        <img
          src={logoMark}
          alt=""
          className="w-28 h-28 mb-8 relative"
          style={{ filter: 'brightness(0) invert(1)', opacity: 0.95 }}
        />
        <p className="text-white text-2xl font-bold text-center mb-2 relative">
          Multi Alcance
        </p>
        <p className="text-white text-xs uppercase tracking-widest opacity-70 mb-8 relative">
          Núcleo Terapêutico
        </p>
        <p className="text-white text-sm text-center opacity-80 max-w-xs relative">
          Uma agenda para organizar o atendimento multidisciplinar do
          paciente, do agendamento à sessão.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-sm">
            {/* Compact brand lockup — only shown when the panel above is hidden */}
            <div className="lg:hidden flex justify-center mb-8">
              <img src={logoLg} alt="Multi Alcance" className="h-16" />
            </div>

            <Title size="lg" color="gray-dark">
              Acesse sua agenda
            </Title>
            <p className="text-gray-400 text-sm mt-2 mb-8">
              Entre com seu login e senha para continuar.
            </p>

            <Login />
          </div>
        </div>

        <div className="text-xs text-gray-300 text-center pb-4">
          {version}
        </div>
      </div>
    </div>
  );
}
