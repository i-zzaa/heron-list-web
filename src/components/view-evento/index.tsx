import moment from 'moment';
import { Dialog } from 'primereact/dialog';
import { ReactNode, useEffect, useState } from 'react';
import { ATENDENTE, DESENVOLVEDOR, TERAPEUTA, permissionAuth } from '../../contexts/permission';
import { isProfile } from '../../util/permissions';
import {
  diffWeek,
  firtUpperCase,
  formatHorarioEvento,
  isInPast,
  weekDay,
} from '../../util/util';
import { ButtonHeron } from '../button';
import { STATUS_EVENTS, getStatusEventoTone } from '../../constants/schedule';

interface Props {
  evento: any;
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onClick: () => void;
  onClickSecond: () => void;
}

const ptDataLonga = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

// `evento.date` vem do getDateFormat (moment sem locale pt-BR, ex.:
// "Quinta-feira, Sep 17, 2026") — pra exibir, formata a partir da data da
// ocorrência clicada (`dataAtual`, YYYY-MM-DD).
const formatDataEvento = (evento: any) => {
  const data = moment(evento?.dataAtual, 'YYYY-MM-DD', true);
  return data.isValid()
    ? firtUpperCase(ptDataLonga.format(data.toDate()))
    : evento?.date;
};

interface InfoRowProps {
  icon: string;
  children: ReactNode;
  detail?: ReactNode;
}

function InfoRow({ icon, children, detail }: InfoRowProps) {
  return (
    <li className="flex items-start gap-3">
      <span className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg bg-violet-800/10 text-violet-800">
        <i className={icon} style={{ fontSize: 13 }} />
      </span>
      <div className="min-w-0 pt-0.5">
        <p className="text-[14px] text-gray-800 break-words">{children}</p>
        {detail ? <p className="text-md text-gray-800 opacity-80 break-words">{detail}</p> : null}
      </div>
    </li>
  );
}

export const ViewEvento = ({
  evento,
  open,
  onClose,
  onEdit,
  onDelete,
  onClick,
  onClickSecond
}: Props) => {
  const [buttonEdit, setButtonEdit] = useState(true);
  const { hasPermition, perfil } = permissionAuth();

  const isLivre = evento.paciente.nome === STATUS_EVENTS.livre;
  const corEspecialidade = evento.especialidade?.cor || '#662977';

  const canMarkAsAttended =
    (isProfile(perfil, DESENVOLVEDOR) || isProfile(perfil, TERAPEUTA)) &&
    evento.statusEventos.nome !== STATUS_EVENTS.atendido &&
    !isInPast(evento.date) &&
    !isLivre;

  const canMarkAsAttested =
    (isProfile(perfil, DESENVOLVEDOR) || isProfile(perfil, ATENDENTE)) &&
    isInPast(evento.date) &&
    !isLivre &&
    evento.statusEventos.nome !== STATUS_EVENTS.atendido &&
    evento.statusEventos.nome !== STATUS_EVENTS.atestado;

  const canEdit = hasPermition('AGENDA_CALENDARIO_LISTA_EDITAR') && buttonEdit;
  const canDelete =
    hasPermition('AGENDA_CALENDARIO_LISTA_EXCLUIR') && evento?.canDelete && buttonEdit;

  const modalidadeLabel = () => {
    const text = evento.modalidade.nome;
    if (text !== 'Avaliação' || !evento?.dataInicio || !evento?.dataFim) return text;

    const current = diffWeek(evento.dataInicio, evento.dataAtual);
    const diffTotal = diffWeek(evento.dataInicio, evento.dataFim);

    return (
      <>
        {text}
        <span className="font-inter ml-1">{`${current}/${diffTotal}`}</span>
      </>
    );
  };

  const header = (
    <div className="flex items-stretch gap-3">
      <span
        className="w-1 shrink-0 rounded-full"
        style={{ backgroundColor: isLivre ? '#d4d4d8' : corEspecialidade }}
      />
      <div className="min-w-0 flex-1">
        {!isLivre && evento.especialidade?.nome ? (
          <p className="flex items-center gap-1.5 text-md font-bold uppercase text-gray-800">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: corEspecialidade }}
            />
            {evento.especialidade.nome}
          </p>
        ) : null}
        <h2 className="text-lg font-bold text-gray-800 leading-tight break-words">
          {evento.paciente.nome}
        </h2>
      </div>

      <div className="flex items-start gap-1 -mt-1">
        {canEdit ? (
          <ButtonHeron
            text="Editar"
            icon="pi pi-pencil"
            type="transparent"
            color="violet"
            size="icon"
            onClick={onEdit}
          />
        ) : null}
        {canDelete ? (
          <ButtonHeron
            text="Excluir"
            icon="pi pi-trash"
            type="transparent"
            color="red"
            size="icon"
            onClick={onDelete}
          />
        ) : null}
      </div>
    </div>
  );

  useEffect(() => {
    // `dateNow <= evento.dataAtual` (comparação só de data) deixava editar
    // um evento que já aconteceu mais cedo NO MESMO DIA — só bloqueava a
    // partir do dia seguinte. Comparando o fim do evento (data + hora)
    // contra o instante atual, a edição fecha assim que o evento termina.
    const horaFim = formatHorarioEvento(evento.data?.end ?? evento.end);
    const fimEvento = moment(`${evento.dataAtual} ${horaFim}`, 'YYYY-MM-DD HH:mm');
    setButtonEdit(!fimEvento.isValid() || fimEvento.isAfter(moment()));
  });

  return (
    <Dialog
      header={header}
      visible={open}
      onHide={onClose}
      style={{ width: '32rem' }}
      breakpoints={{ '640px': '94vw' }}
    >
      <div className="grid gap-5">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-md font-bold ${getStatusEventoTone(
              evento.statusEventos.nome
            )}`}
            data-testid="view-evento-status"
          >
            {evento.statusEventos.nome}
          </span>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-md text-gray-800 border border-gray-200">
            {modalidadeLabel()}
          </span>
        </div>

        <ul className="grid gap-4">
          <InfoRow
            icon="pi pi-calendar"
            detail={
              <span className="font-inter">
                {`${formatHorarioEvento(
                  evento.data?.start ?? evento.start
                )} até ${formatHorarioEvento(evento.data?.end ?? evento.end)}`}
              </span>
            }
          >
            {formatDataEvento(evento)}
          </InfoRow>

          {evento.frequencia.id !== 1 && (
            <InfoRow
              icon="pi pi-replay"
              detail={evento?.diasFrequencia
                ?.map((dia: number) => weekDay[dia - 1])
                .join(' · ')}
            >
              {evento.intervalo.nome}
            </InfoRow>
          )}

          <InfoRow
            icon="pi pi-map-marker"
            detail={
              evento.isExterno ? (
                <span className="font-inter">{`${evento.km} km`}</span>
              ) : undefined
            }
          >
            {evento.isExterno ? evento.localExternoDescricao : evento.localidade?.nome}
          </InfoRow>

          <InfoRow icon="pi pi-user" detail={evento.funcao.nome}>
            {evento.terapeuta.nome}
          </InfoRow>

          {evento.paciente?.convenio?.nome ? (
            <InfoRow icon="pi pi-id-card" detail="Convênio">
              {evento.paciente.convenio.nome}
            </InfoRow>
          ) : null}

          {evento.observacao ? (
            <InfoRow icon="pi pi-comment" detail={evento.observacao}>
              Observação
            </InfoRow>
          ) : null}
        </ul>

        {canMarkAsAttended || canMarkAsAttested ? (
          <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-gray-200">
            {canMarkAsAttended ? (
              <ButtonHeron
                text="Marcar como atendido"
                icon="pi pi-check"
                type="primary"
                color="white"
                size="full"
                onClick={onClick}
              />
            ) : null}
            {canMarkAsAttested ? (
              <ButtonHeron
                text="Atestado"
                icon="pi pi-book"
                type="outline"
                size="full"
                onClick={onClickSecond}
              />
            ) : null}
          </div>
        ) : null}
      </div>
    </Dialog>
  );
};
