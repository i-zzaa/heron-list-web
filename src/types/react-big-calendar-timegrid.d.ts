// `react-big-calendar` não expõe `TimeGrid` na sua API pública tipada — é
// peça interna do pacote (ver Week.js) que usamos pra montar a view de
// semana sem domingo em `src/components/calendar/index.tsx`. Sem esse
// shim, o import profundo (`react-big-calendar/lib/TimeGrid`) não tem
// declaração de tipos e quebra o build.
declare module 'react-big-calendar/lib/TimeGrid' {
  import { ComponentType } from 'react';

  const TimeGrid: ComponentType<any>;
  export default TimeGrid;
}
