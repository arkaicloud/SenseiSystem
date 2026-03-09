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
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
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
    const pos = getCanvasPos(e, canvas);
    lastPoint.current = pos;
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
      ctx.strokeStyle = "#1a1a2e";
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
    ctx.fillStyle = "#1a1a2e";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(typedName, canvas.width / 2, canvas.height / 2);
    setHasSigned(true);
  }, [typedName, isMobile]);

  useEffect(() => {
    if (mode === "typed") {
      renderTypedSignature();
    }
  }, [typedName, mode, renderTypedSignature]);

  useEffect(() => {
    clearCanvas();
    setHasSigned(false);
  }, [mode, clearCanvas]);

  const requestLocation = () => {
    setLocationStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude.toFixed(6),
          lng: pos.coords.longitude.toFixed(6),
        });
        setLocationStatus("granted");
      },
      () => setLocationStatus("denied"),
      { timeout: 10000 }
    );
  };

  const handleSubmit = () => {
    if (!hasSigned) return;
    const canvas = canvasRef.current;
    const signatureBase64 = canvas ? canvas.toDataURL("image/png") : "";
    onNext({
      signatureData: signatureBase64,
      signatureType: mode,
      signatureTimestamp: timestamp.toISOString(),
      signatureLatitude: location?.lat ?? null,
      signatureLongitude: location?.lng ?? null,
    });
  };

  const containerClass = isMobile
    ? "min-h-screen bg-gray-50 flex flex-col"
    : "space-y-6";

  const cardClass = isMobile
    ? "bg-white rounded-2xl shadow-sm p-4 mx-4 mb-4"
    : "bg-white border rounded-xl p-5 shadow-sm";

  return (
    <div className={containerClass}>
      {isMobile && (
        <div className="bg-white px-4 py-4 border-b">
          <h2 className="text-lg font-bold text-gray-900">Assinatura Eletrônica</h2>
          <p className="text-sm text-gray-500 mt-0.5">Assine para confirmar sua matrícula</p>
        </div>
      )}

      {!isMobile && (
        <div className="mb-2">
          <h3 className="text-lg font-semibold">Assinatura Eletrônica</h3>
          <p className="text-sm text-muted-foreground">
            Assine digitalmente para confirmar os termos de matrícula.
          </p>
        </div>
      )}

      <div className={`${isMobile ? "px-4 mt-4 space-y-4 flex-1" : "space-y-5"}`}>
        {/* Mode selector */}
        <div className={cardClass}>
          <p className="text-sm font-medium text-gray-700 mb-3">Como deseja assinar?</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setMode("drawn")}
              className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                mode === "drawn"
                  ? "border-[#2B54FF] bg-[#2B54FF]/5 text-[#2B54FF]"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              <PenLine className="w-4 h-4" />
              Desenhar
            </button>
            <button
              onClick={() => setMode("typed")}
              className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                mode === "typed"
                  ? "border-[#2B54FF] bg-[#2B54FF]/5 text-[#2B54FF]"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              <Type className="w-4 h-4" />
              Digitar nome
            </button>
          </div>
        </div>

        {/* Typed name input */}
        {mode === "typed" && (
          <div className={cardClass}>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">
              Digite seu nome completo
            </Label>
            <Input
              value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
              placeholder="Nome completo"
              className="text-base"
            />
          </div>
        )}

        {/* Signature canvas */}
        <div className={cardClass}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-700">
              {mode === "drawn" ? "Área de assinatura" : "Prévia da assinatura"}
            </p>
            <button
              onClick={clearCanvas}
              className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Limpar
            </button>
          </div>
          <div className="relative border-2 border-dashed border-gray-200 rounded-xl overflow-hidden bg-gray-50">
            <canvas
              ref={canvasRef}
              width={600}
              height={180}
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
                <p className="text-gray-400 text-sm">
                  {isMobile ? "Assine aqui com o dedo" : "Assine aqui com o mouse ou touchpad"}
                </p>
              </div>
            )}
          </div>
          {hasSigned && (
            <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Assinatura registrada
            </p>
          )}
        </div>

        {/* Timestamp + Location */}
        <div className={cardClass}>
          <p className="text-sm font-medium text-gray-700 mb-3">Registro legal</p>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4 text-gray-400 shrink-0" />
              <span>
                {timestamp.toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}{" "}
                às{" "}
                {timestamp.toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
              {locationStatus === "granted" && location ? (
                <span className="text-green-600">
                  Localização confirmada ({location.lat}, {location.lng})
                </span>
              ) : locationStatus === "denied" ? (
                <span className="text-orange-500">Localização não autorizada</span>
              ) : locationStatus === "loading" ? (
                <span className="text-gray-400">Obtendo localização...</span>
              ) : (
                <button
                  onClick={requestLocation}
                  className="text-[#2B54FF] hover:underline font-medium"
                >
                  Autorizar localização (recomendado)
                </button>
              )}
            </div>
          </div>

          {locationStatus === "idle" && (
            <Alert className="mt-3 border-blue-100 bg-blue-50">
              <AlertDescription className="text-xs text-blue-700">
                A localização é solicitada para fins jurídicos e não é compartilhada com terceiros.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Legal text */}
        <p className={`text-xs text-gray-500 leading-relaxed ${isMobile ? "px-0 pb-2" : ""}`}>
          Ao assinar, declaro que li e aceito os termos e condições da academia, autorizo a
          coleta e uso dos meus dados conforme a LGPD, e confirmo que todas as informações
          fornecidas são verídicas.
        </p>
      </div>

      {/* Navigation */}
      {isMobile ? (
        <div className="bg-white border-t p-4 flex flex-col gap-3">
          <Button
            onClick={handleSubmit}
            disabled={!hasSigned}
            className="w-full h-12 bg-[#2B54FF] hover:bg-[#2B54FF]/90 text-white font-semibold rounded-xl"
          >
            Confirmar Assinatura
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
          <Button variant="ghost" onClick={onBack} className="w-full h-10 text-gray-500">
            <ArrowLeft className="mr-2 w-4 h-4" />
            Voltar
          </Button>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onBack} className="w-full sm:w-auto">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!hasSigned}
            className="w-full sm:w-auto min-w-[160px]"
          >
            Confirmar e Continuar
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
