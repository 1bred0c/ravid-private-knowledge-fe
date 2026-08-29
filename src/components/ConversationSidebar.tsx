import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, LogOut, MessageSquare, Plus, UserRound, X } from 'lucide-react'
import { createConversation, fetchMe, listConversations, listDocuments } from '../api/endpoints'
import { useAuthStore } from '../store/authStore'
import { useWorkspaceStore } from '../store/workspaceStore'

export function ConversationSidebar() {
  const queryClient = useQueryClient()
  const [creating, setCreating] = useState(false)
  const [title, setTitle] = useState('')
  const activeConversationId = useWorkspaceStore((state) => state.activeConversationId)
  const setActiveConversation = useWorkspaceStore((state) => state.setActiveConversation)
  const logout = useAuthStore((state) => state.logout)

  const conversationsQuery = useQuery({
    queryKey: ['conversations'],
    queryFn: listConversations,
  })
  const meQuery = useQuery({ queryKey: ['me'], queryFn: fetchMe })
  const documentsQuery = useQuery({ queryKey: ['documents'], queryFn: listDocuments })

  const createMutation = useMutation({
    mutationFn: (conversationTitle: string) => createConversation(conversationTitle),
    onSuccess: (conversation) => {
      setActiveConversation(conversation.id)
      setCreating(false)
      setTitle('')
      void queryClient.invalidateQueries({ queryKey: ['conversations'] })
      void queryClient.invalidateQueries({ queryKey: ['history'] })
    },
  })

  function submitConversation() {
    const conversationTitle = title.trim() || 'New conversation'
    if (!createMutation.isPending) createMutation.mutate(conversationTitle)
  }

  const user = meQuery.data
  const subscription = user?.subscription
  const documentsUsed = documentsQuery.data?.length ?? 0
  const documentsRemaining = subscription
    ? Math.max(0, subscription.maxDocuments - documentsUsed)
    : null
  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.trim().toUpperCase() || user.username.slice(0, 2).toUpperCase()
    : ''

  return (
    <aside className="w-64 shrink-0 bg-ink-bg border-r border-ink-line flex flex-col h-full">
      <div className="px-3 pt-4 pb-3 border-b border-ink-line">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink-muted">Conversations</p>
            <p className="text-xs text-ink-muted mt-1">
              {conversationsQuery.data?.length ?? 0} thread{conversationsQuery.data?.length === 1 ? '' : 's'}
            </p>
          </div>
          <button
            onClick={() => setCreating(true)}
            title="New conversation"
            className="p-1.5 rounded-card border border-ink-line text-ink-muted hover:text-verdigris hover:border-verdigris"
          >
            <Plus size={14} />
          </button>
        </div>

        {creating && (
          <div className="mt-3 flex gap-1.5">
            <input
              autoFocus
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') submitConversation()
                if (event.key === 'Escape') setCreating(false)
              }}
              maxLength={255}
              placeholder="Conversation title"
              className="input min-w-0"
            />
            <button
              onClick={submitConversation}
              disabled={createMutation.isPending}
              className="px-2 rounded-card bg-verdigris text-ink-bg disabled:opacity-50"
            >
              {createMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
            </button>
            <button onClick={() => setCreating(false)} className="text-ink-muted hover:text-ink-text">
              <X size={13} />
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {conversationsQuery.isLoading && (
          <div className="flex justify-center py-6 text-ink-muted"><Loader2 size={16} className="animate-spin" /></div>
        )}
        {!conversationsQuery.isLoading && conversationsQuery.data?.length === 0 && (
          <p className="px-4 py-5 text-xs text-ink-muted leading-relaxed">
            Create a conversation, select documents, then ask questions within that thread.
          </p>
        )}
        <ul>
          {(conversationsQuery.data ?? []).map((conversation) => {
            const selected = conversation.id === activeConversationId
            return (
              <li key={conversation.id}>
                <button
                  onClick={() => setActiveConversation(conversation.id)}
                  className={`w-full text-left px-3 py-3 border-l-2 transition-colors ${
                    selected
                      ? 'border-l-verdigris bg-ink-panel text-ink-text'
                      : 'border-l-transparent text-ink-muted hover:bg-ink-panel/60 hover:text-ink-text'
                  }`}
                >
                  <span className="flex items-start gap-2">
                    <MessageSquare size={13} className="mt-0.5 shrink-0" />
                    <span className="min-w-0">
                      <span className="block text-sm truncate">{conversation.title || 'Untitled conversation'}</span>
                      <span className="block font-mono text-[10px] mt-0.5">
                        {conversation.message_count ?? 0} message{conversation.message_count === 1 ? '' : 's'}
                      </span>
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="border-t border-ink-line p-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-verdigris/15 border border-verdigris/50 flex items-center justify-center text-xs font-semibold text-verdigris">
            {initials || <UserRound size={15} />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-ink-text truncate">{user?.username ?? 'Loading…'}</p>
            <p className="font-mono text-[10px] uppercase tracking-wider text-verdigris">
              {subscription?.plan.name ?? 'No plan'}
            </p>
          </div>
          <button
            onClick={() => {
              queryClient.clear()
              logout()
            }}
            title="Sign out"
            className="text-ink-muted hover:text-ink-text"
          >
            <LogOut size={14} />
          </button>
        </div>

        {subscription && (
          <div className="grid grid-cols-3 gap-1.5 mt-3">
            <Quota label="Tokens left" value={subscription.tokensRemainingToday?.toLocaleString() ?? '—'} />
            <Quota label="Docs left" value={`${documentsRemaining}/${subscription.maxDocuments}`} />
            <Quota label="Max file" value={`${subscription.maxFileSizeMb} MB`} />
          </div>
        )}
      </div>
    </aside>
  )
}

function Quota({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-ink-panel border border-ink-line rounded-card px-1.5 py-2 text-center min-w-0">
      <p className="font-mono text-[9px] text-ink-muted truncate">{label}</p>
      <p className="text-[11px] text-ink-text mt-0.5 truncate">{value}</p>
    </div>
  )
}
