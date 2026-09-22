import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileText,
  Loader2,
  Upload,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type MedicalCertificateUploadProps = {
  studentId: number;
  required?: boolean | null;
  status?: string | null;
  readOnly?: boolean;
};

type CertificateResponse = {
  required: boolean;
  status: string | null;
  document: {
    name: string;
    mime: string;
    size: number;
    uploadedAt: string;
    downloadUrl: string;
  } | null;
};

function formatFileSize(size: number) {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MedicalCertificateUpload({
  studentId,
  required = false,
  status = null,
  readOnly = false,
}: MedicalCertificateUploadProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const { data, isLoading } = useQuery<CertificateResponse>({
    queryKey: [`/api/students/${studentId}/medical-certificate`],
    enabled: !!studentId,
    staleTime: 0,
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch(`/api/students/${studentId}/medical-certificate`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.message || "Não foi possível enviar o atestado");
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/students/${studentId}/medical-certificate`],
      });
      queryClient.invalidateQueries({ queryKey: [`/api/students/${studentId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/student/profile"] });
      toast({
        title: "Atestado enviado",
        description: "A pendência foi atualizada e o documento está disponível para a escola.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao enviar atestado",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const currentStatus = data?.status ?? status;
  const currentDocument = data?.document;
  const isPending = currentStatus === "PENDING" || (required && !currentStatus);
  const isUploaded = currentStatus === "UPLOADED" || currentStatus === "RECEIVED";

  const handleFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) uploadMutation.mutate(file);
    setIsCameraOpen(false);
  };

  if (isLoading && !data) {
    return (
      <div className="rounded-xl border border-border p-4 text-sm text-muted-foreground">
        Carregando informações do atestado...
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 dark:border-border dark:bg-background">
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 rounded-lg p-2 ${isPending ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"}`}>
          {isPending ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-sm font-semibold text-foreground dark:text-foreground">
              Atestado médico
            </h4>
            {isPending ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                <Clock3 className="h-3 w-3" /> Pendente
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                <CheckCircle2 className="h-3 w-3" /> {isUploaded ? "Enviado" : "Regularizado"}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground dark:text-muted-foreground">
            {isPending
              ? "Envie uma foto legível ou um PDF para resolver esta pendência."
              : "O documento foi enviado e poderá ser conferido pela escola."}
          </p>

          {currentDocument && (
            <a
              href={currentDocument.downloadUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex max-w-full items-center gap-2 rounded-lg bg-background px-3 py-2 text-xs text-secondary-foreground hover:bg-muted dark:bg-card dark:text-foreground"
            >
              <FileText className="h-4 w-4 flex-shrink-0 text-indigo-500" />
              <span className="truncate">{currentDocument.name}</span>
              <span className="flex-shrink-0 text-muted-foreground">({formatFileSize(currentDocument.size)})</span>
              <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
            </a>
          )}

          {!readOnly && (
            <div className="mt-3 flex flex-wrap gap-2">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60">
                {uploadMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {currentDocument ? "Substituir arquivo" : "Enviar arquivo"}
                <input
                  type="file"
                  accept="application/pdf,image/png,image/jpeg"
                  className="sr-only"
                  disabled={uploadMutation.isPending}
                  onChange={handleFile}
                />
              </label>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-secondary-foreground transition hover:bg-background has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60 dark:border-border dark:text-foreground dark:hover:bg-card">
                <Camera className="h-4 w-4" />
                Tirar foto
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="sr-only"
                  disabled={uploadMutation.isPending}
                  onChange={handleFile}
                  onClick={() => setIsCameraOpen(true)}
                />
              </label>
            </div>
          )}

          {isCameraOpen && (
            <p className="mt-2 text-[11px] text-muted-foreground">
              Se o dispositivo não abrir a câmera, escolha uma imagem da galeria.
            </p>
          )}
          <p className="mt-2 text-[11px] text-muted-foreground">PDF, PNG ou JPEG até 10 MB.</p>
        </div>
      </div>
    </div>
  );
}