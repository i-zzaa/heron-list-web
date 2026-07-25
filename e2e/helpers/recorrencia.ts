export function calcularDatasRecorrencia(
  dataInicial: string,
  intervalo: string,
  quantidade = 4
): string[] {
  const semanasPorIntervalo: Record<string, number> = {
    'Todas Semanas': 1,
    '2 Semanas': 2,
    '3 Semanas': 3,
  };

  const step = semanasPorIntervalo[intervalo];
  if (!step) {
    throw new Error(`Intervalo nao suportado: ${intervalo}`);
  }

  const dataBase = new Date(`${dataInicial}T00:00:00`);
  const datas: string[] = [];

  for (let i = 0; i < quantidade; i += 1) {
    const novaData = new Date(dataBase);
    novaData.setDate(dataBase.getDate() + i * step * 7);
    datas.push(novaData.toISOString().slice(0, 10));
  }

  return datas;
}
