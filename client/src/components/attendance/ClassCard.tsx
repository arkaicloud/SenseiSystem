interface ClassCardProps {
  class: {
    id: number;
    name: string;
    startTime: string;
    instructor: { name: string } | null;
    maxStudents: number;
    stats: {
      confirmed: number;
      present: number;
      late: number;
      absent: number;
      pending: number;
    };
  };
  onOpen: (classId: number) => void;
}

export function ClassCard({ class: c, onOpen }: ClassCardProps) {
  const totalAttended = c.stats.present + c.stats.late;
  const progressPercent = c.maxStudents ? Math.min(100, Math.round(totalAttended * 100 / c.maxStudents)) : 0;

  return (
    <button
      onClick={() => onOpen(c.id)}
      className="w-full text-left rounded-xl border p-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
      data-testid={`class-card-${c.id}`}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="font-medium text-sm text-slate-900 dark:text-slate-100">
          {c.name}
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400">
          {c.startTime} • {c.instructor?.name || 'Sem instrutor'}
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="mt-2 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div 
          style={{ width: `${progressPercent}%` }} 
          className="h-2 rounded-full bg-slate-900 dark:bg-slate-300 transition-all" 
        />
      </div>
      
      {/* Stats */}
      <div className="mt-2 text-xs text-slate-600 dark:text-slate-400 flex flex-wrap gap-2">
        <span className="flex items-center gap-1">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          Confirmados {c.stats.confirmed}
        </span>
        <span className="flex items-center gap-1">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>  
          Presentes {c.stats.present}
        </span>
        <span className="flex items-center gap-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
          Pendentes {c.stats.pending}
        </span>
        <span className="text-slate-500">
          / Cap {c.maxStudents}
        </span>
      </div>
      
      {/* Open button hint */}
      <div className="mt-3 text-xs text-center text-slate-400 dark:text-slate-500">
        Clique para abrir chamada
      </div>
    </button>
  );
}