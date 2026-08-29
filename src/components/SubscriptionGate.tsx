import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BookMarked, Check, CreditCard, Loader2, LogOut, RotateCcw, X } from 'lucide-react'
import {
  cancelSubscription,
  createVnPayPayment,
  fetchCurrentSubscription,
  listSubscriptionPlans,
  subscribeToPlan,
} from '../api/endpoints'
import { useAuthStore } from '../store/authStore'
import type { SubscriptionPlan } from '../types'

function errorMessage(error: any) {
  const data = error?.response?.data
  if (typeof data?.detail === 'string') return data.detail
  if (typeof data?.error === 'string') return data.error
  if (data && typeof data === 'object') {
    const first = Object.values(data).flat()[0]
    if (first) return String(first)
  }
  return error?.message ?? 'Something went wrong. Please try again.'
}

function formatPrice(plan: SubscriptionPlan) {
  if (Number(plan.price) === 0) return 'Free'
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: plan.currency,
    maximumFractionDigits: 0,
  }).format(Number(plan.price))
}

export function SubscriptionGate({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()
  const username = useAuthStore((state) => state.username)
  const logout = useAuthStore((state) => state.logout)

  const subscriptionQuery = useQuery({
    queryKey: ['subscription'],
    queryFn: fetchCurrentSubscription,
    refetchInterval: 60_000,
  })
  const plansQuery = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: listSubscriptionPlans,
  })

  const subscribeMutation = useMutation({
    mutationFn: (planId: string) => subscribeToPlan(planId),
    onSuccess: ({ subscription }) => {
      queryClient.setQueryData(['subscription'], subscription)
    },
  })
  const cancelMutation = useMutation({
    mutationFn: cancelSubscription,
    onSuccess: () => queryClient.setQueryData(['subscription'], null),
  })
  const paymentMutation = useMutation({
    mutationFn: createVnPayPayment,
    onSuccess: (payment) => window.location.assign(payment.paymentUrl),
  })

  const subscription = subscriptionQuery.data
  if (subscription?.status === 'ACTIVE') return <>{children}</>

  const loading = subscriptionQuery.isLoading || plansQuery.isLoading
  const mutationError = subscribeMutation.error || cancelMutation.error || paymentMutation.error

  return (
    <div className="min-h-screen bg-ink-bg text-ink-text">
      <header className="h-16 border-b border-ink-line px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookMarked className="text-verdigris" size={22} strokeWidth={1.5} />
          <span className="font-display text-xl tracking-wide">RAVID</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-ink-muted">
          <span>{username}</span>
          <button
            onClick={() => {
              queryClient.clear()
              logout()
            }}
            className="flex items-center gap-1.5 hover:text-ink-text transition-colors"
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="max-w-2xl mx-auto text-center mb-10">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-verdigris mb-3">
            Archive membership
          </p>
          <h1 className="font-display text-4xl mb-3">Choose how you want to read</h1>
          <p className="text-ink-muted leading-relaxed">
            A subscription controls document storage, upload size, and the daily AI token allowance.
            You can start free and upgrade later.
          </p>
        </div>

        {loading && (
          <div className="flex justify-center py-16 text-ink-muted">
            <Loader2 className="animate-spin" size={24} />
          </div>
        )}

        {(subscriptionQuery.isError || plansQuery.isError) && (
          <div className="max-w-lg mx-auto border border-danger/50 bg-danger/10 rounded-card p-4 text-sm">
            <p>{errorMessage(subscriptionQuery.error || plansQuery.error)}</p>
            <button
              onClick={() => {
                void subscriptionQuery.refetch()
                void plansQuery.refetch()
              }}
              className="mt-3 inline-flex items-center gap-1.5 text-ink-text hover:text-verdigris"
            >
              <RotateCcw size={13} /> Try again
            </button>
          </div>
        )}

        {!loading && subscription?.status === 'PENDING' && (
          <div className="max-w-xl mx-auto border border-gold/50 bg-ink-panel rounded-card p-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-gold mb-2">
              Payment pending
            </p>
            <h2 className="font-display text-2xl">{subscription.plan.name}</h2>
            <p className="text-ink-muted text-sm mt-2">
              Complete payment to activate this plan, or cancel it to choose another plan.
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => paymentMutation.mutate(subscription.id)}
                disabled={paymentMutation.isPending || cancelMutation.isPending}
                className="flex-1 flex items-center justify-center gap-2 bg-gold hover:bg-gold-dim text-ink-bg rounded-card py-2.5 font-medium disabled:opacity-50"
              >
                {paymentMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <CreditCard size={15} />}
                Pay with VNPay
              </button>
              <button
                onClick={() => cancelMutation.mutate()}
                disabled={paymentMutation.isPending || cancelMutation.isPending}
                className="px-4 border border-ink-line rounded-card text-ink-muted hover:text-ink-text disabled:opacity-50"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {!loading && !subscription && (
          <div className="grid md:grid-cols-2 gap-5 max-w-3xl mx-auto">
            {(plansQuery.data ?? []).map((plan) => (
              <article
                key={plan.id}
                className={`relative bg-ink-panel border rounded-card p-6 ${
                  plan.code === 'PRO' ? 'border-verdigris' : 'border-ink-line'
                }`}
              >
                {plan.code === 'PRO' && (
                  <span className="absolute right-4 top-4 font-mono text-[10px] uppercase tracking-wider text-verdigris">
                    More capacity
                  </span>
                )}
                <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink-muted">
                  {plan.code}
                </p>
                <h2 className="font-display text-2xl mt-1">{plan.name}</h2>
                <p className="text-3xl font-display text-verdigris mt-4">
                  {formatPrice(plan)}
                  <span className="text-xs font-sans text-ink-muted ml-1">/ {plan.durationDays} days</span>
                </p>
                <p className="text-sm text-ink-muted mt-3 min-h-10">{plan.description}</p>
                <ul className="mt-5 space-y-2 text-sm">
                  <Feature>{plan.maxDocuments} documents</Feature>
                  <Feature>{plan.maxFileSizeMb} MB per file</Feature>
                  <Feature>{plan.dailyTokenLimit.toLocaleString()} AI tokens per day</Feature>
                  <Feature>Multi-document chat and citations</Feature>
                </ul>
                <button
                  onClick={() => subscribeMutation.mutate(plan.id)}
                  disabled={subscribeMutation.isPending}
                  className={`w-full mt-6 rounded-card py-2.5 font-medium transition-colors disabled:opacity-50 ${
                    plan.code === 'PRO'
                      ? 'bg-verdigris hover:bg-verdigris-bright text-ink-bg'
                      : 'border border-ink-line hover:border-verdigris hover:text-verdigris'
                  }`}
                >
                  {subscribeMutation.isPending && subscribeMutation.variables === plan.id
                    ? 'Selecting…'
                    : Number(plan.price) === 0 ? 'Start free' : `Choose ${plan.name}`}
                </button>
              </article>
            ))}
          </div>
        )}

        {mutationError && (
          <p className="max-w-xl mx-auto mt-5 text-center text-danger text-sm">
            {errorMessage(mutationError)}
          </p>
        )}
      </main>
    </div>
  )
}

function Feature({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2 text-ink-text/90">
      <Check size={14} className="text-verdigris shrink-0" />
      {children}
    </li>
  )
}
