import { useEffect, useState } from 'react';
import { PickList } from 'primereact/picklist';
import './styles.css';

interface ItemProps {
  cod: string;
  descricao: string;
}

interface PickListHeronProps {
  list: ItemProps[];
  selected: number[];
  onChange: (list: any) => any;
}

export const PickListHeron = ({
  list,
  onChange,
  selected,
}: PickListHeronProps) => {
  const [source, setSource] = useState(list);
  const [target, setTarget] = useState<ItemProps[]>([]);

  const handleChange = (event: any) => {
    setSource(event.source);
    setTarget(event.target);

    onChange(event.target);
  };

  useEffect(() => {
    if (selected && selected.length) {
      const listItens = list.filter((item: any) => !selected.includes(item.id));
      const selectedItens = list.filter((item: any) =>
        selected.includes(item.id)
      );

      setSource(listItens);
      setTarget(selectedItens);
    }
  }, []);

  const itemTemplate = (item: ItemProps) => {
    return (
      <div className="product-item">
        <div className="product-list-detail">
          <span className="text-sm text-gray-800">{item.descricao}</span>
          <h5 className=" product-category text-xs text-gray-400">
            {item.cod}
          </h5>
        </div>
      </div>
    );
  };

  return (
    <div className="picklist-demo mb-8">
      <div className="card">
        <PickList
          source={source}
          target={target}
          itemTemplate={itemTemplate}
          sourceHeader="Permissões"
          targetHeader="Selecionados"
          showSourceControls={false}
          showTargetControls={false}
          sourceStyle={{ height: '342px' }}
          targetStyle={{ height: '342px' }}
          onChange={handleChange}
          filterBy="descricao"
          sourceFilterPlaceholder="Pesquisar"
          targetFilterPlaceholder="Pesquisar"
        />
      </div>
    </div>
  );
};
