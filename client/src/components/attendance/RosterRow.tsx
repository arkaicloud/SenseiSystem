interface RosterRowProps {
  student: {
    student_id: number;
    name: string;
    belt_level: string;
    confirmed: boolean;
    status: 'confirmed' | 'present' | 'late' | 'absent' | null;
  };
  onStatusChange: (status: 'confirmed' | 'present' | 'late' | 'absent' | null) => void;
  readOnly?: boolean;
}

export function RosterRow({ student: s, onStatusChange, readOnly = false }: RosterRowProps) {
  const statusButtons = [
    { value: 'confirmed', label: 'Confirmado', color: 'bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200' },
    { value: 'present', label: 'Presente', color: 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200' },
    { value: 'late', label: 'Atraso', color: 'bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-200' },
    { value: 'absent', label: 'Falta', color: 'bg-red-100 text-red-800 border-red-300 hover:bg-red-200' }
  ] as const;

  const createStatusButton = (value: typeof statusButtons[number]['value'], label: string, color: string) => (
    <button
      key={value}
      onClick={() => !readOnly && onStatusChange(value)}
      disabled={readOnly}
      className={`px-3 py-1 rounded-md border text-xs font-medium transition-colors ${
        s.status === value 
          ? color 
          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
      } ${readOnly ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
      data-testid={`status-button-${value}-${s.student_id}`}
    >
      {label}
    </button>
  );

  return (
    <tr className="border-t dark:border-slate-700">
      <td className="py-3 px-2">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-medium">
            {s.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
          </div>
          
          {/* Name and belt */}
          <div>
            <div className="font-medium text-sm text-slate-900 dark:text-slate-100">
              {s.name}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <span>Faixa {s.belt_level}</span>
              {s.confirmed && (
                <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Confirmado
                </span>
              )}
            </div>
          </div>
        </div>
      </td>
      
      {/* Status buttons */}
      <td className="py-3 px-2">
        <div className="flex gap-2 flex-wrap">
          {statusButtons.map(({ value, label, color }) => createStatusButton(value, label, color))}
          
          {/* Clear button */}
          {s.status && !readOnly && (
            <button
              onClick={() => onStatusChange(null)}
              className="px-3 py-1 rounded-md border text-xs font-medium bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200 transition-colors"
              data-testid={`status-button-clear-${s.student_id}`}
            >
              Limpar
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}