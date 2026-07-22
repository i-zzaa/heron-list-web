export const getInputClassName = (type: string, customClass?: string) => {
  const baseClass = 'inputAnimado';
  return `${baseClass}${type === 'date' || type === 'time' || type === 'text' ? ' font-inter' : ''}${customClass ? ` ${customClass}` : ''}`;
};

export const getInputValue = (value: any, fieldValue: any) => {
  return value ?? fieldValue;
};
