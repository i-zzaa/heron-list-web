// Shims pras peças internas do react-big-calendar usadas por `MonthNoSunday`
// em `src/components/calendar/index.tsx` — a view de Mês, diferente da
// Semana, não tem uma peça pública componível (Week.js embrulha `TimeGrid`;
// Month.js já É a implementação inteira, sem separar layout de conteúdo).
// Pra remover a coluna de domingo sem esconder a lib inteira atrás de um
// `// @ts-ignore`, recriamos a MonthView aqui reaproveitando essas peças
// internas — nenhuma delas faz parte da API pública tipada do pacote.
declare module 'react-big-calendar/lib/DateContentRow' {
  import { ComponentType } from 'react';

  const DateContentRow: ComponentType<any>;
  export default DateContentRow;
}

declare module 'react-big-calendar/lib/Header' {
  import { ComponentType } from 'react';

  const Header: ComponentType<any>;
  export default Header;
}

declare module 'react-big-calendar/lib/DateHeader' {
  import { ComponentType } from 'react';

  const DateHeader: ComponentType<any>;
  export default DateHeader;
}

declare module 'react-big-calendar/lib/PopOverlay' {
  import { ComponentType } from 'react';

  const PopOverlay: ComponentType<any>;
  export default PopOverlay;
}

declare module 'react-big-calendar/lib/utils/eventLevels' {
  export function inRange(event: any, start: Date, end: Date, accessors: any, localizer: any): boolean;
  export function sortWeekEvents(events: any[], accessors: any, localizer: any): any[];
}

declare module 'react-big-calendar/lib/utils/helpers' {
  export function notify(handler: any, args: any): void;
}

declare module 'react-big-calendar/lib/utils/constants' {
  export const navigate: { PREVIOUS: string; NEXT: string; TODAY: string; DATE: string };
  export const views: { MONTH: string; WEEK: string; WORK_WEEK: string; DAY: string; AGENDA: string };
}
