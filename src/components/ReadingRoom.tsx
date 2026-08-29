import { useEffect, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { fetchHistory, listDocuments, sendQuery } from '../api/endpoints'
import { useWorkspaceStore } from '../store/workspaceStore'
import type { ChatMessage, ConversationHistory, RetrievalMetadata } from '../types'
import { Send, Sparkles, BookOpen } from 'lucide-react'

export function ReadingRoom({ onShowSources }: { onShowSources: (m: RetrievalMetadata) => void }) {
  const queryClient = useQueryClient()
  const selectedDocumentIds = useWorkspaceStore((s) => s.selectedDocumentIds)
  const activeConversationId = useWorkspaceStore((s) => s.activeConversationId)
  const useHyde = useWorkspaceStore((s) => s.useHyde)
  const toggleHyde = useWorkspaceStore((s) => s.toggleHyde)

  const [draft, setDraft] = useState('')
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null)
  const [sendError, setSendError] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const { data: documents = [] } = useQuery({ queryKey: ['documents'], queryFn: listDocuments })
  const selectedDocs = documents.filter((document) => selectedDocumentIds.includes(document.id))

  const { data: history = [] } = useQuery({
    queryKey: ['history'],
    queryFn: fetchHistory,
    enabled: !!activeConversationId,
  })

  const conversation = history.find((c) => c.id === activeConversationId)
  const messages: ChatMessage[] = conversation?.messages ?? []
  const roomTitle = conversation?.title || 'Conversation'

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages.length, pendingQuestion, isSending])

  if (!activeConversationId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-ink-bg">
        <div className="text-center max-w-xs">
          <BookOpen className="mx-auto text-ink-line mb-3" size={32} strokeWidth={1.2} />
          <p className="font-display text-lg text-ink-muted">
            Create or select a conversation, then choose the documents for your next question.
          </p>
        </div>
      </div>
    )
  }

  async function sendQuestion(
    question: string,
    documentIds: string[],
    hydeEnabled: boolean,
  ) {
    if (!question || isSending || documentIds.length === 0 || !activeConversationId) return
    setDraft('')
    setPendingQuestion(question)
    setSendError(null)
    setIsSending(true)

    try {
      const response = await sendQuery({
        conversation_id: activeConversationId,
        document_ids: documentIds,
        query: question,
        use_hyde: hydeEnabled,
      })
      const createdAt = new Date().toISOString()
      const optimisticMessages: ChatMessage[] = [
        {
          id: `optimistic-user-${createdAt}`,
          role: 'USER',
          content: question,
          created_at: createdAt,
          metadata: { document_ids: documentIds, use_hyde: hydeEnabled },
        },
        {
          id: `optimistic-assistant-${createdAt}`,
          role: 'ASSISTANT',
          content: response.answer,
          created_at: createdAt,
          metadata: response.retrieval_metadata,
        },
      ]
      queryClient.setQueryData<ConversationHistory[]>(['history'], (current = []) => {
        if (!current.some((item) => item.id === activeConversationId)) {
          return [...current, { id: activeConversationId, title: roomTitle, messages: optimisticMessages }]
        }
        return current.map((item) =>
          item.id === activeConversationId
            ? { ...item, messages: [...item.messages, ...optimisticMessages] }
            : item,
        )
      })
      setPendingQuestion(null)
      void queryClient.invalidateQueries({ queryKey: ['history'] })
      void queryClient.invalidateQueries({ queryKey: ['conversations'] })
      void queryClient.invalidateQueries({ queryKey: ['me'] })
      void queryClient.invalidateQueries({ queryKey: ['subscription'] })
    } catch (error: any) {
      const data = error?.response?.data
      setSendError(data?.detail ?? data?.error ?? 'The RAG service is temporarily unavailable.')
    } finally {
      setIsSending(false)
    }
  }

  function handleSend() {
    const question = draft.trim()
    void sendQuestion(question, selectedDocumentIds, useHyde)
  }

  return (
    <div className="flex-1 flex flex-col bg-paper h-full min-w-0">
      <header className="px-6 py-4 border-b border-paper-line flex items-center justify-between shrink-0">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-paper-muted">
            Reading room
          </p>
          <h1 className="font-display text-xl text-paper-ink truncate">{roomTitle}</h1>
          <p className="text-xs text-paper-muted truncate">
            {selectedDocs.length > 0
              ? `Next question: ${selectedDocs.map((document) => document.title).join(' · ')}`
              : 'Select documents for the next question'}
          </p>
        </div>
        <button
          onClick={toggleHyde}
          title="Toggle HyDE (Hypothetical Document Embeddings) retrieval"
          className={`flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-card border transition-colors shrink-0
            ${useHyde
              ? 'bg-verdigris text-ink-bg border-verdigris'
              : 'border-paper-line text-paper-muted hover:border-verdigris hover:text-verdigris'}`}
        >
          <Sparkles size={12} />
          HyDE {useHyde ? 'on' : 'off'}
        </button>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
        {messages.length === 0 && (
          <p className="text-paper-muted text-sm">
            {selectedDocs.length > 0
              ? `Ask a question using the ${selectedDocs.length} selected document${selectedDocs.length === 1 ? '' : 's'}.`
              : 'Select one or more ready documents from the Ledger before asking a question.'}
          </p>
        )}
        {messages.map((message, index) => {
          const previousMessage = messages[index - 1]
          const previousMetadata = previousMessage?.role === 'USER'
            && previousMessage.metadata
            && 'document_ids' in previousMessage.metadata
            ? previousMessage.metadata
            : null
          const canRetryEmpty = message.role === 'ASSISTANT'
            && !message.content.trim()
            && previousMessage?.role === 'USER'
            && previousMetadata
          return (
            <MessageBubble
              key={message.id}
              message={message}
              onShowSources={onShowSources}
              onRetryEmpty={canRetryEmpty
                ? () => void sendQuestion(
                    previousMessage.content,
                    previousMetadata.document_ids,
                    previousMetadata.use_hyde,
                  )
                : undefined}
            />
          )
        })}
        {pendingQuestion && (
          <MessageBubble
            message={{
              id: 'pending-user-question',
              role: 'USER',
              content: pendingQuestion,
              created_at: new Date().toISOString(),
            }}
            onShowSources={onShowSources}
          />
        )}
        {isSending && (
          <div className="flex items-center gap-2 text-paper-muted text-sm">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-verdigris animate-pulse" />
            Consulting the archive…
          </div>
        )}
        {sendError && (
          <p className="text-danger text-sm">
            {sendError}
          </p>
        )}
      </div>

      <div className="p-4 border-t border-paper-line shrink-0">
        <div className="flex items-end gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            rows={1}
            disabled={selectedDocs.length === 0}
            placeholder={selectedDocs.length > 0 ? 'Ask the selected documents something…' : 'Select documents first…'}
            className="flex-1 resize-none bg-white border border-paper-line rounded-card px-3 py-2.5 text-sm
              text-paper-ink placeholder:text-paper-muted focus:border-verdigris outline-none transition-colors"
          />
          <button
            onClick={handleSend}
            disabled={!draft.trim() || isSending || selectedDocs.length === 0}
            className="bg-verdigris hover:bg-verdigris-dim transition-colors text-white rounded-card p-2.5 disabled:opacity-40"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

function MessageBubble({
  message,
  onShowSources,
  onRetryEmpty,
}: {
  message: ChatMessage
  onShowSources: (m: RetrievalMetadata) => void
  onRetryEmpty?: () => void
}) {
  const isUser = message.role === 'USER'
  const retrievalMetadata = !isUser && message.metadata && 'source_chunks' in message.metadata
    ? message.metadata
    : null
  const questionMetadata = isUser && message.metadata && 'document_ids' in message.metadata
    ? message.metadata
    : null
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[75%] ${isUser ? '' : 'w-full'}`}>
        {isUser ? (
          <div className="bg-paper-ink text-paper rounded-card px-4 py-2.5 text-sm">
            {message.content}
            {questionMetadata && (
              <p className="font-mono text-[9px] text-paper/60 mt-1.5">
                {questionMetadata.document_ids.length} document{questionMetadata.document_ids.length === 1 ? '' : 's'}
                {questionMetadata.use_hyde ? ' · HyDE' : ''}
              </p>
            )}
          </div>
        ) : (
          <div className="bg-white border border-paper-line rounded-card px-4 py-3">
            <div className="answer-prose text-[14px]">
              {message.content.trim() ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
              ) : (
                <div className="text-danger">
                  <p>The AI provider returned an empty answer.</p>
                  {onRetryEmpty && (
                    <button
                      onClick={onRetryEmpty}
                      className="mt-2 text-xs font-mono text-verdigris-dim hover:text-verdigris"
                    >
                      Retry answer →
                    </button>
                  )}
                </div>
              )}
            </div>
            {retrievalMetadata && (
              <button
                onClick={() => onShowSources(retrievalMetadata)}
                className="mt-2 font-mono text-[11px] text-verdigris-dim hover:text-verdigris transition-colors"
              >
                {retrievalMetadata.retrieved_chunks_count} source
                {retrievalMetadata.retrieved_chunks_count === 1 ? '' : 's'} · {retrievalMetadata.mode}
                {retrievalMetadata.hyde_fallback ? ' (fallback)' : ''} →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
