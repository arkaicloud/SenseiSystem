import React from "react";
import { Clock, User, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAsyncOperations } from "@/hooks/useAsyncOperations";

export interface ClassData {
  id: number;
  name: string;
  type: string;
  startTime: string;
  endTime: string;
  instructor?: { name: string } | null;
  maxStudents: number;
  currentStudents?: number;
  bookingStatus?: 'confirmed' | 'cancelled' | 'pending' | null;
}

interface ClassCardProps {
  classData: ClassData;
  onConfirmAttendance?: (classId: number) => void;
  onCancelAttendance?: (classId: number) => void;
  isLoading?: boolean;
  showActions?: boolean;
}

export function ClassCard({ 
  classData, 
  onConfirmAttendance, 
  onCancelAttendance, 
  isLoading = false,
  showActions = true 
}: ClassCardProps) {
  const { 
    id, 
    name, 
    type, 
    startTime, 
    endTime, 
    instructor, 
    maxStudents, 
    currentStudents, 
    bookingStatus 
  } = classData;

  const { confirmAttendance, cancelAttendance } = useAsyncOperations();

  const handleConfirm = async () => {
    if (isLoading) return;
    
    if (onConfirmAttendance) {
      onConfirmAttendance(id);
    } else {
      await confirmAttendance(id);
    }
  };

  const handleCancel = async () => {
    if (isLoading) return;
    
    if (onCancelAttendance) {
      onCancelAttendance(id);
    } else {
      await cancelAttendance(id);
    }
  };

  return (
    <div 
      className="container rounded-2xl border bg-card p-4 md:p-5 animate-[fadeIn_120ms_ease-out] transition-all hover:shadow-md"
      data-testid={`class-card-${id}`}
    >
      {/* Header with title and type */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 
            className="text-base font-semibold text-card-foreground mb-1"
            data-testid={`text-title-${id}`}
          >
            {name}
          </h3>
          <span 
            className="inline-block bg-muted text-muted-foreground rounded-full px-2.5 py-1 text-xs font-medium"
            data-testid={`chip-type-${id}`}
          >
            {type}
          </span>
        </div>
        
        {/* Capacity indicator */}
        {(currentStudents !== undefined && maxStudents) && (
          <span 
            className="bg-muted text-foreground/80 rounded-md px-2 py-1 text-xs font-medium"
            data-testid={`pill-capacity-${id}`}
          >
            {currentStudents}/{maxStudents}
          </span>
        )}
      </div>

      {/* Info lines with icons */}
      <div className="space-y-1.5 mb-4">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Clock size={16} />
          <span data-testid={`text-time-${id}`}>{startTime} - {endTime}</span>
        </div>
        
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <User size={16} />
          <span data-testid={`text-instructor-${id}`}>{instructor?.name || 'Sem instrutor'}</span>
        </div>
      </div>

      {/* Action buttons */}
      {showActions && (
        <div className="flex gap-2">
          {bookingStatus === 'confirmed' ? (
            <>
              <Button
                variant="secondary"
                size="sm"
                disabled
                className="flex items-center gap-1 text-xs"
                data-testid={`button-confirmed-${id}`}
              >
                <Check size={14} />
                <span data-testid={`status-confirmed-${id}`}>Confirmado</span>
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleCancel}
                disabled={isLoading}
                className="text-xs"
                data-testid={`button-cancel-${id}`}
              >
                Cancelar
              </Button>
            </>
          ) : bookingStatus === 'cancelled' ? (
            <Button
              variant="default"
              size="sm"
              onClick={handleConfirm}
              disabled={isLoading}
              className="w-full sm:w-auto"
              data-testid={`button-confirm-${id}`}
              aria-busy={isLoading}
            >
              {isLoading ? 'Confirmando...' : 'Confirmar Presença'}
            </Button>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={handleConfirm}
              disabled={isLoading}
              className="w-full sm:w-auto"
              data-testid={`button-confirm-${id}`}
              aria-busy={isLoading}
            >
              {isLoading ? 'Confirmando...' : 'Confirmar Presença'}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default ClassCard;