import { useCallback, useEffect, useState } from 'react';

import { getPost } from '../server';
import { ButtonHeron, Card, Filter } from '../components/index';
import { useToast } from '../contexts/toast';
import { buildErrorToast } from '../util/error';
import {
  filterFinancialFields,
  filterFinancialPacienteFields,
} from '../constants/financial';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { useDropdown } from '../contexts/dropDown';
import { STATUS_PACIENT_COD } from '../constants/patient';
import { NotFound } from '../components/notFound';
import { TabPanel, TabView } from 'primereact/tabview';
import moment from 'moment';
import { buildEspecialidadeColorMap, formaTime, moneyFormat } from '../util/util';
import { LoadingHeron } from '../components/loading';
import { Accordion, AccordionTab } from 'primereact/accordion';
import * as XLSX from 'xlsx';
import { usePersistedTabIndex } from '../hooks/usePersistedTabIndex';

const fieldsConstTerapeuta = filterFinancialFields;
const fieldsState1: any = {};
fieldsConstTerapeuta.forEach((field: any) => (fieldsState1[field.id] = ''));

const fieldsConstPaciente = filterFinancialPacienteFields;
const fieldsState2: any = {};
fieldsConstPaciente.forEach((field: any) => (fieldsState2[field.id] = ''));

const getCurrentMonthDefaultValues = () => ({
  dataInicio: moment().startOf('month').format('YYYY-MM-DD'),
  datatFim: moment().endOf('month').format('YYYY-MM-DD'),
});

export default function Financial() {
  const [loading, setLoading] = useState<boolean>(false);
  const [dropDownList, setDropDownList] = useState<any>([]);

  const { renderDropdownFinancial } = useDropdown();
  const { renderToast } = useToast();

  const [list, setList] = useState<any>([]);
  const [geral, setGeral] = useState<any>({});

  const [info, setInfo] = useState<any>({});

  const { activeIndex, setActiveIndex } =
    usePersistedTabIndex('tab-index-financeiro');

  const resetList = (e: any) => {
    setList([]);
    setGeral({});

    return e;
  };

  const handleSubmitFilter = async (formState: any, modulo: string) => {
    setLoading(true);
    try {
      const format: any = {};

      Object.keys(formState).forEach((key: any) => {
        if (key.indexOf('Id') !== -1) {
          format[key] = formState[key]?.id || undefined;
        } else {
          format[key] = formState[key];
        }
      });

      setInfo({
        modulo,
        ...formState,
      });

      const response = await getPost(`financeiro/${modulo}`, format);
      const lista: any =
        response.status === 200 && response?.data ? response.data : [];
      setGeral(lista.geral);
      setList(lista.data);
    } catch (error) {
      setGeral({});
      setList([]);
      renderToast(buildErrorToast(error, 'Não foi possível carregar o financeiro.'));
    } finally {
      setLoading(false);
    }
  };

  const renderDropdown = useCallback(async () => {
    const list = await renderDropdownFinancial(STATUS_PACIENT_COD.therapy);
    setDropDownList(list);
  }, []);

  const reducerValorTotal = (data: any) => {
    const result = data
      .map((item: any) => item.valorTotal)
      .reduce((total: number, current: any) => (total += current));

    return moneyFormat.format(result);
  };

  const reducerHorasTotal = (data: any) => {
    const reduce = data
      .map((item: any) => item.horas)
      .reduce((total: number, current: any) => {
        const tt = moment.duration(total);
        tt.add(moment.duration(current));
        return tt;
      });

    return formaTime(reduce);
  };

  const headerTemplate = (data: any, nome: string) => {
    return (
      <span className="">
        <span className="image-text mr-24">{nome} </span>
        <span className="image-text mr-24">
          Valor total:{' '}
          <span className="font-inter">{reducerValorTotal(data)}</span>
        </span>
        <span className="image-text">
          Total de Horas:{' '}
          <span className="font-inter">{reducerHorasTotal(data)}</span>
        </span>
      </span>
    );
  };

  const gerarExcel = () => {
    // Cria um novo objeto Workbook
    const workbook = XLSX.utils.book_new();

    // Cria uma nova planilha
    const geralResponse = XLSX.utils.json_to_sheet([geral]);

    const listDetail: any = [];
    Object.values(list).map((value: any) => listDetail.push(...value));

    const detalhado = XLSX.utils.json_to_sheet(listDetail);

    // Adiciona a planilha ao Workbook
    XLSX.utils.book_append_sheet(workbook, geralResponse, 'Geral');
    XLSX.utils.book_append_sheet(workbook, detalhado, 'Detalhado');

    const page = `${geral.nome} ${moment(info.dataInicio).format(
      'DD-MM-YYYY'
    )} até ${moment(info.dataFim).format('DD-MM-YYYY')}.xlsx`;

    // Salva o arquivo
    XLSX.writeFile(workbook, page);
  };

  const renderScreenTerapeuta = () => {
    return (
      <>
        <Filter
          id="form-filter-patient"
          legend="Filtro"
          fields={fieldsConstTerapeuta}
          screen="FINANCEIRO"
          defaultValues={getCurrentMonthDefaultValues()}
          onSubmit={(e: any) => handleSubmitFilter(e, 'terapeuta')}
          onReset={() => {}}
          loading={loading}
          dropdown={dropDownList}
        />

        {!loading && Object.values(list).length ? (
          <div className="grid sm:grid-cols-3 sm:gap-2">
            <Card>
              <div className="flex gap-4 items-center">
                <i className="pi pi-users" />
                <div className="grid">
                  <span className="text-gray-600 text-sm">
                    {geral.especialidade}
                  </span>
                  <span className="font-inter">{geral.nome}</span>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex gap-2 justify-around">
                <div className="flex gap-4 items-center">
                  <i className="pi pi-stopwatch" />
                  <div className="grid">
                    <span className="text-gray-600 text-sm">Horas</span>
                    <span className="font-inter">{geral.horas}</span>
                  </div>
                </div>

                <div className="flex gap-4 items-center">
                  <i className="pi pi-car" />
                  <div className="grid">
                    <span className="text-gray-600 text-sm">km</span>
                    <span className="font-inter">{geral.valorKm}</span>
                  </div>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex gap-4 items-center">
                <i className="pi pi-money-bill" />
                <div className="grid">
                  <span className="text-gray-600 text-sm">Total total</span>
                  <span className="font-inter">
                    {moneyFormat.format(geral.valorTotal)}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        ) : null}
        <Card>
          <div className="flex justify-center">
            {loading ? (
              <LoadingHeron />
            ) : Object.keys(list).length ? (
              <div className="w-full text-md ">
                <div className="sm:text-end mb-4">
                  <ButtonHeron
                    text="Download Excel"
                    icon="pi pi-download"
                    type="primary"
                    size="sm"
                    onClick={gerarExcel}
                  />
                </div>

                <Accordion>
                  {Object.keys(list).map((key: string, index: number) => {
                    return (
                      <AccordionTab
                        key={index}
                        header={headerTemplate(list[key], key)}
                        tabIndex={index}
                      >
                        <DataTable value={list[key]} responsiveLayout="scroll">
                          <Column
                            sortable
                            field="data"
                            header="Data"
                            body={({ data }: any) => (
                              <span className="font-inter">{data}</span>
                            )}
                          ></Column>
                          <Column
                            sortable
                            field="horas"
                            header="Tempo"
                            body={({ horas }: any) => (
                              <span className="font-inter">{horas}</span>
                            )}
                          ></Column>
                          <Column
                            sortable
                            field="status"
                            header="Status"
                          ></Column>
                          <Column
                            sortable
                            field="km"
                            header="km"
                            body={(rowData: any) =>
                              rowData.km == 0 ? '-' : rowData.km
                            }
                          ></Column>
                          <Column
                            sortable
                            field="valorKm"
                            header="ValorKm km"
                            body={(rowData: any) =>
                              rowData.valorKm == 0
                                ? '-'
                                : moneyFormat.format(rowData.valorKm)
                            }
                          ></Column>
                          <Column
                            sortable
                            field="sessao"
                            header="Valor da Sessão"
                            body={({ sessao }: any) => (
                              <span className="font-inter">
                                {moneyFormat.format(sessao)}
                              </span>
                            )}
                          ></Column>
                          <Column
                            sortable
                            field="valorSessao"
                            header="Comissão"
                            body={({ valorSessao }: any) => (
                              <span className="font-inter">
                                {moneyFormat.format(valorSessao)}
                              </span>
                            )}
                          ></Column>
                          <Column
                            sortable
                            field="valorTotal"
                            header="Valor Total"
                            body={({ valorTotal }: any) => (
                              <span className="font-inter">
                                {moneyFormat.format(valorTotal)}
                              </span>
                            )}
                          ></Column>
                        </DataTable>
                      </AccordionTab>
                    );
                  })}
                </Accordion>
              </div>
            ) : (
              <div className="w-full flex items-center  justify-center">
                <NotFound />
              </div>
            )}
          </div>
        </Card>
      </>
    );
  };

  const renderScreenPaciente = () => {
    return (
      <>
        <Filter
          id="form-filter-patient"
          legend="Filtro"
          fields={fieldsConstPaciente}
          screen="FINANCEIRO"
          defaultValues={getCurrentMonthDefaultValues()}
          onSubmit={(e: any) => handleSubmitFilter(e, 'paciente')}
          onReset={() => {}}
          loading={loading}
          dropdown={dropDownList}
        />

        {!loading && Object.keys(list).length ? (
          <>
            <div className="grid sm:grid-cols-2 sm:gap-2">
              <Card>
                <div className="flex gap-2 justify-around">
                  <div className="flex gap-4 items-center">
                    <i className="pi pi-stopwatch" />
                    <div className="grid">
                      <span className="text-gray-600 text-sm">Horas</span>
                      <span className="font-inter">{geral.horas}</span>
                    </div>
                  </div>

                  <div className="flex gap-4 items-center">
                    <i className="pi pi-car" />
                    <div className="grid">
                      <span className="text-gray-600 text-sm">km</span>
                      <span className="font-inter">{geral.valorKm}</span>
                    </div>
                  </div>
                  <div className="flex gap-4 items-center">
                    <i className="pi pi-money-bill" />
                    <div className="grid">
                      <span className="text-gray-600 text-sm">Total total</span>
                      <span className="font-inter">
                        {moneyFormat.format(geral.valorTotal)}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
              <Card>
                <div className="flex flex-wrap gap-2 items-left">
                  {geral.especialidadeSessoes &&
                    Object.keys(geral.especialidadeSessoes).map(
                      (item: string) => (
                        <>
                          <div className="flex gap-2 items-center">
                            <div
                              className="h-2 w-2 rounded-full"
                              style={{
                                backgroundColor:
                                  especialidadeColorMap[item.toUpperCase()] ||
                                  '#662977',
                              }}
                            ></div>
                            <div className="grid">
                              <span> {item} </span>
                              <span className="font-inter">
                                {' '}
                                {geral.especialidadeSessoes[item]}{' '}
                              </span>
                            </div>
                          </div>
                        </>
                      )
                    )}
                </div>
              </Card>
            </div>
          </>
        ) : null}

        <Card>
          {loading ? (
            <LoadingHeron />
          ) : Object.keys(list).length ? (
            <div className="w-full ">
              <div className="sm:text-end mb-4">
                <ButtonHeron
                  text="Download Excel"
                  icon="pi pi-download"
                  type="primary"
                  size="sm"
                  onClick={gerarExcel}
                />
              </div>
              <Accordion activeIndex={0}>
                {Object.keys(list).map((key: string, index: number) => {
                  return (
                    <AccordionTab
                      header={headerTemplate(list[key], key)}
                      tabIndex={index}
                    >
                      <DataTable value={list[key]} responsiveLayout="scroll">
                        <Column
                          sortable
                          field="data"
                          header="Data"
                          body={({ data }: any) => (
                            <span className="font-inter">{data}</span>
                          )}
                        ></Column>
                        <Column
                          sortable
                          field="horas"
                          header="Horário"
                          body={(rowData: any) => (
                            <span className="font-inter">
                              {rowData.horas || rowData.horario || '-'}
                            </span>
                          )}
                        ></Column>
                        <Column
                          sortable
                          field="km"
                          header="Quilometragem"
                          body={(rowData: any) =>
                            rowData.km === 0 || rowData.km === null || rowData.km === undefined
                              ? '-'
                              : rowData.km
                          }
                        ></Column>
                        <Column
                          sortable
                          field="valorKm"
                          header="Valor por km"
                          body={(rowData: any) =>
                            rowData.valorKm === 0 ||
                            rowData.valorKm === null ||
                            rowData.valorKm === undefined
                              ? '-'
                              : moneyFormat.format(rowData.valorKm)
                          }
                        ></Column>
                        <Column
                          sortable
                          field="valorSessao"
                          header="Comissão"
                          body={(rowData: any) => (
                            <span className="font-inter">
                              {moneyFormat.format(
                                rowData.valorSessao || rowData.comissao || 0
                              )}
                            </span>
                          )}
                        ></Column>
                        <Column
                          sortable
                          field="valorTotal"
                          header="Valor Total"
                          body={(rowData: any) => (
                            <span className="font-inter">
                              {moneyFormat.format(
                                rowData.valorTotal || rowData.total || 0
                              )}
                            </span>
                          )}
                        ></Column>
                      </DataTable>
                    </AccordionTab>
                  );
                })}
              </Accordion>
            </div>
          ) : (
            <div className="w-full flex items-center  justify-center">
              <NotFound />
            </div>
          )}
        </Card>
      </>
    );
  };

  useEffect(() => {
    renderDropdown();
  }, []);

  const especialidadeColorMap = buildEspecialidadeColorMap(
    dropDownList?.especialidades
  );

  return (
    <div className="grid gap-8">
      <TabView
        className="tabview-custom"
        activeIndex={activeIndex}
        onBeforeTabChange={(e) => resetList(e)}
        onTabChange={(e) => setActiveIndex(e.index)}
      >
        <TabPanel header="Terapeuta" leftIcon="pi pi-user">
          {renderScreenTerapeuta()}
        </TabPanel>
        <TabPanel header="Paciente" leftIcon="pi pi-user">
          {renderScreenPaciente()}
        </TabPanel>
      </TabView>
    </div>
  );
}
