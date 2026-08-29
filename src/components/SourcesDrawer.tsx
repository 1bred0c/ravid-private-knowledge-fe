import { X, FileText } from 'lucide-react'
import type { RetrievalMetadata } from '../types'

export function SourcesDrawer({
  metadata,
  onClose,
}: {
  metadata: RetrievalMetadata | null
  onClose: () => void
}) {
  if (!metadata) return null

  return (
    <aside className="w-80 shrink-0 bg-ink-panel border-l border-ink-line flex flex-col h-full">
      <div className="px-4 py-4 border-b border-ink-line flex items-center justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink-muted">
            Citations
          </p>
          <p className="font-display text-base text-ink-text">
            {metadata.retrieved_chunks_count} passage{metadata.retrieved_chunks_count === 1 ? '' : 's'}
          </p>
        </div>
        <button onClick={onClose} className="text-ink-muted hover:text-ink-text transition-colors">
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {metadata.mode === 'hyde' && metadata.hypothetical_passage && (
          <div className="border border-gold/40 rounded-card p-3 bg-gold/5">
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-gold mb-1.5">
              Hypothetical passage (search aid only)
            </p>
            <p className="text-xs text-ink-muted leading-relaxed">
              {metadata.hypothetical_passage}
            </p>
            {metadata.hyde_fallback && (
              <p className="text-[11px] text-danger mt-2">
                HyDE generation failed ({metadata.fallback_reason}) — fell back to standard retrieval.
              </p>
            )}
          </div>
        )}

        {metadata.source_chunks.map((chunk, i) => (
          <div key={i} className="border border-ink-line rounded-card p-3">
            <div className="flex items-start justify-between gap-2 mb-1.5 font-mono text-[10px] text-ink-muted uppercase tracking-wider">
              <span className="flex items-center gap-1.5 min-w-0">
                <FileText size={11} className="shrink-0" />
                <span className="truncate">
                  #{i + 1} · {chunk.filename}
                  {chunk.page_number == null ? '' : ` · p.${chunk.page_number}`}
                  {chunk.chunk_index == null ? '' : ` · chunk ${chunk.chunk_index}`}
                </span>
              </span>
              {chunk.score != null && (
                <span className="text-verdigris shrink-0">{chunk.score.toFixed(3)}</span>
              )}
            </div>
            <p className="text-xs text-ink-text/90 leading-relaxed line-clamp-6">
              {chunk.content}
            </p>
          </div>
        ))}
      </div>
    </aside>
  )
}
