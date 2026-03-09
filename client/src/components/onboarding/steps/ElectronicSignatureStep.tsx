import { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, ArrowRight, PenLine, Type, RotateCcw, MapPin, Clock, CheckCircle } from "lucide-react";

export interface SignatureData {
  signatureData: string;
  signatureType: "drawn" | "typed";
  signatureTimestamp: string;
  signatureLatitude: string | null;
  signatureLongitude: string | null;
}

interface ElectronicSignatureStepProps {
  onNext: (data: SignatureData) => void;
  onBack: () => void;
  defaultValues?: Partial<SignatureData>;
  isMobile?: boolean;
}

export default function ElectronicSignatureStep({
  onNext,
  onBack,
  defaultValues,
  isMobile = false,
}: ElectronicSignatureStepProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<"drawn" | "typed">("drawn");
  const [isDrawing, setIsDrawing] = useState(false);
  const [typedName, setTypedName] = useState("");
  const [hasSigned, setHasSigned] = useState(false);
  const [location, setLocation] = useState<{ lat: string; lng: string } | null>(null);
  const [locationStatus, setLocationStatus] = useState<"idle" | "loading" | "granted" | "denied">("idle");
  const [timestamp] = useState(new Date());
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  const getCanvasPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY };
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSigned(false);
    lastPoint.current = null;
  }, []);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (mode !== "drawn") return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsDrawing(true);
    lastPoint.current = getCanvasPos(e, canvas);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || mode !== "drawn") return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const pos = getCanvasPos(e, canvas);
    if (lastPoint.current) {
      ctx.beginPath();
      ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
    }
    lastPoint.current = pos;
    setHasSigned(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    lastPoint.current = null;
  };

  const renderTypedSignature = useCallback(() => {
    if (!typedName.trim()) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = `italic ${isMobile ? 52 : 60}px Georgia, 'Times New Roman', serif`;
    ctx.fillStyle = "#0f172a";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(typedName, canvas.width / 2, canvas.height / 2);
    setHasSigned(true);
  }, [typedName, isMobile]);

  useEffect(() => { if (mode === "typed") renderTypedSignature(); }, [typedName, mode, renderTypedSignature]);
  useEffect(() => { clearCanvas(); setHasSigned(false); }, [mode, clearCanvas]);

  const requestLocation = () => {
    setLocationStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude.toFixed(6), lng: pos.coords.longitude.toFixed(6) });
        setLocationStatus("granted");
      },
      () => setLocationStatus("denied"),
      { timeout: 10000 }
    );
  };

  const handleSubmit = () => {
    if (!hasSigned) return;
    const canvas = canvasRef.current;
    onNext({
      signatureData: canvas ? canvas.toDataURL("image/png") : "",
      signatureType: mode,
      signatureTimestamp: timestamp.toISOString(),
      signatureLatitude: location?.lat ?? null,
      signatureLongitude: location?.lng ?? null,
    });
  };

  if (!isMobile) {
    return (
      <div className="space-y-6">
        <div className="mb-2">
          <h3 className="text-lg font-semibold">Assinatura Eletrônica</h3>
          <p className="text-sm text-muted-foreground">Assine digitalmente para confirmar os termos de matrícula.</p>
        </div>
        <div className="bg-white border rounded-xl p-5 shadow-sm space-y-4">
          <p className="text-sm font-medium text-gray-700">Como deseja assinar?</p>
          <div className="grid grid-cols-2 gap-2">
            {(["drawn", "typed"] as const).map((m) => (
              <button key={m} onClick={() => setMode(m)}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 text-sm font-medium transition-all ${mode === m ? "border-[#2B54FF] bg-[#2B54FF]/5 text-[#2B54FF]" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}>
                {m === "drawn" ? <><PenLine className="w-4 h-4" /> Desenhar</> : <><Type className="w-4 h-4" /> Digitar nome</>}
              </button>
            ))}
          </div>
        </div>
        {mode === "typed" && (
          <div className="bg-white border rounded-xl p-5 shadow-sm">
            <Label className="text-sm font-medium text-gray-700 mb-2 block">Digite seu nome completo</Label>
            <Input value={typedName} onChange={(e) => setTypedName(e.target.value)} placeholder="Nome completo" className="text-base" />
          </div>
        )}
        <div className="bg-white border rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-700">{mode === "drawn" ? "Área de assinatura" : "Prévia"}</p>
            <button onClick={clearCanvas} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"><RotateCcw className="w-3 h-3" /> Limpar</button>
          </div>
          <div className="relative border-2 border-dashed border-gray-200 rounded-xl overflow-hidden bg-gray-50">
            <canvas ref={canvasRef} width={600} height={180} className="w-full touch-none cursor-crosshair" style={{ display: "block" }}
              onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing}
              onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing} />
            {!hasSigned && mode === "drawn" && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <p className="text-gray-400 text-sm">Assine aqui com o mouse ou touchpad</p>
              </div>
            )}
          </div>
          {hasSigned && <p className="text-xs text-green-600 mt-2 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Assinatura registrada</p>}
        </div>
        <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onBack}><ArrowLeft className="mr-2 h-4 w-4" /> Voltar</Button>
          <Button onClick={handleSubmit} disabled={!hasSigned} className="min-w-[160px]">Confirmar e Continuar <ArrowRight className="ml-2 h-4 w-4" /></Button>
        </div>
      </div>
    );
  }

  /* ── Mobile dark VYTA theme ── */
  return (
    <div className="flex flex-col pb-6">
      <div className="px-6 pt-8 pb-6">
        <div className="w-12 h-12 rounded-2xl bg-[#2B54FF]/20 border border-[#2B54FF]/40 flex items-center justify-center mb-4">
          <PenLine className="w-6 h-6 text-[#2B54FF]" />
        </div>
        <h2 className="text-2xl font-bold text-white">Assinatura Eletrônica</h2>
        <p className="text-sm text-slate-400 mt-1">Assine para confirmar sua matrícula</p>
      </div>

      <div className="px-6 space-y-4">
        {/* Mode selector */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <p className="text-sm font-medium text-slate-300 mb-3">Como deseja assinar?</p>
          <div className="grid grid-cols-2 gap-2">
            {(["drawn", "typed"] as const).map((m) => (
              <button key={m} onClick={() => setMode(m)}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${mode === m ? "border-[#2B54FF] bg-[#2B54FF]/20 text-[#2B54FF]" : "border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-300"}`}>
                {m === "drawn" ? <><PenLine className="w-4 h-4" /> Desenhar</> : <><Type className="w-4 h-4" /> Digitar</>}
              </button>
            ))}
          </div>
        </div>

        {/* Typed input */}
        {mode === "typed" && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <Label className="text-slate-300 text-sm font-medium mb-2 block">Digite seu nome completo</Label>
            <Input
              value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
              placeholder="Nome completo"
              className="h-14 text-base bg-white/5 border-white/10 text-white placeholder:text-slate-500 rounded-xl"
            />
          </div>
        )}

        {/* Canvas */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-slate-300">{mode === "drawn" ? "Área de assinatura" : "Prévia da assinatura"}</p>
            <button onClick={clearCanvas} className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors">
              <RotateCcw className="w-3 h-3" /> Limpar
            </button>
          </div>
          <div className="relative rounded-xl overflow-hidden bg-white">
            <canvas
              ref={canvasRef}
              width={600}
              height={200}
              className="w-full touch-none cursor-crosshair"
              style={{ display: "block" }}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
            {!hasSigned && mode === "drawn" && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <p className="text-slate-400 text-sm">Assine aqui com o dedo</p>
              </div>
            )}
          </div>
          {hasSigned && (
            <p className="text-xs text-green-400 mt-2 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> Assinatura registrada
            </p>
          )}
        </div>

        {/* Legal record */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
          <p className="text-sm font-medium text-slate-300">Registro legal</p>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Clock className="w-4 h-4 text-slate-500 shrink-0" />
            <span>
              {timestamp.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })} às{" "}
              {timestamp.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
            {locationStatus === "granted" && location ? (
              <span className="text-green-400">Localização confirmada ({location.lat}, {location.lng})</span>
            ) : locationStatus === "denied" ? (
              <span className="text-orange-400">Localização não autorizada</span>
            ) : locationStatus === "loading" ? (
              <span className="text-slate-400">Obtendo localização...</span>
            ) : (
              <button onClick={requestLocation} className="text-[#2B54FF] hover:underline font-medium">
                Autorizar localização (recomendado)
              </button>
            )}
          </div>
          {locationStatus === "idle" && (
            <Alert className="border-[#2B54FF]/20 bg-[#2B54FF]/10">
              <AlertDescription className="text-xs text-blue-300">
                A localização é solicitada para fins jurídicos e não é compartilhada com terceiros.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          Ao assinar, declaro que li e aceito os termos e condições da academia, autorizo a coleta e uso dos meus dados conforme a LGPD, e confirmo que todas as informações fornecidas são verídicas.
        </p>

        <div className="pt-2 space-y-3">
          <Button
            onClick={handleSubmit}
            disabled={!hasSigned}
            className="w-full h-14 bg-[#2B54FF] hover:bg-[#2B54FF]/90 disabled:opacity-40 text-white font-semibold rounded-2xl text-base"
          >
            Confirmar Assinatura <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
          <Button type="button" onClick={onBack} className="w-full h-12 bg-transparent border border-white/15 text-slate-300 hover:bg-white/5 rounded-2xl text-sm">
            <ArrowLeft className="mr-2 w-4 h-4" /> Voltar
          </Button>
        </div>
      </div>
    </div>
  );
}
