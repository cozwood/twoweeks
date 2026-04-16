"use client";

interface StatusBannerProps {
  isActive: boolean;
  onToggle: () => void;
}

export function StatusBanner({ isActive, onToggle }: StatusBannerProps) {
  return (
    <div className="flex items-center justify-between bg-off-white px-4 py-3 rounded-lg border border-border">
      <div className="flex items-center gap-3">
        <div
          className={`w-2 h-2 rounded-full ${isActive ? "bg-green" : "bg-gray-light"}`}
        />
        <span className="text-sm font-medium text-charcoal">
          {isActive ? "You're live to employers" : "You're hidden from employers"}
        </span>
      </div>
      <button
        onClick={onToggle}
        className="px-3 py-1 rounded-full text-xs font-medium bg-white border border-border text-charcoal hover:bg-off-white transition-colors"
      >
        {isActive ? "Hide" : "Go live"}
      </button>
    </div>
  );
}
