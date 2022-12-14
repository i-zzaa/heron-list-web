import { useState } from 'react';
import { PickList } from 'primereact/picklist';
import './styles.css';

interface ItemProps {
  cod: string;
  descricao: string;
}

interface PickListHeronProps {
  list: ItemProps[];
}

export const PickListHeron = ({ list }: PickListHeronProps) => {
    const [source, setSource] = useState(list);
    const [target, setTarget] = useState([]);

    const onChange = (event: any) => {
        setSource(event.source);
        setTarget(event.target);
    }

    const itemTemplate = (item: ItemProps) => {
      return (
        <div className="product-item">
          <div className="product-list-detail">
            <span className="text-sm text-gray-800">{item.descricao}</span>
            <h5 className=" product-category text-xs text-gray-400">{item.cod}</h5>
          </div>
        </div>
      );
    }

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
            sourceStyle={{ height: '342px' }} targetStyle={{ height: '342px' }} onChange={onChange}
            filterBy="descricao" sourceFilterPlaceholder="Pesquisar" targetFilterPlaceholder="Pesquisar" 
          />
        </div>
      </div>
  );	
}