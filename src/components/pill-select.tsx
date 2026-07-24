"use client";

interface PillOption {
  value: string;
  label: string;
}

interface PillSelectProps {
  options: PillOption[];
  value: string | null;
  onChange: (value: string | null) => void;
  // Optional fields (e.g. Role) toggle off when you tap the already-selected
  // pill again; required fields (e.g. Shift type) just switch selection —
  // there's no "unset" state to return to.
  allowDeselect?: boolean;
  ariaLabel: string;
}

export function PillSelect({
  options,
  value,
  onChange,
  allowDeselect = false,
  ariaLabel,
}: PillSelectProps) {
  return (
    <div role="group" aria-label={ariaLabel} className="flex flex-wrap gap-2">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(selected && allowDeselect ? null : option.value)}
            className={`cursor-pointer rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              selected
                ? "bg-accent text-accent-foreground"
                : "border border-border text-foreground hover:bg-muted"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
