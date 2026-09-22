import React from "react";

type Props = {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  id?: string;
  label?: string;
};

export default function IosSwitch({
  checked,
  onChange,
  disabled,
  id,
  label,
}: Props) {
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
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0.5",
        "transition-colors duration-200",
        checked ? "bg-[#34C759]" : "bg-[#E9E9EA] dark:bg-[#3a3a3c]",
        disabled
          ? "opacity-50 cursor-not-allowed"
          : "focus:outline-none focus:ring-2 focus:ring-[#34C759]/40",
        // leve borda interna do trilho (iOS tem uma sutileza)
        "shadow-[inset_0_0_0_30px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_0_0_30px_rgba(255,255,255,0.08)]",
      ].join(" ")}
    >
      {/* botão branco */}
      <span
        aria-hidden="true"
        className={[
          "size-5 rounded-full bg-card",
          // sombras parecidas com iOS
          "shadow-[0_1px_2px_rgba(0,0,0,0.35),_0_0_0_0.5px_rgba(0,0,0,0.04)]",
          "transform transition-transform duration-200 will-change-transform",
          checked ? "translate-x-5" : "translate-x-0",
        ].join(" ")}
      />
    </button>
  );
}
