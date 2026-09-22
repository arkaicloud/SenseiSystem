interface ClassCardProps {
  class: {
    id: number;
    name: string;
    type: string;
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
      className="w-full text-left rounded-xl border p-3 hover:bg-background dark:hover:bg-card transition-colors"
      data-testid={`class-card-${c.id}`}
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="font-medium text-sm text-foreground dark:text-foreground">
            {c.name}
          </div>
          <div className="text-xs text-secondary-foreground dark:text-secondary-foreground capitalize">
            {c.type}
          </div>
        </div>
        <div className="text-xs text-muted-foreground dark:text-muted-foreground">
          {c.startTime} • {c.instructor?.name || 'Sem instrutor'}
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="mt-2 h-2 bg-muted dark:bg-muted rounded-full overflow-hidden">
        <div 
          style={{ width: `${progressPercent}%` }} 
          className="h-2 rounded-full bg-background dark:bg-muted transition-all"
        />
      </div>
      
      {/* Stats */}
      <div className="mt-2 text-xs text-secondary-foreground dark:text-muted-foreground flex flex-wrap gap-2">
        <span className="flex items-center gap-1">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          Confirmados {c.stats.confirmed}
        </span>
        <span className="flex items-center gap-1">
          <div className="w-2 h-2 bg-primary rounded-full"></div>
          Presentes {c.stats.present}
        </span>
        <span className="flex items-center gap-1">
          <div className="w-2 h-2 bg-secondary rounded-full"></div>
          Pendentes {c.stats.pending}
        </span>
        <span className="text-muted-foreground">
          / Cap {c.maxStudents}
        </span>
      </div>
      
      {/* Open button hint */}
      <div className="mt-3 text-xs text-center text-muted-foreground dark:text-muted-foreground">
        Clique para abrir chamada
      </div>
    </button>
  );
}