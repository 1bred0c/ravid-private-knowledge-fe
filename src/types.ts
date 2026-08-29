export type DocumentStatus = 'UPLOADED' | 'PROCESSING' | 'READY' | 'FAILED'

export interface RavidDocument {
  id: string
  title: string
  status: DocumentStatus
  originalFilename: string
  mimeType: string
  fileSize: number
  fileUrl: string | null
  pageCount: number
  chunkCount: number
  errorMessage: string
  processedAt: string | null
  createdAt: string
  updatedAt: string
  ingestionTaskId: string | null
}

export interface UploadResponse {
  message: string
  document_id: string
  task_id: string
}

export interface IngestionStatus {
  task_id: string
  status: 'PROCESSING' | 'SUCCESS' | 'FAILURE'
  message?: string
  error?: string
}

export interface Conversation {
  id: string
  title: string
  created_at: string
  updated_at?: string
  message_count?: number
}

export interface SourceChunk {
  document_id: string
  filename: string
  page_number: number
  chunk_index: number
  score: number | null
  content: string
}

export interface RetrievalMetadata {
  mode: 'standard' | 'hyde'
  hypothetical_passage: string | null
  retrieved_chunks_count: number
  source_chunks: SourceChunk[]
  hyde_fallback?: boolean
  fallback_reason?: string
}

export interface ChatMessage {
  id: string
  role: 'USER' | 'ASSISTANT'
  content: string
  created_at: string
  metadata?: RetrievalMetadata | UserMessageMetadata
}

export interface UserMessageMetadata {
  document_ids: string[]
  use_hyde: boolean
}

export interface ConversationHistory {
  id: string
  title: string
  messages: ChatMessage[]
}

export interface QueryResponse {
  answer: string
  conversation_id: string
  retrieval_metadata: RetrievalMetadata
}

export interface AuthTokens {
  access: string
  refresh: string
}

export type SubscriptionStatus = 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED'

export interface SubscriptionPlan {
  id: string
  code: string
  name: string
  description: string
  price: string
  currency: string
  durationDays: number
  dailyTokenLimit: number
  maxDocuments: number
  maxFileSizeMb: number
  isActive: boolean
}

export interface Subscription {
  id: string
  status: SubscriptionStatus
  plan: SubscriptionPlan
  startsAt: string | null
  expiresAt: string | null
  cancelledAt: string | null
  dailyTokenLimit: number
  maxDocuments: number
  maxFileSizeMb: number
  tokensUsedToday: number | null
  tokensRemainingToday: number | null
}

export interface SubscribeResponse {
  subscription: Subscription
  paymentRequired: boolean
}

export interface PaymentTransaction {
  id: string
  subscriptionId: string
  provider: string
  status: string
  amount: string
  currency: string
  paymentUrl: string
  expiresAt: string
}

export interface CurrentUser {
  id: string
  username: string
  email: string
  firstName: string
  lastName: string
  subscription: Subscription | null
}
