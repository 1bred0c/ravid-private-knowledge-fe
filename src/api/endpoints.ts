import { api } from './client'
import type {
  AuthTokens,
  ChatMessage,
  Conversation,
  CurrentUser,
  IngestionStatus,
  QueryResponse,
  RavidDocument,
  PaymentTransaction,
  SubscribeResponse,
  Subscription,
  SubscriptionPlan,
  UploadResponse,
} from '../types'

// --- Auth -------------------------------------------------------------

export async function login(username: string, password: string) {
  const { data } = await api.post<AuthTokens>('/api/auth/login/', { username, password })
  return data
}

export async function register(payload: {
  username: string
  email: string
  firstName: string
  lastName: string
  password: string
  password_confirm: string
}) {
  const { data } = await api.post('/api/auth/register/', payload)
  return data
}

export async function fetchMe() {
  const { data } = await api.get<CurrentUser>('/api/auth/me/')
  return data
}

// --- Billing ------------------------------------------------------------

export async function listSubscriptionPlans() {
  const { data } = await api.get<SubscriptionPlan[]>('/api/subscription-plans/')
  return data
}

export async function fetchCurrentSubscription() {
  const { data } = await api.get<{ subscription: Subscription | null }>('/api/subscriptions/me/')
  return data.subscription
}

export async function subscribeToPlan(planId: string) {
  const { data } = await api.post<SubscribeResponse>('/api/subscriptions/subscribe/', { planId })
  return data
}

export async function cancelSubscription() {
  const { data } = await api.post<Subscription>('/api/subscriptions/me/cancel/')
  return data
}

export async function createVnPayPayment(subscriptionId: string) {
  const { data } = await api.post<PaymentTransaction>('/api/payments/vnpay/create/', {
    subscriptionId,
  })
  return data
}

// --- Documents ----------------------------------------------------------

export async function listDocuments() {
  const { data } = await api.get<RavidDocument[]>('/api/documents/')
  return data
}

export async function uploadDocument(file: File, title?: string) {
  const form = new FormData()
  form.append('file', file)
  if (title) form.append('title', title)
  const { data } = await api.post<UploadResponse>('/api/documents/upload/', form)
  return data
}

export async function fetchIngestionStatus(taskId: string) {
  const { data } = await api.get<IngestionStatus>('/api/documents/status/', {
    params: { task_id: taskId },
  })
  return data
}

export async function retryDocument(documentId: string) {
  const { data } = await api.post<RavidDocument>(`/api/documents/${documentId}/retry/`)
  return data
}

export async function deleteDocument(documentId: string) {
  await api.delete(`/api/documents/${documentId}/`)
}

// --- Chat ----------------------------------------------------------------

export async function listConversations() {
  const { data } = await api.get<{ conversations: Conversation[] }>('/api/chat/conversations/')
  return data.conversations
}

export async function createConversation(title: string) {
  const { data } = await api.post<Conversation>('/api/chat/conversations/', { title })
  return data
}

export async function fetchHistory() {
  const { data } = await api.get<{
    conversations: { id: string; title: string; messages: ChatMessage[] }[]
  }>('/api/chat/history/')
  return data.conversations
}

export async function sendQuery(payload: {
  conversation_id: string
  document_ids: string[]
  query: string
  use_hyde: boolean
}) {
  const { data } = await api.post<QueryResponse>('/api/chat/query/', payload)
  return data
}
