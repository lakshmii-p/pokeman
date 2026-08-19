import { ALL_TYPES } from "../types/pokemon";
import { themeFor, TYPE_ICON } from "../utils/typeColors";

export function TypeFilter({
  value,
  onChange,
}: {
  value: string;
  onChange: (type: string) => void;
}) {
  return (
    <div
      className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      role="tablist"
      aria-label="Filter by type"
    >
      <FilterPill
        active={value === "all"}
        label="All"
        icon="🧬"
        onClick={() => onChange("all")}
        activeColor="var(--accent)"
      />
      {ALL_TYPES.map((type) => {
        const theme = themeFor(type);
        return (
          <FilterPill
            key={type}
            active={value === type}
            label={type}
            icon={TYPE_ICON[type]}
            onClick={() => onChange(type)}
            activeColor={theme.bg}
          />
        );
      })}
    </div>
  );
}

function FilterPill({
  active,
  label,
  icon,
  onClick,
  activeColor,
}: {
  active: boolean;
  label: string;
  icon: string;
  onClick: () => void;
  activeColor: string;
}) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className="shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold capitalize transition"
      style={
        active
          ? { backgroundColor: activeColor, borderColor: activeColor, color: "#12141c" }
          : { borderColor: "var(--border)", color: "var(--text-muted)" }
      }
    >
      <span className="mr-1">{icon}</span>
      {label}
    </button>
  );
}
