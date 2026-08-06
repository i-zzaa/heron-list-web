import { useCallback, useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import Login from '../foms/Login';
import { getList } from '../server';
import logoMark from '../assets/logo-sm.png';
import logoLg from '../assets/logo-lg.jpg';

import package_json from '../../package.json';

// Peça de quebra-cabeça reaproveitada tanto no cantinho de destaque quanto
// espalhada de fundo pelo painel roxo — mesmo traço do ícone da marca (ver
// logo-sm.png), só que como textura decorativa em baixa opacidade.
const PuzzlePiece = ({
  className,
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) => (
  <svg
    viewBox="0 0 100 100"
    className={className}
    style={style}
    fill="none"
    stroke="currentColor"
    strokeWidth="4"
    aria-hidden="true"
  >
    <path
      strokeLinejoin="round"
      d="M28,18 L45,18
         C45,10 55,10 55,18
         L72,18
         Q82,18 82,28
         L82,45
         C74,45 74,55 82,55
         L82,72
         Q82,82 72,82
         L55,82
         C55,90 45,90 45,82
         L28,82
         Q18,82 18,72
         L18,55
         C26,55 26,45 18,45
         L18,28
         Q18,18 28,18 Z"
    />
  </svg>
);

// Posições/tamanhos/rotações fixos (não randômicos): randomizar a cada
// render faria as peças "pularem" de lugar sempre que o componente
// re-renderizasse.
const SCATTERED_PUZZLE_PIECES = [
  { top: '10%', left: '68%', size: 'w-8 h-8', rotate: 20, opacity: 'opacity-10' },
  { top: '22%', left: '14%', size: 'w-6 h-6', rotate: -25, opacity: 'opacity-[0.08]' },
  { top: '38%', left: '80%', size: 'w-10 h-10', rotate: 10, opacity: 'opacity-10' },
  { top: '58%', left: '10%', size: 'w-7 h-7', rotate: 35, opacity: 'opacity-[0.07]' },
  { top: '68%', left: '72%', size: 'w-6 h-6', rotate: -15, opacity: 'opacity-[0.09]' },
  { top: '82%', left: '30%', size: 'w-9 h-9', rotate: 5, opacity: 'opacity-[0.08]' },
  { top: '48%', left: '45%', size: 'w-5 h-5', rotate: -30, opacity: 'opacity-[0.06]' },
];

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
      {/* Brand panel — hidden below the breakpoint where the form panel
          needs the full width. The wavy edge is one smooth blob curve
          drawn in white on top of the solid purple panel, not a jagged
          multi-segment seam. */}
      <div className="hidden lg:flex lg:w-[42%] relative flex-col items-center px-14 py-12 overflow-hidden bg-[#662977]">
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {/* Preenchimento no tom do fundo claro do painel do formulário
              (background: #f9f9f9), não branco puro — senão a onda cria
              uma emenda visível contra o painel claro ao lado. */}
          <path
            fill="#f9f9f9"
            d="M100,0 L95,0
               C102,10 90,20 97,30
               C104,38 92,48 98,58
               C103,66 91,76 97,86
               C101,92 94,97 98,100
               L100,100 Z"
          />
        </svg>

        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white opacity-[0.06] blur-3xl" />
        <div className="absolute -bottom-28 -left-20 w-96 h-96 rounded-full bg-white opacity-[0.07] blur-3xl" />

        {/* Peças de quebra-cabeça espalhadas de fundo, bem discretas —
            textura decorativa, não devem competir com o conteúdo central. */}
        {SCATTERED_PUZZLE_PIECES.map((piece, index) => (
          <PuzzlePiece
            key={index}
            className={`absolute text-white ${piece.size} ${piece.opacity}`}
            style={{ top: piece.top, left: piece.left, transform: `rotate(${piece.rotate}deg)` }}
          />
        ))}

        {/* Cantinho decorativo — uma peça de quebra-cabeça em destaque,
            ecoando o ícone da marca (ver logo-sm.png). */}
        <PuzzlePiece className="absolute top-8 left-8 w-12 h-12 text-white opacity-20 rotate-[-12deg]" />

        <div className="relative flex-1 flex flex-col items-center justify-center text-center max-w-xs mx-auto">
          <img
            src={logoMark}
            alt=""
            className="w-24 h-24 mb-4"
            style={{ filter: 'brightness(0) invert(1)', opacity: 0.95 }}
          />

          <p
            className="text-white text-5xl leading-none mb-1"
            style={{ fontFamily: "'Dancing Script', cursive" }}
          >
            Multi Alcance
          </p>
          <p className="text-white text-xs uppercase tracking-[0.25em] opacity-70 mb-5">
            Núcleo Terapêutico
          </p>

          <div className="flex items-center gap-3 w-full max-w-[180px] mb-5">
            <span className="h-px flex-1 bg-white opacity-30" />
            <i className="pi pi-heart-fill text-white opacity-70" style={{ fontSize: 11 }} />
            <span className="h-px flex-1 bg-white opacity-30" />
          </div>

          <p className="text-white font-bold mb-2">Cuidado que transforma.</p>
          <p className="text-white text-sm opacity-80 leading-relaxed">
            Organizamos o atendimento multidisciplinar de forma integrada
            para apoiar o desenvolvimento de crianças e suas famílias.
          </p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex flex-col overflow-y-auto bg-background">
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg border border-gray-200 px-8 py-10">
            {/* Compact brand lockup — only shown when the panel above is hidden */}
            <div className="lg:hidden flex justify-center mb-8">
              <img src={logoLg} alt="Multi Alcance" className="h-14" />
            </div>

            <div className="flex justify-center mb-5">
              <div className="w-16 h-16 rounded-full bg-[#662977]/10 flex items-center justify-center">
                <i className="pi pi-calendar text-violet-800" style={{ fontSize: 26 }} />
              </div>
            </div>

            <h1 className="text-lg font-bold text-center text-gray-800">
              Acesse sua agenda
            </h1>
            <p className="text-gray-400 text-sm text-center mt-1 mb-8">
              Entre com seu login e senha para continuar.
            </p>

            <Login />

            <div className="flex items-center justify-center gap-2 mt-6 text-gray-400">
              <i className="pi pi-shield" style={{ fontSize: 12 }} />
              <span className="text-xs">Ambiente seguro e confidencial</span>
            </div>
          </div>
        </div>

        <div className="text-xs text-gray-300 text-center pb-4">
          {version}
        </div>
      </div>
    </div>
  );
}
