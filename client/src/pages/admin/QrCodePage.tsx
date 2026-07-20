import QRCode from "react-qr-code";
import { QrCode, Printer, Download, Info, Smartphone } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import MainLayout from "@/components/layouts/MainLayout";

export default function QrCodePage() {
  const qrContainerId = "qr-code-container";

  const { data: schoolConfig } = useQuery({ queryKey: ["/api/school-config"] });
  const schoolName = (schoolConfig as any)?.config?.schoolName || "SenseiSystem";

  const checkinUrl = `${window.location.origin}/checkin`;

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    const svgEl = document.querySelector(`#${qrContainerId} svg`);
    if (!printWindow || !svgEl) return;

    const svgData = new XMLSerializer().serializeToString(svgEl);
    const svgDataUrl = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgData);

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code Check-in — ${schoolName}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Inter', system-ui, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              background: #fff;
              padding: 40px;
            }
            h1 { font-size: 28px; font-weight: 900; color: #1e293b; margin-bottom: 6px; text-align: center; }
            p { font-size: 14px; color: #64748b; margin-bottom: 32px; text-align: center; }
            img { width: 300px; height: 300px; display: block; margin: 0 auto 24px; }
            .url { font-size: 13px; color: #4f46e5; margin-top: 16px; word-break: break-all; text-align: center; }
            .instr { font-size: 13px; color: #94a3b8; margin-top: 8px; text-align: center; }
          </style>
        </head>
        <body>
          <h1>${schoolName}</h1>
          <p>Escaneie o QR code com seu celular para fazer check-in na aula</p>
          <img src="${svgDataUrl}" alt="QR Code Check-in" />
          <p class="url">${checkinUrl}</p>
          <p class="instr">Acesse a URL acima ou escaneie o código com a câmera do celular</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handleDownload = () => {
    const svgEl = document.querySelector(`#${qrContainerId} svg`);
    if (!svgEl) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const canvas = document.createElement("canvas");
    const size = 600;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);
      URL.revokeObjectURL(url);

      const a = document.createElement("a");
      a.download = "qr-checkin.png";
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    img.src = url;
  };

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Page header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
              <QrCode className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">QR Code de Check-in</h1>
          </div>
          <p className="text-slate-500 text-sm ml-12">
            Exiba este código na academia para que os alunos registrem presença pelo celular.
          </p>
        </div>

        {/* QR card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 flex flex-col items-center gap-6">
          {/* QR code */}
          <div
            id={qrContainerId}
            className="p-4 rounded-2xl bg-white border-2 border-indigo-100 shadow-sm"
            data-testid="qr-code-container"
          >
            <QRCode
              value={checkinUrl}
              size={260}
              bgColor="#ffffff"
              fgColor="#1e1b4b"
              level="M"
            />
          </div>

          {/* URL */}
          <div className="text-center">
            <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-1">URL de destino</p>
            <p
              className="text-sm font-mono text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg break-all"
              data-testid="text-checkin-url"
            >
              {checkinUrl}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 w-full max-w-xs">
            <button
              onClick={handlePrint}
              data-testid="button-print-qr"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium transition-colors"
            >
              <Printer className="w-4 h-4" />
              Imprimir
            </button>
            <button
              onClick={handleDownload}
              data-testid="button-download-qr"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-md shadow-indigo-200 transition-colors"
            >
              <Download className="w-4 h-4" />
              Baixar PNG
            </button>
          </div>
        </div>

        {/* Instructions card */}
        <div className="mt-6 bg-blue-50 rounded-2xl border border-blue-100 p-5 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Info className="w-4 h-4 text-blue-500 flex-shrink-0" />
            <h3 className="text-sm font-semibold text-blue-800">Como usar</h3>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-200 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-bold text-blue-700">1</span>
            </div>
            <p className="text-sm text-blue-700">
              <strong>Imprima ou exiba</strong> o QR code na entrada da academia, no telão ou em um tablet.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-200 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-bold text-blue-700">2</span>
            </div>
            <p className="text-sm text-blue-700">
              O aluno <strong>escaneia com a câmera do celular</strong> e é direcionado ao portal.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-200 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-bold text-blue-700">3</span>
            </div>
            <p className="text-sm text-blue-700">
              Após fazer login, o sistema <strong>mostra apenas as aulas em andamento</strong> agora. O aluno seleciona e confirma.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-200 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Smartphone className="w-3.5 h-3.5 text-blue-700 mx-auto" />
            </div>
            <p className="text-sm text-blue-700">
              O <strong>QR code é fixo</strong> — imprime uma vez e funciona para sempre. Não precisa atualizar.
            </p>
          </div>
        </div>

        {/* Time window note */}
        <div className="mt-4 bg-amber-50 rounded-2xl border border-amber-100 p-4">
          <p className="text-sm text-amber-700">
            <strong>Janela de check-in:</strong> O aluno pode confirmar presença a partir de <strong>30 minutos antes</strong> do início da aula até o <strong>fim do horário</strong> da aula.
          </p>
        </div>
      </div>
    </MainLayout>
  );
}
