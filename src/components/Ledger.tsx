import { useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { deleteDocument, listDocuments, retryDocument, uploadDocument } from '../api/endpoints'
import { useWorkspaceStore } from '../store/workspaceStore'
import type { DocumentStatus, RavidDocument } from '../types'
import { BookMarked, FileUp, RotateCcw, Loader2, CheckSquare, Square, Trash2, X } from 'lucide-react'

const STATUS_STYLES: Record<DocumentStatus, { dot: string; label: string }> = {
  UPLOADED: { dot: 'bg-ink-muted', label: 'queued' },
  PROCESSING: { dot: 'bg-gold animate-pulse', label: 'indexing' },
  READY: { dot: 'bg-verdigris', label: 'ready' },
  FAILED: { dot: 'bg-danger', label: 'failed' },
}

export function Ledger() {
  const queryClient = useQueryClient()
  const fileInput = useRef<HTMLInputElement>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadTitle, setUploadTitle] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const selectedIds = useWorkspaceStore((s) => s.selectedDocumentIds)
  const toggleDocument = useWorkspaceStore((s) => s.toggleDocument)
  const clearDocuments = useWorkspaceStore((s) => s.clearDocuments)
  const removeDocument = useWorkspaceStore((s) => s.removeDocument)

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: listDocuments,
    // Poll while anything is still indexing so status dots update live.
    refetchInterval: (query) =>
      query.state.data?.some((d: RavidDocument) => d.status === 'PROCESSING' || d.status === 'UPLOADED')
        ? 2000
        : false,
  })

  const uploadMutation = useMutation({
    mutationFn: ({ file, title }: { file: File; title: string }) => uploadDocument(file, title),
    onSuccess: () => {
      setUploadError(null)
      setUploadTitle('')
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
    onError: (err: any) => {
      const data = err?.response?.data
      const fieldError = data?.file ?? data?.title
      if (err?.response?.status === 403) {
        void queryClient.invalidateQueries({ queryKey: ['subscription'] })
      }
      setUploadError(
        data?.detail ?? data?.error ?? (Array.isArray(fieldError) ? fieldError[0] : fieldError) ?? 'Upload failed.',
      )
    },
  })

  const retryMutation = useMutation({
    mutationFn: (documentId: string) => retryDocument(documentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documents'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteDocument,
    onSuccess: (_, documentId) => {
      removeDocument(documentId)
      setConfirmDeleteId(null)
      void queryClient.invalidateQueries({ queryKey: ['documents'] })
      void queryClient.invalidateQueries({ queryKey: ['me'] })
    },
    onError: (error: any) => {
      const data = error?.response?.data
      setUploadError(data?.detail ?? data?.error ?? 'Could not delete the document.')
    },
  })

  function handleFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) uploadMutation.mutate({ file, title: uploadTitle.trim() })
    e.target.value = ''
  }

  return (
    <aside className="w-72 shrink-0 bg-ink-panel border-r border-ink-line flex flex-col h-full">
      <div className="px-4 pt-5 pb-4 border-b border-ink-line">
        <div className="flex items-center gap-2">
          <BookMarked className="text-verdigris" size={20} strokeWidth={1.5} />
          <span className="font-display text-lg text-ink-text">RAVID</span>
        </div>
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink-muted mt-1">
          The Ledger — {documents.length} document{documents.length === 1 ? '' : 's'}
        </p>
        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between mt-2 text-[11px] text-verdigris">
            <span>{selectedIds.length} selected for chat</span>
            <button onClick={clearDocuments} className="flex items-center gap-1 hover:text-verdigris-bright">
              <X size={11} /> Clear
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {isLoading && (
          <p className="px-4 py-6 text-sm text-ink-muted">Loading catalog…</p>
        )}
        {!isLoading && documents.length === 0 && (
          <p className="px-4 py-6 text-sm text-ink-muted leading-relaxed">
            No documents yet. Upload a PDF, TXT, or Markdown file to start a knowledge base.
          </p>
        )}
        <ul>
          {documents.map((doc) => {
            const status = STATUS_STYLES[doc.status]
            const isSelected = selectedIds.includes(doc.id)
            const isReady = doc.status === 'READY'
            return (
              <li key={doc.id} className="relative">
                <button
                  onClick={() => isReady && toggleDocument(doc.id)}
                  disabled={!isReady}
                  className={`group w-full text-left pl-3 pr-16 py-3 border-l-4 transition-all
                    ${isSelected ? 'border-l-verdigris bg-ink-bg' : 'border-l-transparent hover:border-l-ink-line hover:bg-ink-bg/50'}
                    ${!isReady ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    {isReady && (
                      isSelected
                        ? <CheckSquare size={13} className="text-verdigris" />
                        : <Square size={13} className="text-ink-muted" />
                    )}
                    <span className={`inline-block w-1.5 h-1.5 rounded-full ${status.dot}`} />
                    <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-muted">
                      {status.label}
                    </span>
                  </div>
                  <p className="font-display text-[15px] text-ink-text leading-snug truncate">
                    {doc.title}
                  </p>
                  <p className="font-mono text-[10px] text-ink-muted mt-0.5">
                    {doc.chunkCount > 0 ? `${doc.chunkCount} chunks` : doc.originalFilename}
                  </p>
                </button>
                <div className="absolute right-3 top-3 flex items-center gap-2">
                  {doc.status === 'FAILED' && (
                    <button
                      onClick={() => retryMutation.mutate(doc.id)}
                      title="Retry ingestion"
                      className="text-ink-muted hover:text-verdigris transition-colors"
                    >
                      <RotateCcw size={12} />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (confirmDeleteId === doc.id) deleteMutation.mutate(doc.id)
                      else setConfirmDeleteId(doc.id)
                    }}
                    disabled={deleteMutation.isPending}
                    title={confirmDeleteId === doc.id ? 'Click again to confirm deletion' : 'Delete document'}
                    className={`transition-colors ${confirmDeleteId === doc.id ? 'text-danger text-[10px]' : 'text-ink-muted hover:text-danger'}`}
                  >
                    {confirmDeleteId === doc.id ? 'Delete?' : <Trash2 size={12} />}
                  </button>
                  {confirmDeleteId === doc.id && (
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      title="Cancel deletion"
                      className="text-ink-muted hover:text-ink-text"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="p-3 border-t border-ink-line">
        <label className="block mb-2">
          <span className="block font-mono text-[10px] uppercase tracking-[0.1em] text-ink-muted mb-1">
            Document title
          </span>
          <input
            value={uploadTitle}
            onChange={(event) => setUploadTitle(event.target.value)}
            maxLength={255}
            placeholder="Optional — filename is the default"
            className="input"
          />
        </label>
        <input
          ref={fileInput}
          type="file"
          accept=".pdf,.txt,.md,.markdown"
          className="hidden"
          onChange={handleFilePicked}
        />
        <button
          onClick={() => fileInput.current?.click()}
          disabled={uploadMutation.isPending}
          className="w-full flex items-center justify-center gap-2 bg-transparent border border-ink-line
            hover:border-verdigris hover:text-verdigris text-ink-text text-sm rounded-card py-2.5
            transition-colors disabled:opacity-50"
        >
          {uploadMutation.isPending ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <FileUp size={14} />
          )}
          {uploadMutation.isPending ? 'Uploading…' : 'Add document'}
        </button>
        {uploadError && <p className="text-danger text-xs mt-2">{uploadError}</p>}
      </div>
    </aside>
  )
}
