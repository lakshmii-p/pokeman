import { AlertTriangle, SearchX, RefreshCw } from "lucide-react";

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-6 py-16 text-center">
      <AlertTriangle className="h-9 w-9 text-[var(--accent)]" strokeWidth={1.5} />
      <p className="max-w-sm text-sm text-[var(--text-muted)]">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
        >
          <RefreshCw className="h-4 w-4" /> Try again
        </button>
      )}
    </div>
  );
}

export function NotFoundState({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-16 text-center">
      <SearchX className="h-9 w-9 text-[var(--text-muted)]" strokeWidth={1.5} />
      <p className="font-display text-lg font-semibold">No Pokémon found</p>
      <p className="max-w-sm text-sm text-[var(--text-muted)]">
        "{query}" didn't match anything in the Pokédex. Check the spelling, or try searching for
        another Pokémon.
      </p>
    </div>
  );
}
