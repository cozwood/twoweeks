"use client";

interface ChipProps {
  label: string;
  selected: boolean;
  onClick: () => void;
  variant?: "default" | "cert";
}

export function Chip({ label, selected, onClick, variant = "default" }: ChipProps) {
  const isCertVariant = variant === "cert";

  return (
    <button
      onClick={onClick}
      className={`
        rounded-full
        border
        px-4
        py-2
        text-sm
        font-medium
        transition-all
        ${
          selected
            ? isCertVariant
              ? "bg-green-bg border-green text-charcoal"
              : "bg-charcoal border-charcoal text-white"
            : "bg-white border-border text-charcoal"
        }
      `}
    >
      {label}
    </button>
  );
}
