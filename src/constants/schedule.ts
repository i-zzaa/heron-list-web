export enum STATUS_EVENTS {
  atendido = 'Atendido',
  atestado = 'Atestado',
  livre = 'Livre',
}

// Cores do selo de status do evento (agenda e detalhe do evento).
export const getStatusEventoTone = (nome?: string | null) => {
  const status = String(nome || '').trim().toLowerCase();

  if (status === 'atendido') return 'bg-green-400/10 text-[#15803d]';
  if (status === 'falta') return 'bg-red-400/10 text-[#b91c1c]';
  if (status.includes('cancelado')) return 'bg-background text-gray-800';
  if (status === 'confirmado') return 'bg-violet-800/10 text-violet-800';
  if (status === 'avisar') return 'bg-[#fef3c7] text-[#92400e]';
  if (status === 'atestado') return 'bg-[#e0f2fe] text-[#0369a1]';

  return 'bg-background text-gray-800';
};
