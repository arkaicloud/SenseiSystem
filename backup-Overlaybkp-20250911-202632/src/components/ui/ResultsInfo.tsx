interface ResultsInfoProps {
  page: number;
  pageSize: number;
  total: number;
}

export function ResultsInfo({ page, pageSize, total }: ResultsInfoProps) {
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  
  return (
    <div className="text-sm text-slate-600">
      Mostrando {start}–{end} de {total} resultados
    </div>
  );
}