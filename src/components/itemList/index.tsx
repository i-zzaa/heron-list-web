import { ReactNode } from 'react';
import { ButtonHeron } from '../button';
import { Tag, TagProps } from '../tag';
import { Text } from '../text';
import { clsx } from 'clsx';
import { Tooltip } from 'primereact/tooltip';
import { permissionAuth } from '../../contexts/permission';

export interface ActionProps {
  onClickEdit?: () => void;
  onClickTrash?: () => void;
  onClickReturn?: () => void;
  positionActions?: 'left' | 'right';
  actionEdit?: boolean;
  actionTrash?: boolean;
  actionReturn?: boolean;
  screen?: string;
}

export interface FooterButtonProps {
  textButtonFooter?: string;
  iconButtonFooter?: string;
  typeButtonFooter?: any;
  sizeButtonFooter?: 'sm' | 'full' | 'md';
  onClick: () => void;
}

export interface itemListCompleteProps extends ActionProps, FooterButtonProps {
  textPrimaryLeft?: string;
  textPrimaryCenter?: string;
  textSecondCenter?: string;
  textFooter?: string;
  textPrimaryRight?: any;
  textSecondLeft?: string;
  textSecondRight?: string;
  onClickLink?: () => void;
  tags?: TagProps[];
  onClickTag?: () => void;
  actionEdit?: boolean;
  actionTrash?: boolean;
  actionReturn?: boolean;
  children?: ReactNode;
  onClickEdit?: () => void;
  onClickTrash?: () => void;
  onClickReturn?: () => void;
  positionActions?: 'left' | 'right';
  screen?: string;

  isDevolutiva?: boolean;
}

export interface RootProps extends FooterButtonProps {
  children: ReactNode;
  isDevolutiva?: boolean;
  onClickLink?: () => void;
}

function actionButtons({
  onClickEdit,
  onClickTrash,
  onClickReturn,
  positionActions = 'left',
  actionEdit,
  actionTrash,
  actionReturn,
  screen,
  hasPermition,
}: ActionProps & { hasPermition: (rule: string) => boolean | void }) {
  return (
    <div
      className={clsx('', {
        'flex justify-start': positionActions === 'left',
        'text-right': positionActions === 'right',
      })}
    >
      <>
        {actionEdit && hasPermition(`${screen}_LISTA_BOTAO_EDITAR`) && (
          <ButtonHeron
            text="Edit"
            icon="pi pi-pencil"
            type="transparent"
            color="violet"
            size="icon"
            onClick={onClickEdit}
          />
        )}

        {actionTrash && hasPermition(`${screen}_LISTA_BOTAO_EXCLUIR`) && (
          <ButtonHeron
            text="Trash"
            icon="pi pi-trash"
            type="transparent"
            color="red"
            size="icon"
            onClick={onClickTrash}
          />
        )}

        {actionReturn && hasPermition(`${screen}_LISTA_BOTAO_RETORNAR`) && (
          <ButtonHeron
            text="Return"
            icon="pi pi-replay"
            type="transparent"
            color="yellow"
            size="icon"
            onClick={onClickReturn}
          />
        )}
      </>
    </div>
  );
}

function footerButton({
  onClick,
  textButtonFooter,
  iconButtonFooter,
  sizeButtonFooter,
  typeButtonFooter,
}: FooterButtonProps) {
  if (textButtonFooter === '' || textButtonFooter === undefined) {
    return <></>;
  }

  return (
    <>
      <div className="hidden sm:block">
        <ButtonHeron
          text={textButtonFooter}
          icon={iconButtonFooter}
          type={typeButtonFooter}
          size={sizeButtonFooter}
          onClick={onClick}
        />
      </div>
      <div className="sm:hidden  flex-1">
        <ButtonHeron
          text={textButtonFooter}
          icon={iconButtonFooter}
          type={typeButtonFooter}
          size="full"
          onClick={onClick}
        />
      </div>
    </>
  );
}

function itemListRoot({
  children,
  textButtonFooter,
  iconButtonFooter,
  typeButtonFooter,
  isDevolutiva,
  sizeButtonFooter,
  onClick,
  onClickLink,
}: RootProps) {
  return (
    <div className="w-full text-center bg-white overflow-hidden">
      {children}
      <div className="flex text-sm  text-gray-400 mt-4 sm:m-0 justify-end gap-2">
        {isDevolutiva &&
          footerButton({
            textButtonFooter: 'Retornar',
            iconButtonFooter: 'pi pi-sync',
            typeButtonFooter: 'second',
            sizeButtonFooter,
            onClick: onClickLink ? onClickLink : () => {},
          })}

        {footerButton({
          textButtonFooter,
          iconButtonFooter,
          typeButtonFooter,
          sizeButtonFooter,
          onClick,
        })}
      </div>
    </div>
  );
}

function itemListSimples({
  textPrimaryLeft,
  textPrimaryRight,
  textSecondLeft,
  onClickLink,
  onClick,
  textButtonFooter,
  iconButtonFooter,
  typeButtonFooter,
  sizeButtonFooter,
  onClickEdit,
  onClickTrash,
  onClickReturn,
  positionActions = 'right',
  actionEdit,
  actionTrash,
  actionReturn,
  screen,
}: itemListCompleteProps) {
  const { hasPermition } = permissionAuth();

  return (
    <ItemList.Root
      textButtonFooter={textButtonFooter}
      iconButtonFooter={iconButtonFooter}
      typeButtonFooter={typeButtonFooter}
      sizeButtonFooter={sizeButtonFooter}
      onClick={onClick}
    >
      <>
        <div className="grid grid-cols-5 justify-between text-base font-medium text-gray-800 mt-4">
          <div className="col-span-4 grid sm:grid-cols-2 gap-2 sm:justify-between text-left">
            <Text text={textPrimaryLeft} size="md" color="violet" />
            <Text text={textPrimaryRight} size="sm" color="gray" />
            <span></span>
          </div>

          {actionButtons({
            onClickEdit,
            onClickTrash,
            onClickReturn,
            positionActions,
            actionEdit,
            actionTrash,
            actionReturn,
            screen,
            hasPermition,
          })}
        </div>

        {textSecondLeft && (
          <div className="mt-1  flex items-center gap-2">
            <i className="pi pi-user text-sm text-gray-400 "></i>
            <Text text={textSecondLeft} size="xs" color="gray" />
          </div>
        )}
      </>
    </ItemList.Root>
  );
}

function itemListComplete({
  textPrimaryLeft,
  textPrimaryCenter,
  textPrimaryRight,
  textSecondLeft,
  textSecondRight,
  textSecondCenter,
  textFooter,
  tags,
  onClickEdit,
  onClickTrash,
  onClickReturn,
  onClick,
  onClickLink,
  textButtonFooter,
  iconButtonFooter,
  typeButtonFooter,
  sizeButtonFooter,
  isDevolutiva,
  actionEdit,
  actionTrash,
  actionReturn,
  positionActions = 'left',
  children,
  screen,
}: itemListCompleteProps) {
  const { hasPermition } = permissionAuth();

  const renderTags = () => {
    return (
      <div className="text-right flex gap-1 h-8 justify-end">
        {tags?.map((item: TagProps) => (
          <Tag
            key={item.type}
            onClick={
              hasPermition(`${screen}_LISTA_TAG_ESPECIALIDADES`)
                ? onClickLink
                : undefined
            }
            type={item.type}
            color={item.color}
            disabled={
              screen === 'FILA_DEVOLUTIVA' || screen === 'CADASTRO_PACIENTES'
                ? false
                : item?.disabled
            }
          />
        ))}
      </div>
    );
  };

  return (
    <ItemList.Root
      textButtonFooter={textButtonFooter}
      iconButtonFooter={iconButtonFooter}
      typeButtonFooter={typeButtonFooter}
      isDevolutiva={isDevolutiva}
      sizeButtonFooter={sizeButtonFooter}
      onClick={onClick}
      onClickLink={onClickLink}
    >
      <>
        <div className="grid grid-rows-2 sm:grid-cols-2 mb-4 sm:mb-0 h-12 mt-6">
          {screen !== 'FILA_DEVOLUTIVA' ? (
            actionButtons({
              onClickEdit,
              onClickTrash,
              onClickReturn,
              positionActions,
              actionEdit,
              actionTrash,
              actionReturn,
              screen,
              hasPermition,
            })
          ) : (
            <div></div>
          )}
          {renderTags()}
        </div>
        <div>
          <div className="flex items-end gap-2 sm:gap-8 text-left ">
            <Text text={textPrimaryLeft} size="lg" color="violet" />
            <Text
              className="font-inter"
              text={textPrimaryCenter}
              size="sm"
              color="gray-dark"
            />
            <Text
              className="font-inter"
              text={textPrimaryRight}
              size="sm"
              color="gray-dark"
            />
          </div>

          <div className="mt-1 grid sm:flex items-center sm:gap-2 justify-between font-light text-left">
            <div className="flex justify-center items-center ">
              <Text text={textSecondLeft} size="md" color="gray-dark" />
            </div>

            {hasPermition(`${screen}_LISTA_TEXT_TELEFONE`) ? (
              <div className="flex items-center gap-2 p-2 font-sans text-left">
                <i className="pi pi-phone text-gray-400 text-xs"></i>
                <Text
                  text={textSecondCenter}
                  size="md"
                  color="gray-dark"
                  className="font-inter"
                />
              </div>
            ) : (
              <></>
            )}

            <Text
              text={textSecondRight}
              size="md"
              color="gray-dark"
              className="font-inter"
            />
          </div>

          <div className="mt-2">{children}</div>

          <div className="mt-4 flex items-center gap-2 text-ellipsis overflow-hidden">
            <Tooltip target=".obs" mouseTrack className="w-2/4 sm:w-1/4" />
            <p
              className=" text-gray-800  text-sm justify-start text-start obs text-ellipsis overflow-hidden"
              data-pr-tooltip={textFooter}
            >
              {textFooter}
            </p>
          </div>
        </div>
      </>
    </ItemList.Root>
  );
}

export const ItemList = {
  Root: itemListRoot,
  Simples: itemListSimples,
  Complete: itemListComplete,
};
