import { useEffect, useRef, useState } from 'react';
import '@fullcalendar/react/dist/vdom';

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';

import '@fullcalendar/common/main.min.css';
import '@fullcalendar/daygrid/main.min.css';
import '@fullcalendar/timegrid/main.min.css';
import rrulePlugin from '@fullcalendar/rrule';
import interactionPlugin from '@fullcalendar/interaction';

// import FullCalendar from "@fullcalendar/react"; // must go before plugins
// import { FullCalendar } from 'primereact/fullcalendar';
// import { EventService } from '../service/EventService';
// import dayGridPlugin from '@fullcalendar/daygrid';
// import timeGridPlugin from '@fullcalendar/timegrid';
// import interactionPlugin from "@fullcalendar/interaction";
// import '@fullcalendar/core/main.css';
// import "@fullcalendar/daygrid/main.css";
// import "@fullcalendar/timegrid/main.css";
// import ptLocale from "@fullcalendar/common/locales/pt";

import momentTimezonePlugin from '@fullcalendar/moment-timezone';
// import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import {
  formatdateeua,
  formatdateEuaAddDay,
  getPrimeiroDoMes,
  getUltimoDoMes,
} from '../../util/util';
import moment from 'moment';
// import resourceTimelinePlugin from '@fullcalendar/resource-timeline';

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
    // let currentDate = calendar.getCurrentData().currentDate;

    const prev = eventType === 'prev';
    let type = calendar.getCurrentData().currentViewType;
    let month, year, start, end, startDate, endDate;

    let activeDate = calendar.getCurrentData().dateProfile.activeRange.end;

    switch (type) {
      case 'dayGridMonth':
        month = prev ? activeDate.getMonth() - 1 : activeDate.getMonth() + 1;
        year = activeDate.getFullYear();
        start = getPrimeiroDoMes(year, month);
        end = getUltimoDoMes(year, month);

        return { type: 'dayGridMonth', start, end };

      case 'timeGridWeek':
      case 'listWeek':
        startDate = calendar.getCurrentData().dateProfile.activeRange.start;
        endDate = calendar.getCurrentData().dateProfile.activeRange.end;

        const momentStart = moment(
          calendar.getCurrentData().dateProfile.activeRange.start
        );
        const momentEnd = moment(
          calendar.getCurrentData().dateProfile.activeRange.end
        );
        start = prev
          ? momentStart.subtract(7, 'days')
          : momentStart.add(7, 'days');
        end = prev ? momentEnd.subtract(7, 'days') : momentEnd.add(7, 'days');

        return {
          type: 'timeGridWeek',
          start: start.format('YYYY-MM-DD'),
          end: end.format('YYYY-MM-DD'),
        };

      case 'timeGridDay':
        startDate = prev
          ? moment(activeDate).subtract(1, 'days')
          : moment(activeDate).add(1, 'days');
        endDate = prev ? moment(activeDate) : moment(activeDate).add(2, 'days');
        return {
          type: 'timeGridDay',
          start: startDate.format('YYYY-MM-DD'),
          end: endDate.format('YYYY-MM-DD'),
        };

      default:
        break;
    }
  };

  useEffect(() => {
    if (calendarRef.current) {
     
      

      const calendar: any = document.querySelector('fieldset > div > div > div > div > div') 
      calendar.style.height = 'calc(100vh - 250px)'
      calendar.style.overflow = 'hidden'
    }
  }, []);

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
            // momentTimezonePlugin
          ]}
          hiddenDays={[0]}
          slotLabelInterval="5vw" // cada célula da grade ocupa 5% da largura da tela
          slotLabelFormat={{ hour: 'numeric', minute: '2-digit' }} // inclui o valor de slotLabelInterval
          slotDuration="00:20:00"
          slotMinTime="08:00:00" // hora mínima para exibição
          slotMaxTime="20:00:00" // hora máxima para exibição
          allDaySlot={false}
          locale="pt"
          navLinks
          timeZone="America/Sao_Paulo"
          // locales={[ptLocale]}
          initialView="timeGridWeek"
          events={events}
          headerToolbar={{
            left: 'prev,next',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
          }}
          ref={calendarRef}
          eventClick={openModalEdit}
          // eventChange={openModalEdit}
          dayMaxEventRows={true}
          views={{
            timeGrid: {
              dayMaxEventRows: 8,
            },
          }}
          businessHours={{
            // days of week. an array of zero-based day of week integers (0=Sunday)
            daysOfWeek: [1, 2, 3, 4, 5, 6], // Monday - Thursday

            startTime: '08:00', // a start time (10am in this example)
            endTime: '20:00', // an end time (6pm in this example)
          }}
          buttonText={{
            month: 'Mês',
            week: 'Semana',
            day: 'Dia',
            list: 'Lista',
          }}
          dateClick={({ date }) => dateClick(formatdateEuaAddDay(date))}
          eventMouseEnter={eventMouseEnter}
          eventContent={(arg: any) => {
            // let italicEl = document.createElement('i');
            // if (arg.event.extendedProps.isUrgent) {
            //   italicEl.innerHTML = 'urgent event';
            // } else {
            //   italicEl.innerHTML = 'normal event';
            // }
            // let arrayOfDomNodes = [italicEl];
            // // return { domNodes: arrayOfDomNodes }
          }}
          customButtons={{
            prev: {
              text: 'prev',
              click: (e: any) => {
                const calendar =
                  // @ts-ignore
                  calendarRef.current && calendarRef.current.getApi();
                let moment = getInfo(calendar, 'prev');
                onPrev(moment);
                // @ts-ignore
                calendar && calendar.prev();
              },
            },
            next: {
              text: 'next',
              click: (e: any) => {
                const calendar =
                  // @ts-ignore
                  calendarRef.current && calendarRef.current.getApi();
                let moment = getInfo(calendar, 'next');
                onNext(moment);
                // @ts-ignore
                calendar && calendar.next();
              },
            },
          }}
        />
      </div>
    </div>
  );
};
