import { SelectButton } from 'primereact/selectbutton';
import { Text } from '../text';
import { Controller } from 'react-hook-form';

interface SelectButtonProps {
  id: string;
  title: string;
  options: any[];
  control: any;
  rules: any;
  disabled: boolean;
}

export const SelectButtonComponent = ({
  title,
  options,
  control,
  id,
  rules,
  disabled,
}: SelectButtonProps) => {
  return (
    <div data-testid={`${id}-select-button`}>
      <div className="card">
        <Text size="sm" color="violet" text={title} />
        <Controller
          name={id}
          control={control}
          rules={rules}
          render={({ field }: any) => (
            <SelectButton
              value={field.value}
              options={options}
              onChange={field.onChange}
              optionLabel="nome"
              multiple
              disabled={disabled}
            />
          )}
        />
      </div>
    </div>
  );
};
