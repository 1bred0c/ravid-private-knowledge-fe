import { useState } from 'react'
import { AuthGate } from './components/AuthGate'
import { Ledger } from './components/Ledger'
import { ReadingRoom } from './components/ReadingRoom'
import { SourcesDrawer } from './components/SourcesDrawer'
import { SubscriptionGate } from './components/SubscriptionGate'
import { ConversationSidebar } from './components/ConversationSidebar'
import type { RetrievalMetadata } from './types'

export default function App() {
  const [activeSources, setActiveSources] = useState<RetrievalMetadata | null>(null)

  return (
    <AuthGate>
      <SubscriptionGate>
        <div className="h-screen flex overflow-hidden">
          <Ledger />
          <ConversationSidebar />
          <ReadingRoom onShowSources={setActiveSources} />
          <SourcesDrawer metadata={activeSources} onClose={() => setActiveSources(null)} />
        </div>
      </SubscriptionGate>
    </AuthGate>
  )
}
