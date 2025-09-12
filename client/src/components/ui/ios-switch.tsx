
import React from "react";

type IosSwitchProps = {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  id?: string;
  label?: string; // para aria-label quando não houver <label htmlFor>
};

export default function IosSwitch({
  checked,
  onChange,
  disabled,
  id,
  label,
}: IosSwitchProps) {
  // teclado: espaço/enter alternam
  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      if (!disabled) onChange(!checked);
    }
  };

  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      onKeyDown={handleKeyDown}
      className={[
        "relative inline-flex h-7 w-12 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out",
        checked ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600", 
        disabled ? "opacity-50 cursor-not-allowed" : "focus:outline-none focus:ring-2 focus:ring-emerald-500/50",
      ].join(" ")}
    >
      {/* trilho (para borda interna suave no modo claro/escuro) */}
      <span
        aria-hidden="true"
        className="absolute inset-0 rounded-full ring-1 ring-black/5 dark:ring-white/10"
      />
      {/* botão */}
      <span
        aria-hidden="true"
        className={[
          "pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform duration-200 ease-in-out",
          checked ? "translate-x-6" : "translate-x-1",
        ].join(" ")}
      />
    </button>
  );
}
