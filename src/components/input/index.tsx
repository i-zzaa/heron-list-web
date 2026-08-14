import { useState } from 'react';
import { Controller } from 'react-hook-form';

import { MultiSelect } from 'primereact/multiselect';
import { InputMask } from 'primereact/inputmask';
import { Dropdown } from 'primereact/dropdown';
import { InputSwitch } from 'primereact/inputswitch';
import { Checkbox } from 'primereact/checkbox';
import { ListBox } from 'primereact/listbox';

import { colorsData, colorsTextData, setColorChips } from '../../util/util';
import { clsx } from 'clsx';
import moment from 'moment';
import { PickListHeron } from '../pickListHeron';
import { DataTableHeron } from '../dataTable';
import { InputNumber } from 'primereact/inputnumber';
import { DataTableSessaoHeron } from '../dataTableSessao';
import { getInputClassName, getInputValue } from '../../util/input';
import { ColorPicker } from '../colorPicker';

export interface InputProps {
  id: string;
  type: string;
  labelText: string;
  value?: any;
  options?: any;
  customClass?: string;
  customCol?: string;
  disabled?: boolean;
  onChange?: (value: any) => void;
  validate?: any;
  errors?: any;
  hidden?: any;
  control?: any;
  testId?: string;
  min?: number;
  max?: number;
}

export interface OptionsProps {
  nome: string;
  value: string | number;
}

export function Input({
  onChange,
  value,
  labelText,
  id,
  type,
  customClass,
  options,
  customCol,
  validate,
  errors,
  control,
  disabled,
  hidden,
  testId,
  min,
  max,
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false);

  const renderType = () => {
    switch (type) {
      case 'password':
        return (
          <Controller
            name={id}
            control={control}
            rules={validate}
            render={({ field }: any) => (
              <div className="relative">
                <input
                  disabled={disabled}
                  id={field.id}
                  {...field}
                  value={getInputValue(value, field.value)}
                  key={field.id}
                  type={showPassword ? 'text' : 'password'}
                  className={getInputClassName(
                    type,
                    `pr-11${customClass ? ` ${customClass}` : ''}`
                  )}
                  autoComplete="off"
                  onInput={(e: any) => {
                    field.onChange(e);
                    onChange && onChange(e);
                  }}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  disabled={disabled}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-0 inset-y-0 flex items-center pr-3 text-gray-400 hover:text-violet-800 disabled:pointer-events-none"
                >
                  <i className={showPassword ? 'pi pi-eye-slash' : 'pi pi-eye'} />
                </button>
              </div>
            )}
          />
        );
      case 'select':
        return (
          <Controller
            name={id}
            control={control}
            rules={validate}
            render={({ field }: any) => (
              <Dropdown
                value={getInputValue(value, field.value)}
                virtualScrollerOptions={{ itemSize: 38 }}
                options={options}
                onChange={(e: any) => {
                  onChange && onChange(e.value);
                  return field.onChange(e.value);
                }}
                optionLabel="nome"
                filter
                showClear
                filterBy="nome"
                disabled={disabled}
              />
            )}
          />
        );
      case 'multiselect':
        return (
          <Controller
            name={id}
            control={control}
            rules={validate}
            render={({ field }: any) => (
              <MultiSelect
                disabled={disabled}
                id={field.id}
                display="chip"
                optionLabel="nome"
                filter
                value={getInputValue(value, field.value)}
                onChange={(e: any) => {
                  setColorChips();
                  onChange && onChange(e.value);
                  field.onChange(e.value);
                }}
                options={options}
              />
            )}
          />
        );
      case 'list':
        return (
          <Controller
            name={id}
            control={control}
            rules={validate}
            render={({ field }: any) => (
              <ListBox
                value={field.value}
                options={options}
                onChange={(e) => field.onChange(e.value)}
                multiple
                filter
                optionLabel="nome"
                listStyle={{ maxHeight: '300px' }}
              />
            )}
          />
        );
      case 'textarea':
        return (
          <Controller
            name={id}
            control={control}
            rules={validate}
            render={({ field }: any) => (
              <textarea
                id={field.id}
                {...field}
                value={getInputValue(value, field.value)}
                className={customClass}
                placeholder={field.placeholder}
                disabled={disabled}
              />
            )}
          />
        );
      case 'switch':
        return (
          <Controller
            name={id}
            control={control}
            rules={validate}
            render={({ field }: any) => {
              return (
                <div className="grid grid-cols-6 justify-start items-center h-8">
                  <span className="col-span-4 text-violet-800">
                    {' '}
                    {labelText}{' '}
                  </span>
                  <div className="col-span-2">
                    <InputSwitch
                      checked={getInputValue(value, field.value)}
                      color="#685ec5"
                      value={value}
                      disabled={disabled}
                      onChange={(e: any) => {
                        field.onChange(e.target.value);
                        onChange && onChange(e.target.value);
                      }}
                    />
                  </div>
                </div>
              );
            }}
          />
        );
      case 'color':
        return (
          <Controller
            name={id}
            control={control}
            rules={validate}
            render={({ field }: any) => (
              <div>
                <span className="block text-violet-800">{labelText}</span>
                <ColorPicker
                  value={getInputValue(value, field.value)}
                  disabled={disabled}
                  onChange={(color: string) => {
                    field.onChange(color);
                    onChange && onChange(color);
                  }}
                />
              </div>
            )}
          />
        );
      case 'tel':
        return (
          <Controller
            name={id}
            control={control}
            rules={validate}
            render={({ field }: any) => (
              <InputMask
                disabled={disabled}
                value={value || field.value}
                key={field.id}
                type={type}
                className={getInputClassName(type, `font-light${customClass ? ` ${customClass}` : ''}`)}
                mask="(99) 9 9999-9999"
                onChange={(e: any) => {
                  return field.onChange(e.value);
                }}
              />
            )}
          />
        );
      case 'checkbox':
        return (
          <Controller
            name={id}
            control={control}
            rules={validate}
            render={({ field }: any) => (
              <>
                <Checkbox
                  checked={getInputValue(value, field.value)}
                  type={type}
                  className={getInputClassName(type, customClass)}
                  onChange={(e: any) => {
                    field.onChange(e.target.checked);
                    onChange && onChange(e.target.checked);
                  }}
                />
                <span className="col-span-4 text-violet-800">
                  {' '}
                  {labelText}{' '}
                </span>
              </>
            )}
          />
        );
      case 'time':
        return (
          <Controller
            name={id}
            control={control}
            rules={validate}
            render={({ field }: any) => (
              <input
                id={field.id}
                {...field}
                value={getInputValue(value, field.value)}
                key={field.id}
                type={type}
                className={getInputClassName(type, customClass)}
                disabled={disabled}
                onInput={(e: any) => {
                  field.onChange(e);
                  onChange && onChange(e);
                }}
              />
            )}
          />
        );
      case 'price':
        return (
          <Controller
            name={id}
            control={control}
            rules={validate}
            render={({ field }: any) => (
              <div
                className={'inputAnimado font-inter ' + customClass}
                id={field.id}
              >
                <div className="p-inputgroup">
                  <InputNumber
                    value={getInputValue(value, field.value)}
                    disabled={disabled}
                    onInput={(e: any) => {
                      field.onChange(e);
                      onChange && onChange(e);
                    }}
                  />
                  <span className="p-inputgroup-addon">R$</span>
                </div>
              </div>
            )}
          />
        );
      case 'date':
        return (
          <Controller
            name={id}
            control={control}
            rules={validate}
            render={({ field }: any) => (
              <input
                disabled={disabled}
                id={field.id}
                {...field}
                value={getInputValue(value, field.value)}
                key={field.id}
                type={type}
                className={getInputClassName(type, customClass)}
                autoComplete="off"
                min={validate?.min && validate.min}
                onInput={(e: any) => {
                  field.onChange(e);
                  onChange && onChange(e);
                }}
              />
            )}
          />
        );
      case 'picker':
        return (
          <Controller
            name={id}
            control={control}
            rules={validate}
            render={({ field }: any) => (
              <PickListHeron
                list={options}
                selected={value}
                onChange={(e: any) => {
                  field.onChange(e);
                  onChange && onChange(e);
                }}
              />
            )}
          />
        );
      case 'dataTable':
        return (
          <Controller
            name={id}
            control={control}
            rules={validate}
            render={({ field }: any) => (
              <DataTableHeron
                value={value}
                control={control}
                onChange={(e: any) => {
                  field.onChange(e);
                  onChange && onChange(e);
                }}
              />
            )}
          />
        );
      case 'dataTableSessaoHeron':
        return (
          <Controller
            name={id}
            control={control}
            rules={validate}
            render={({ field }: any) => (
              <DataTableSessaoHeron
                value={value}
                type={id}
                onChange={(e: any) => {
                  field.onChange(e);
                  onChange && onChange(e);
                }}
              />
            )}
          />
        );
      default:
        return (
          <Controller
            name={id}
            control={control}
            rules={validate}
            render={({ field }: any) => (
              <input
                disabled={disabled}
                id={field.id}
                {...field}
                value={getInputValue(value, field.value)}
                key={field.id}
                type={type}
                min={min}
                max={max}
                className={getInputClassName(type, customClass)}
                autoComplete="off"
                onInput={(e: any) => {
                  field.onChange(e);
                  onChange && onChange(e);
                }}
              />
            )}
          />
        );
    }
  };

  return (
    <div
      data-testid={testId || `${id}-field`}
      className={clsx(
        'label-float',
        { 'my-5': !customCol, hidden: hidden && hidden },
        customCol
      )}
    >
      {renderType()}
      {type !== 'switch' && type !== 'checkbox' && type !== 'color' && (
        <label> {labelText} </label>
      )}
      {errors && errors[id] && (
        <p className="text-xs text-red-400 text-end">{errors[id].message}</p>
      )}
    </div>
  );
}
