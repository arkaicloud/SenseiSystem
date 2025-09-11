interface LoadingOverlayProps {
  text?: string;
}

export default function LoadingOverlay({ text = "Carregando..." }: LoadingOverlayProps) {
  return (
    <div 
      className="pointer-events-auto fixed inset-0 z-50 transition-opacity duration-200"
      style={{
        opacity: 0.96,
        display: "grid",
        placeItems: "center",
        background: "rgba(15,18,24,.75)",
        backdropFilter: "blur(4px)",
      }}
      role="status"
      aria-live="polite"
      data-testid="loading-overlay"
    >
      <div className="rounded-2xl p-6 bg-black/40 text-white shadow-xl">
        <div className="animate-spin h-6 w-6 mx-auto mb-3 border-2 border-white/30 border-t-white rounded-full" />
        <p className="text-sm text-center">{text}</p>
      </div>
    </div>
  );
}