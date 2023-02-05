import {  useState } from 'react';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { Input } from '../input';
import { InputSwitch } from 'primereact';

interface DataTableHeronProps {
  value: any;
  onChange: (data: any) => void;
  control: any;
}

export const DataTableHeron = ({
  value,
  onChange,
  control,
}: DataTableHeronProps) => {
  const HOURS = {
    '08:00': false,
    '09:00': false,
    '10:00': false,
    '11:00': false,
    '12:00': false,
    '13:00': false,
    '14:00': false,
    '15:00': false,
    '16:00': false,
    '17:00': false,
    '18:00': false,
    '19:00': false,
    '20:00': false,
  };

 const WORKINGHOURS = value ||{
    'Segunda-feira': HOURS,
    'Terca-feira': HOURS,
    'Quarta-feira': HOURS,
    'Quinta-feira': HOURS,
    'Sexta-feira': HOURS,
    'Sábado': HOURS,
 }
  
  const [cargaHoraria, setCargaHoraria] = useState<any>(WORKINGHOURS);

  const renderHours = (day: string) => {
    return Object.keys(cargaHoraria[day]).map((hour: any) => (
      <Input
        key={day+hour}
        labelText={hour}
        id={day+hour}
        type="switch"
        control={control}
        value={cargaHoraria[day][hour]}
        onChange={(valueItem: any) => {
          const cargaHorariaTmp = {...cargaHoraria}
          cargaHorariaTmp[day][hour] = valueItem
          setCargaHoraria(cargaHorariaTmp);

          onChange(cargaHorariaTmp)
        }}
        customCol="w-24 font-inter"
      />

    //   <div className="grid grid-cols-6 justify-start items-center  w-24 ">
    //   <span className="col-span-4 text-violet-800 font-inter">
    //     { hour }
    //   </span>
    //   <div className="col-span-2">
    //   <InputSwitch
    //   checked={cargaHoraria[day][hour]}
    //   color="#685ec5"
    //   onChange={(valueItem: any) => {
    //       const cargaHorariaTmp = {...cargaHoraria}
    //       cargaHorariaTmp[day][hour] = valueItem
    //       setCargaHoraria(cargaHorariaTmp);

    //       onChange(cargaHorariaTmp)
    //   }}
    // />
    //   </div>
    // </div>



    ));
  };

  return (
    <div className="card p-fluid">
      <h5 className="text-md my-2 text-gray-800 font-bold ">
        Horário de trabalho da terapeuta
      </h5>
      <Accordion>
        {Object.keys(cargaHoraria).map((day: any) => (
          <AccordionTab header={day} tabIndex={day} key={day}>
            {renderHours(day)}
          </AccordionTab>
        ))}
      </Accordion>
    </div>
  );
};
