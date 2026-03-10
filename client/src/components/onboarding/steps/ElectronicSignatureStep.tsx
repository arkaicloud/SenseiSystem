import { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, ArrowRight, PenLine, Type, RotateCcw, MapPin, Clock, CheckCircle, FileText, AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export interface SignatureData {
  signatureData: string;
  signatureType: "drawn" | "typed";
  signatureTimestamp: string;
  signatureLatitude: string | null;
  signatureLongitude: string | null;
  dueDate?: string;
}

interface ElectronicSignatureStepProps {
  onNext: (data: SignatureData) => void;
  onBack: () => void;
  defaultValues?: Partial<SignatureData>;
  isMobile?: boolean;
  formData?: Record<string, any>;
}

const DUE_DATE_OPTIONS = [5, 10, 15, 20, 25];
const MONTHS_PT = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

function formatCPF(v: string) {
  const n = (v || "").replace(/\D/g, "");
  return n.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

export default function ElectronicSignatureStep({
  onNext, onBack, defaultValues, isMobile = false, formData = {},
}: ElectronicSignatureStepProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<"drawn" | "typed">("drawn");
  const [isDrawing, setIsDrawing] = useState(false);
  const [typedName, setTypedName] = useState("");
  const [hasSigned, setHasSigned] = useState(false);
  const [location, setLocation] = useState<{ lat: string; lng: string } | null>(null);
  const [locationStatus, setLocationStatus] = useState<"idle" | "loading" | "granted" | "denied">("idle");
  const [timestamp] = useState(new Date());
  const [hasReadTerms, setHasReadTerms] = useState(false);
  const [selectedDueDate, setSelectedDueDate] = useState<number>(5);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  // Fetch payment plans to display plan info
  const { data: plansData } = useQuery<{ plans: Array<{ id: number; name: string; amount: number; description: string }> }>({
    queryKey: ["/api/payment-plans"],
  });
  const plans = plansData?.plans || [];
  const selectedPlan = plans.find(p => p.id === Number(formData.paymentPlanId));

  const studentName = `${formData.firstName || ""} ${formData.lastName || ""}`.trim();
  const studentCpf = formData.cpf || "";
  const isMinor = (() => {
    if (!formData.birthDate) return false;
    const birth = new Date(formData.birthDate);
    const today = new Date();
    const age = today.getFullYear() - birth.getFullYear() -
      (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate()) ? 1 : 0);
    return age < 18;
  })();

  const financialName = formData.financialResponsibleRelationship === "self" || !formData.financialResponsibleName
    ? studentName
    : formData.financialResponsibleName;
  const financialCpf = formData.financialResponsibleRelationship === "self" || !formData.financialResponsibleCpf
    ? studentCpf
    : formData.financialResponsibleCpf;
  const showFinancialSection = isMinor || (formData.financialResponsibleRelationship && formData.financialResponsibleRelationship !== "self");

  const today = new Date();
  const dateStr = `${String(today.getDate()).padStart(2, "0")} de ${MONTHS_PT[today.getMonth()]} de ${today.getFullYear()}`;
  const cityDateStr = `Suzano, ${dateStr}`;

  // Canvas helpers
  const getCanvasPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY };
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };
  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
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
  const stopDrawing = () => { setIsDrawing(false); lastPoint.current = null; };
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
      (pos) => { setLocation({ lat: pos.coords.latitude.toFixed(6), lng: pos.coords.longitude.toFixed(6) }); setLocationStatus("granted"); },
      () => setLocationStatus("denied"),
      { timeout: 10000 }
    );
  };

  const handleSubmit = () => {
    if (!hasSigned || !hasReadTerms) return;
    const canvas = canvasRef.current;
    onNext({
      signatureData: canvas ? canvas.toDataURL("image/png") : "",
      signatureType: mode,
      signatureTimestamp: timestamp.toISOString(),
      signatureLatitude: location?.lat ?? null,
      signatureLongitude: location?.lng ?? null,
      dueDate: String(selectedDueDate),
    });
  };

  /* ── Desktop version (unchanged) ── */
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

  /* ── Mobile VYTA dark theme ── */
  return (
    <div className="flex flex-col pb-6">
      {/* Header */}
      <div className="px-6 pt-8 pb-6">
        <div className="w-12 h-12 rounded-2xl bg-[#2B54FF]/20 border border-[#2B54FF]/40 flex items-center justify-center mb-4">
          <FileText className="w-6 h-6 text-[#2B54FF]" />
        </div>
        <h2 className="text-2xl font-bold text-white">Termo de Adesão</h2>
        <p className="text-sm text-slate-400 mt-1">Leia o contrato e assine para confirmar sua matrícula</p>
      </div>

      <div className="px-6 space-y-5">

        {/* ── CONTRATO ── */}
        <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-white/5">
            <FileText className="w-4 h-4 text-[#2B54FF]" />
            <span className="text-sm font-semibold text-white">TERMO DE ADESÃO — HUIOS JIU JITSU</span>
          </div>

          <div className="px-4 py-4 max-h-72 overflow-y-auto space-y-3 text-xs text-slate-300 leading-relaxed">
            <p className="text-center text-slate-200 font-semibold text-sm">TERMO DE ADESÃO HUIOS JIU JITSU</p>
            <p className="text-slate-400 italic text-center">Por meio deste termo, você está contratando os serviços da escola HUIOS BJJ, nas condições aqui estipuladas.</p>

            <p><strong className="text-white">1. Serviços:</strong> A HUIOS BJJ presta serviços relacionados à prática de artes marciais, especificamente o JIU JITSU, incluindo orientação, espaço e equipamentos conforme as normas de utilização.</p>

            <p><strong className="text-white">2. Contrato da modalidade:</strong> Ao preencher o formulário de matrícula você concorda com os serviços e horário contratado.</p>

            <div className="bg-[#2B54FF]/10 border border-[#2B54FF]/30 rounded-xl p-3 space-y-2">
              <p className="font-semibold text-white text-xs">3. Plano, valor e data de vencimento:</p>
              <p className="text-slate-400 text-xs">Os planos são anuais (12 meses) pagos através de boleto bancário ou via Pix mensalmente, e poderão sofrer reajuste com aviso prévio. Ao preencher a ficha de matrícula você concorda com o plano, valor e prazo abaixo:</p>
              <div className="grid grid-cols-1 gap-1 pt-1">
                <div className="flex justify-between items-center border-b border-white/10 pb-1">
                  <span className="text-slate-400">Plano:</span>
                  <span className="font-semibold text-white">{selectedPlan ? selectedPlan.name : "A definir após aprovação"}</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/10 pb-1">
                  <span className="text-slate-400">Valor mensal:</span>
                  <span className="font-semibold text-white">{selectedPlan ? formatCurrency(selectedPlan.amount) : "A definir"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Vencimento:</span>
                  <span className="font-semibold text-white">Dia {selectedDueDate} de cada mês</span>
                </div>
              </div>
            </div>

            <p><strong className="text-white">4. Vencimento:</strong> Encerrada a data de vencimento, será aplicada multa de 2% do valor total e juros de 1% ao mês. Caso não efetue o pagamento até 3 dias após o vencimento, sua entrada poderá ser bloqueada até regularização.</p>

            <p><strong className="text-white">5. Cancelamento:</strong> Você poderá solicitar cancelamento com 30 dias de antecedência. Caso tenha contratado plano por prazo determinado, será devida multa de 10% sobre o montante residual.</p>

            <p><strong className="text-white">6. Cobrança:</strong> Fica facultado à HUIOS BJJ contratar empresa terceira para efetuar cobranças.</p>

            <p><strong className="text-white">7. Normas:</strong> Faz parte integrante da matrícula o Regulamento interno da escola, disponível na recepção.</p>

            <p><strong className="text-white">8. Menores:</strong> Se você é menor de 18 anos ou incapaz para os atos civis, deve ser representado neste instrumento por seu responsável legal, respondendo este solidariamente por seus atos e obrigações.</p>

            <p><strong className="text-white">9. Cessão:</strong> Os serviços prestados são de caráter pessoal e intransferível, sendo vedada cessão ou transferência a terceiros.</p>

            <p><strong className="text-white">10. Responsabilidades:</strong> A HUIOS BJJ é responsável pela segurança dos equipamentos e instalações disponibilizados.</p>

            <p><strong className="text-white">11. Declaração de saúde:</strong> O aluno declara estar em plenas condições de saúde, apto a realizar as atividades físicas, e não portar nenhuma moléstia contagiosa. Compromete-se a realizar anualmente as avaliações médicas que atestem sua liberação para prática de exercícios físicos.</p>

            <p><strong className="text-white">12. Emergência:</strong> Em caso de emergência, fica autorizado o encaminhamento ao hospital público mais próximo ou particular indicado no momento, eximindo a escola de responsabilidade quanto ao atendimento.</p>

            <p><strong className="text-white">13. Disposições gerais:</strong></p>
            <ul className="list-disc pl-4 space-y-1 text-slate-400">
              <li>Uso padronizado dos Kimonos HUIOS BJJ obrigatório no prazo de 3 meses da matrícula. Não é permitido treinar com uniformes de outras equipes.</li>
              <li>É vedada a comercialização de produtos ou serviços nas dependências da escola.</li>
              <li>O aluno é responsável por seus objetos pessoais.</li>
              <li>Acompanhantes devem permanecer fora do tatame.</li>
              <li>A escola é baseada em princípios Cristãos. Ao assinar, você está ciente de que haverá atividades com princípios religiosos.</li>
            </ul>

            {/* Financial responsible section */}
            <div className="border-t border-white/10 pt-3 mt-3">
              <p className="font-semibold text-white text-xs mb-2">RESPONSÁVEL FINANCEIRO:</p>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Nome:</span>
                  <span className="text-white font-medium text-right max-w-[55%]">{financialName || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">CPF:</span>
                  <span className="text-white font-medium">{financialCpf ? formatCPF(financialCpf) : "—"}</span>
                </div>
                {showFinancialSection && formData.financialResponsibleRelationship && formData.financialResponsibleRelationship !== "self" && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-400">E-mail:</span>
                      <span className="text-white font-medium text-right max-w-[55%]">{formData.financialResponsibleEmail || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Telefone:</span>
                      <span className="text-white font-medium">{formData.financialResponsiblePhone || "—"}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="border-t border-white/10 pt-3 text-center text-slate-400">
              <p>{cityDateStr}</p>
            </div>
          </div>
        </div>

        {/* ── Data de vencimento ── */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <p className="text-sm font-semibold text-white mb-1">📅 Data de Vencimento da Mensalidade</p>
          <p className="text-xs text-slate-400 mb-3">Escolha o dia do mês para o vencimento do boleto/Pix:</p>
          <div className="flex gap-2 flex-wrap">
            {DUE_DATE_OPTIONS.map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => setSelectedDueDate(day)}
                className={`flex-1 min-w-[52px] h-11 rounded-xl border text-sm font-bold transition-all ${
                  selectedDueDate === day
                    ? "bg-[#2B54FF] border-[#2B54FF] text-white"
                    : "bg-white/5 border-white/10 text-slate-400 hover:border-white/20"
                }`}
              >
                {day}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-2">Vencimento confirmado: Dia <strong className="text-slate-300">{selectedDueDate}</strong> de cada mês</p>
        </div>

        {/* ── Confirmar leitura ── */}
        <button
          type="button"
          onClick={() => setHasReadTerms(!hasReadTerms)}
          className={`w-full flex items-start gap-3 p-4 rounded-2xl border text-left transition-all ${
            hasReadTerms
              ? "bg-green-500/10 border-green-500/30"
              : "bg-white/5 border-white/10"
          }`}
        >
          <div className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
            hasReadTerms ? "bg-green-500 border-green-500" : "border-white/30"
          }`}>
            {hasReadTerms && <CheckCircle className="w-3.5 h-3.5 text-white" />}
          </div>
          <span className={`text-sm leading-relaxed ${hasReadTerms ? "text-green-300" : "text-slate-300"}`}>
            Li e aceito o Termo de Adesão da HUIOS JIU JITSU, incluindo as condições de pagamento, cancelamento e regras de utilização.
          </span>
        </button>

        {!hasReadTerms && (
          <Alert className="border-orange-500/20 bg-orange-500/10">
            <AlertTriangle className="h-4 w-4 text-orange-400" />
            <AlertDescription className="text-orange-300 text-xs">
              Confirme que leu e aceita o termo antes de assinar.
            </AlertDescription>
          </Alert>
        )}

        {/* ── Modo de assinatura ── */}
        <div className={`bg-white/5 border border-white/10 rounded-2xl p-4 transition-opacity ${!hasReadTerms ? "opacity-40 pointer-events-none" : ""}`}>
          <p className="text-sm font-medium text-slate-300 mb-3">Como deseja assinar?</p>
          <div className="grid grid-cols-2 gap-2">
            {(["drawn", "typed"] as const).map((m) => (
              <button key={m} onClick={() => setMode(m)}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${mode === m ? "border-[#2B54FF] bg-[#2B54FF]/20 text-[#2B54FF]" : "border-white/10 text-slate-400 hover:border-white/20"}`}>
                {m === "drawn" ? <><PenLine className="w-4 h-4" /> Desenhar</> : <><Type className="w-4 h-4" /> Digitar</>}
              </button>
            ))}
          </div>
        </div>

        {/* Typed input */}
        {mode === "typed" && hasReadTerms && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <Label className="text-slate-300 text-sm font-medium mb-2 block">Nome completo para assinatura</Label>
            <Input value={typedName} onChange={(e) => setTypedName(e.target.value)} placeholder="Digite seu nome completo"
              className="h-14 text-base bg-white/5 border-white/10 text-white placeholder:text-slate-500 rounded-xl" />
          </div>
        )}

        {/* Canvas */}
        <div className={`bg-white/5 border border-white/10 rounded-2xl p-4 transition-opacity ${!hasReadTerms ? "opacity-40 pointer-events-none" : ""}`}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-slate-300">{mode === "drawn" ? "Área de assinatura" : "Prévia da assinatura"}</p>
            <button onClick={clearCanvas} className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors">
              <RotateCcw className="w-3 h-3" /> Limpar
            </button>
          </div>
          <div className="relative rounded-xl overflow-hidden bg-white">
            <canvas ref={canvasRef} width={600} height={200} className="w-full touch-none cursor-crosshair" style={{ display: "block" }}
              onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing}
              onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing} />
            {!hasSigned && mode === "drawn" && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <p className="text-slate-400 text-sm">Assine aqui com o dedo</p>
              </div>
            )}
          </div>
          {hasSigned && <p className="text-xs text-green-400 mt-2 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Assinatura registrada</p>}
        </div>

        {/* Legal record */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
          <p className="text-sm font-medium text-slate-300">Registro legal</p>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Clock className="w-4 h-4 text-slate-500 shrink-0" />
            <span>{timestamp.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })} às {timestamp.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
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
              <button onClick={requestLocation} className="text-[#2B54FF] hover:underline font-medium">Autorizar localização (recomendado)</button>
            )}
          </div>
        </div>

        <div className="pt-2 space-y-3">
          <Button onClick={handleSubmit} disabled={!hasSigned || !hasReadTerms}
            className="w-full h-14 bg-[#2B54FF] hover:bg-[#2B54FF]/90 disabled:opacity-40 text-white font-semibold rounded-2xl text-base">
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
