import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { useEffect, useState } from 'react';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { moneyFormat } from '../../util/util';

interface SessaoItem {
  especialidade?: string;
  funcao?: string;
  valor?: string | number;
  tipo?: string;
  km?: number | string;
}

interface DataTableHeronProps {
  value: SessaoItem[];
  onChange: (data: any) => void;
  type: string;
}

const TIPO_COMISSAO_OPTIONS = [
  { id: 'fixo', nome: 'Fixo' },
  { id: 'porcentagem', nome: '%' },
];

export const DataTableSessaoHeron = ({
  value,
  onChange,
  type,
}: DataTableHeronProps) => {
  const [sessoes, setSessoes] = useState<SessaoItem[]>(value || []);
  const columns =
    type === 'sessao'
      ? [
          { field: 'especialidade', header: 'Especialidade' },
          { field: 'valor', header: 'Valor' },
        ]
      : [
          { field: 'funcao', header: 'Função' },
          { field: 'valor', header: 'Valor' },
          { field: 'tipo', header: 'Tipo Comissão' },
        ];

  const updateSessaoCell = (rowIndex: number, field: string, rowValue: any) => {
    const changeList = [...sessoes];
    changeList[rowIndex] = {
      ...changeList[rowIndex],
      [field]: rowValue,
    };
    setSessoes(changeList);
  };

  const cellEditor = (options: any) => {
    switch (options.field) {
      case 'valor':
        if (options.rowData.tipo === 'Fixo' || type === 'sessao') {
          return (
            <InputNumber
              onValueChange={(e: any) => {
                updateSessaoCell(
                  options.rowIndex,
                  'valor',
                  moneyFormat.format(e.target.value)
                );
              }}
              mode="currency"
              currency="BRL"
              locale="pt-BR"
              className="font-inter"
            />
          );
        } else {
          return (
            <InputNumber
              onValueChange={(e: any) => {
                updateSessaoCell(options.rowIndex, 'valor', e.target.value);
              }}
              suffix="%"
              className="font-inter"
            />
          );
        }

      case 'km':
        return (
          <input
            type="number"
            onInput={(e: any) => {
              updateSessaoCell(options.rowIndex, 'km', e.target.value);
            }}
          />
        );
      case 'tipo':
        return (
          <Dropdown
            virtualScrollerOptions={{ itemSize: 38 }}
            options={TIPO_COMISSAO_OPTIONS}
            onChange={(e: any) => {
              updateSessaoCell(options.rowIndex, 'tipo', e.target.value.nome);
            }}
            optionLabel="nome"
          />
        );
      default:
        return options.value;
    }
  };

  const onCellEditComplete = (valueForm: any) => {
    if (valueForm.field === 'especialidade' || valueForm.field === 'funcao')
      return;

    onChange(sessoes);
  };

  useEffect(() => {
    setSessoes(value || []);
  }, [value]);

  return (
    <div className="card p-fluid">
      <h5 className="text-md my-2 text-gray-800 font-bold ">
        Infomações das sessões
      </h5>
      <DataTable
        value={sessoes}
        editMode="cell"
        className="editable-cells-table font-inter"
        responsiveLayout="scroll"
      >
        {columns.map(({ field, header }) => {
          return (
            <Column
              key={field}
              field={field}
              header={header}
              style={{ width: '25%' }}
              onCellEditComplete={onCellEditComplete}
              editor={(options) => cellEditor(options)}
            />
          );
        })}
      </DataTable>
    </div>
  );
};
