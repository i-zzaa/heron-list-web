import { useController } from 'react-hook-form';

import { ButtonHeron } from '../button';
import { Input } from '../input';

export interface SearchProps {
  onSubmit?: () => void;
  control: any;
  loading: boolean;
}

export function Search({ onSubmit, control, loading }: SearchProps) {
  // Só pra saber se tem texto digitado (mostrar o "x") e pra poder limpar o
  // campo no clique — o próprio <Input search> continua com seu Controller
  // interno de sempre, sem duplicar a fonte de verdade do valor.
  const { field } = useController({ name: 'search', control, defaultValue: '' });

  const handleClear = () => {
    field.onChange('');
    onSubmit && onSubmit();
  };

  return (
    <div className="grid grid-cols-12 items-center gap-1">
      <div className="col-span-11 relative">
        <Input
          labelText="Search"
          id="search"
          type="text"
          customCol="w-full"
          control={control}
        />

        {field.value ? (
          // `.label-float` reserva 18px de padding-top pro label flutuante
          // — centralizar com `top-1/2` levaria em conta essa faixa e
          // deixaria o "x" alto demais. Em vez disso, esse wrapper cobre
          // exatamente a altura do input (de 18px até o fim) e centraliza
          // o botão dentro dele via flex.
          <div className="absolute right-2 top-[18px] bottom-0 flex items-center">
            <button
              type="button"
              aria-label="Limpar busca"
              data-testid="search-clear-button"
              className="text-gray-400 hover:text-violet-800"
              onClick={handleClear}
            >
              <i className="pi pi-times" />
            </button>
          </div>
        ) : null}
      </div>

      <div className="mt-4">
        <ButtonHeron
          text="Buscar"
          icon="pi pi-search"
          type="primary"
          size="icon"
          onClick={onSubmit}
          loading={loading}
        />
      </div>
    </div>
  );
}
