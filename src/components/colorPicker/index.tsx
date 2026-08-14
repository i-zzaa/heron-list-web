import { useRef } from 'react';
import { clsx } from 'clsx';

export interface ColorPickerProps {
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

// Paleta curada: mantém as cores já usadas hoje pelas especialidades fixas
// (TO, FONO, PSICO, MOTRICIDADE, MUSICOTERAPIA, PSICOPEDAG) nas primeiras
// posições, para continuidade visual, e complementa com opções extras para
// novas especialidades.
export const COLOR_PALETTE = [
  '#ef6c00', // TO
  '#f6bf26', // FONO
  '#8e24aa', // PSICO
  '#4285f4', // MOTRICIDADE
  '#795548', // MUSICOTERAPIA
  '#000000', // PSICOPEDAG
  '#2e7d32',
  '#0097a7',
  '#c2185b',
  '#5c6bc0',
  '#ff7043',
  '#616161',
];

export function ColorPicker({ value, onChange, disabled }: ColorPickerProps) {
  const customInputRef = useRef<HTMLInputElement>(null);

  const normalized = value?.toLowerCase();
  const isCustom = !!normalized && !COLOR_PALETTE.includes(normalized);

  return (
    <div className="flex flex-wrap items-center gap-2 py-1">
      {COLOR_PALETTE.map((color) => {
        const selected = normalized === color;
        return (
          <button
            key={color}
            type="button"
            disabled={disabled}
            title={color}
            aria-label={`Selecionar cor ${color}`}
            aria-pressed={selected}
            onClick={() => onChange(color)}
            className={clsx(
              'h-7 w-7 rounded-full transition-transform disabled:cursor-not-allowed disabled:opacity-50',
              'hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-800 focus-visible:ring-offset-2',
              selected && 'ring-2 ring-violet-800 ring-offset-2'
            )}
            style={{ backgroundColor: color }}
          >
            {selected && (
              <i className="pi pi-check text-white" style={{ fontSize: '0.7rem' }} />
            )}
          </button>
        );
      })}

      <button
        type="button"
        disabled={disabled}
        title="Cor personalizada"
        aria-label="Escolher cor personalizada"
        aria-pressed={isCustom}
        onClick={() => customInputRef.current?.click()}
        className={clsx(
          'relative flex h-7 w-7 items-center justify-center rounded-full transition-transform disabled:cursor-not-allowed disabled:opacity-50',
          'hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-800 focus-visible:ring-offset-2',
          isCustom && 'ring-2 ring-violet-800 ring-offset-2'
        )}
        style={{
          backgroundColor: isCustom ? normalized : '#ffffff',
          backgroundImage: isCustom
            ? undefined
            : 'conic-gradient(red, yellow, lime, cyan, blue, magenta, red)',
        }}
      >
        {!isCustom && <i className="pi pi-plus text-white" style={{ fontSize: '0.7rem' }} />}
        {isCustom && <i className="pi pi-check text-white" style={{ fontSize: '0.7rem' }} />}
        <input
          ref={customInputRef}
          type="color"
          value={normalized || '#662977'}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          aria-hidden="true"
          tabIndex={-1}
          // Inline styles (não classes) para vencer a regra global
          // `.label-float input { border; padding; width: 100% }` — sem
          // isso o input nativo ganha padding/borda e passa a interceptar
          // cliques dos outros swatches por baixo.
          style={{
            position: 'absolute',
            width: 0,
            height: 0,
            padding: 0,
            margin: 0,
            border: 'none',
            opacity: 0,
            pointerEvents: 'none',
          }}
        />
      </button>

      {value && (
        <span className="ml-1 text-sm uppercase text-gray-800">{value}</span>
      )}
    </div>
  );
}
