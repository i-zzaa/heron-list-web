import { useEffect, useRef } from 'react';
import type { CalendarApi } from '@fullcalendar/core';
import '@fullcalendar/react/dist/vdom';

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import '@fullcalendar/common/main.min.css';
import '@fullcalendar/daygrid/main.min.css';
import '@fullcalendar/timegrid/main.min.css';
import rrulePlugin from '@fullcalendar/rrule';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import {
  formatdateEuaAddDay,
  getPrimeiroDoMes,
  getUltimoDoMes,
} from '../../util/util';
import moment from 'moment';

const calendarConfig = {
  hiddenDays: [0],
  slotLabelInterval: '5vw',
  slotLabelFormat: { hour: 'numeric' as const, minute: '2-digit' as const },
  slotDuration: '00:20:00',
  slotMinTime: '07:00:00',
  slotMaxTime: '20:00:00',
  allDaySlot: false,
  locale: 'pt',
  navLinks: true,
  timeZone: 'America/Sao_Paulo',
  initialView: 'timeGridWeek',
  dayMaxEventRows: true,
  headerToolbar: {
    left: 'prev,next',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
  },
  buttonText: {
    month: 'Mês',
    week: 'Semana',
    day: 'Dia',
    list: 'Lista',
  },
  views: {
    timeGrid: {
      dayMaxEventRows: 8,
    },
  },
  businessHours: {
    daysOfWeek: [1, 2, 3, 4, 5, 6],
    startTime: '07:00',
    endTime: '20:00',
  },
};

export const CalendarComponent = ({
  events,
  openModalEdit,
  eventMouseEnter,
  onNext,
  onPrev,
  dateClick,
}: any) => {
  const calendarRef = useRef(null);

  const getInfo = (calendar: any, eventType: string) => {
    const prev = eventType === 'prev';
    const currentViewType = calendar.getCurrentData().currentViewType;
    const activeDate = calendar.getCurrentData().dateProfile.activeRange.end;

    switch (currentViewType) {
      case 'dayGridMonth': {
        const month = prev ? activeDate.getMonth() - 1 : activeDate.getMonth() + 1;
        const year = activeDate.getFullYear();
        return {
          type: 'dayGridMonth',
          start: getPrimeiroDoMes(year, month),
          end: getUltimoDoMes(year, month),
        };
      }

      case 'timeGridWeek':
      case 'listWeek': {
        const momentStart = moment(calendar.getCurrentData().dateProfile.activeRange.start);
        const momentEnd = moment(calendar.getCurrentData().dateProfile.activeRange.end);
        const start = prev ? momentStart.subtract(7, 'days') : momentStart.add(7, 'days');
        const end = prev ? momentEnd.subtract(7, 'days') : momentEnd.add(7, 'days');

        return {
          type: 'timeGridWeek',
          start: start.format('YYYY-MM-DD'),
          end: end.format('YYYY-MM-DD'),
        };
      }

      case 'timeGridDay': {
        const startDate = prev ? moment(activeDate).subtract(1, 'days') : moment(activeDate).add(1, 'days');
        const endDate = prev ? moment(activeDate) : moment(activeDate).add(2, 'days');
        return {
          type: 'timeGridDay',
          start: startDate.format('YYYY-MM-DD'),
          end: endDate.format('YYYY-MM-DD'),
        };
      }

      default:
        return undefined;
    }
  };

  useEffect(() => {
    const calendar = document.querySelector('fieldset > div > div > div > div > div') as HTMLElement | null;

    if (calendar) {
      calendar.style.height = 'calc(100vh - 250px)';
      calendar.style.overflow = 'hidden';
    }
  }, []);

  const renderEventContent = (arg: any) => {
    const statusValue =
      arg?.event?.extendedProps?.statusEventos?.nome ||
      arg?.event?.extendedProps?.statusEventos ||
      arg?.event?.extendedProps?.status ||
      '';
    const normalizedStatus = String(statusValue).trim().toLowerCase();
    const isAttended = normalizedStatus === 'atendido';
    const isCanceled = normalizedStatus.includes('cancelado');

    return (
      <div className="fc-event-title-container flex items-center gap-1 overflow-hidden">
        <span className={`truncate ${isCanceled ? 'line-through' : ''}`}>
          {arg.event.title}
        </span>
        {isAttended ? <i className="pi pi-check flex-shrink-0" title="Atendido" /> : null}
      </div>
    );
  };

  const handleCustomButton = (eventType: 'prev' | 'next') => {
    const calendar = (calendarRef.current as { getApi?: () => CalendarApi } | null)?.getApi?.() ?? null;
    const navigation = calendar ? getInfo(calendar, eventType) : undefined;

    if (!calendar || !navigation) {
      return;
    }

    if (eventType === 'prev') {
      onPrev(navigation);
      calendar.prev();
      return;
    }

    onNext(navigation);
    calendar.next();
  };

  return (
    <div>
      <div className="card text-sm font-inter">
        <FullCalendar
          plugins={[
            interactionPlugin,
            rrulePlugin,
            dayGridPlugin,
            listPlugin,
            timeGridPlugin,
          ]}
          {...calendarConfig}
          events={events}
          ref={calendarRef}
          eventClick={openModalEdit}
          dateClick={({ date }) => dateClick(formatdateEuaAddDay(date))}
          eventMouseEnter={eventMouseEnter}
          eventContent={renderEventContent}
          customButtons={{
            prev: {
              text: 'prev',
              click: () => handleCustomButton('prev'),
            },
            next: {
              text: 'next',
              click: () => handleCustomButton('next'),
            },
          }}
        />
      </div>
    </div>
  );
};
