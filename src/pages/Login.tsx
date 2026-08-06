import { useCallback, useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import Login from '../foms/Login';
import { getList } from '../server';
import logoMark from '../assets/logo-sm.png';
import logoLg from '../assets/logo-lg.jpg';

import package_json from '../../package.json';

// Cada lado de uma peça pode ser reto, ter um "nó" saindo pra fora (tab) ou
// um encaixe entrando pra dentro (blank) — a mesma anatomia das peças em
// src/assets/Puzzle Pieces Separated Outline.jpg, usada aqui como modelo.
type PieceEdgeKind = 'flat' | 'tab' | 'blank';
type PieceEdges = {
  top: PieceEdgeKind;
  right: PieceEdgeKind;
  bottom: PieceEdgeKind;
  left: PieceEdgeKind;
};

// Desenha um lado do quadrado. Pra "tab"/"blank" o traço sai da borda, afina
// num pescoço estreito e abre num nó redondo (arco de círculo) antes de
// afinar de novo e voltar — é esse afinamento que faz o nó "prender" e
// parecer peça de quebra-cabeça de verdade, em vez de só uma onda lisa.
const puzzleEdge = (
  [x0, y0]: [number, number],
  [x1, y1]: [number, number],
  kind: PieceEdgeKind,
) => {
  if (kind === 'flat') return `L${x1},${y1}`;

  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy);
  const ux = dx / len;
  const uy = dy / len;
  const nx = uy; // normal apontando pra fora da peça (caminho no sentido horário)
  const ny = -ux;
  const dir = kind === 'tab' ? 1 : -1;

  const halfNeck = len * 0.13;
  const knobR = len * 0.16;
  const protrude = len * 0.24;

  const point = (t: number, offset = 0): [number, number] => [
    x0 + dx * t + nx * offset * dir,
    y0 + dy * t + ny * offset * dir,
  ];

  const n1 = point(0.5 - halfNeck / len);
  const n2 = point(0.5 - knobR / len, protrude * 0.42);
  const n3 = point(0.5 - knobR / len, protrude);
  const n4 = point(0.5 + knobR / len, protrude);
  const n5 = point(0.5 + knobR / len, protrude * 0.42);
  const n6 = point(0.5 + halfNeck / len);
  const sweep = kind === 'tab' ? 1 : 0;

  return `L${n1} C${n2} ${n2} ${n3} A${knobR},${knobR} 0 0 ${sweep} ${n4} C${n5} ${n5} ${n6} L${x1},${y1}`;
};

// Quadrado de cantos retos (não arredondados, como no modelo) com os 4 lados
// definidos por `edges`.
const buildPuzzlePiecePath = (edges: PieceEdges) => {
  const corners: [number, number][] = [
    [22, 22],
    [78, 22],
    [78, 78],
    [22, 78],
  ];
  return [
    `M${corners[0]}`,
    puzzleEdge(corners[0], corners[1], edges.top),
    puzzleEdge(corners[1], corners[2], edges.right),
    puzzleEdge(corners[2], corners[3], edges.bottom),
    puzzleEdge(corners[3], corners[0], edges.left),
    'Z',
  ].join(' ');
};

// Peça de quebra-cabeça reaproveitada tanto no cantinho de destaque quanto
// espalhada de fundo pelo painel roxo, como textura decorativa em baixa
// opacidade.
const PuzzlePiece = ({
  className,
  style,
  edges = { top: 'tab', right: 'blank', bottom: 'tab', left: 'blank' },
}: {
  className?: string;
  style?: CSSProperties;
  edges?: PieceEdges;
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
    <path strokeLinejoin="round" strokeLinecap="round" d={buildPuzzlePiecePath(edges)} />
  </svg>
);

// Posições/tamanhos/rotações/lados fixos (não randômicos): randomizar a cada
// render faria as peças "pularem" de lugar sempre que o componente
// re-renderizasse. As combinações de lados variam peça a peça, ecoando as
// diferentes peças do modelo (algumas com lado reto de borda, outras só com
// nós/encaixes).
const SCATTERED_PUZZLE_PIECES: {
  top: string;
  left: string;
  size: string;
  rotate: number;
  opacity: string;
  edges: PieceEdges;
}[] = [
  {
    top: '10%', left: '68%', size: 'w-8 h-8', rotate: 20, opacity: 'opacity-10',
    edges: { top: 'flat', right: 'tab', bottom: 'tab', left: 'tab' },
  },
  {
    top: '22%', left: '14%', size: 'w-6 h-6', rotate: -25, opacity: 'opacity-[0.08]',
    edges: { top: 'blank', right: 'tab', bottom: 'blank', left: 'tab' },
  },
  {
    top: '38%', left: '80%', size: 'w-10 h-10', rotate: 10, opacity: 'opacity-10',
    edges: { top: 'tab', right: 'blank', bottom: 'tab', left: 'blank' },
  },
  {
    top: '58%', left: '10%', size: 'w-7 h-7', rotate: 35, opacity: 'opacity-[0.07]',
    edges: { top: 'blank', right: 'blank', bottom: 'tab', left: 'tab' },
  },
  {
    top: '68%', left: '72%', size: 'w-6 h-6', rotate: -15, opacity: 'opacity-[0.09]',
    edges: { top: 'tab', right: 'tab', bottom: 'blank', left: 'blank' },
  },
  {
    top: '82%', left: '30%', size: 'w-9 h-9', rotate: 5, opacity: 'opacity-[0.08]',
    edges: { top: 'flat', right: 'blank', bottom: 'tab', left: 'blank' },
  },
  {
    top: '48%', left: '45%', size: 'w-5 h-5', rotate: -30, opacity: 'opacity-[0.06]',
    edges: { top: 'blank', right: 'tab', bottom: 'flat', left: 'tab' },
  },
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
            edges={piece.edges}
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
            className="w-[12rem] h-[12rem] -mb-8"
            style={{ filter: 'brightness(0) invert(1)', opacity: 0.95 }}
          />

          <p
            className="text-white text-[2rem] leading-none mb-1"
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

          <p className="text-yellow-400 font-bold mb-2">Cuidado que transforma.</p>
          <p className="text-white text-sm opacity-80 leading-relaxed">
            Organizamos o atendimento multidisciplinar de forma integrada
            para apoiar o desenvolvimento de crianças e suas famílias.
          </p>
        </div>
      </div>

      {/* Form panel — padding/margens enxutos de propósito: em telas mais
          baixas (laptop com barra de endereço, zoom, etc.) o card inteiro
          precisa caber em h-screen sem precisar de scroll interno. */}
      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto bg-background">
        <div className="flex-1 flex items-center justify-center px-6 py-4 min-h-0">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg border border-gray-200 px-8 py-6 max-h-full overflow-y-auto">
            {/* Compact brand lockup — only shown when the panel above is hidden */}
            <div className="lg:hidden flex justify-center mb-5">
              <img src={logoLg} alt="Multi Alcance" className="h-14" />
            </div>

            <div className="flex justify-center mb-3">
              <div className="w-14 h-14 rounded-full bg-[#662977]/10 flex items-center justify-center">
                <i className="pi pi-calendar text-violet-800" style={{ fontSize: 22 }} />
              </div>
            </div>

            <h1 className="text-lg font-bold text-center text-gray-800">
              Acesse sua agenda
            </h1>
            <p className="text-gray-400 text-sm text-center mt-1 mb-4">
              Entre com seu login e senha para continuar.
            </p>

            <Login />

            <div className="flex items-center justify-center gap-2 mt-4 text-gray-400">
              <i className="pi pi-shield" style={{ fontSize: 12 }} />
              <span className="text-xs">Ambiente seguro e confidencial</span>
            </div>
          </div>
        </div>

        <div className="text-xs text-gray-300 text-center pb-2 shrink-0">
          {version}
        </div>
      </div>
    </div>
  );
}
