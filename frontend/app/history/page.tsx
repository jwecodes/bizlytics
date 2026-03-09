'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getHistory, deleteHistorySession } from '@/lib/api'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Trash2, BarChart2, Clock } from 'lucide-react'

interface Session {
  id: string
  file_id: string
  original_name: string
  domain: string
  created_at: string
}

export default function HistoryPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    getHistory()
      .then(data => setSessions(data.sessions))
      .catch(() => toast.error('Failed to load history'))
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async (id: string) => {
    await deleteHistorySession(id)
    setSessions(prev => prev.filter(s => s.id !== id))
    toast.success('Session deleted')
  }

  const handleReopen = (session: Session) => {
    // Store session result and navigate to dashboard
    sessionStorage.setItem('file_id', session.file_id)
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">Analysis History</h1>

        {loading && (
          <div className="text-gray-400 text-center py-12">Loading your sessions...</div>
        )}

        {!loading && sessions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-4">No analyses yet.</p>
            <Button onClick={() => router.push('/')}>Upload your first dataset</Button>
          </div>
        )}

        <div className="space-y-3">
          {sessions.map(session => (
            <Card key={session.id} className="bg-gray-900 border-gray-800 hover:border-gray-600 transition-colors">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <BarChart2 className="text-blue-400 w-5 h-5 shrink-0" />
                  <div>
                    <p className="text-white font-medium">{session.original_name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs capitalize">
                        {session.domain}
                      </Badge>
                      <span className="text-gray-500 text-xs flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(session.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleReopen(session)}>
                    Re-open
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-400 hover:text-red-300 hover:bg-red-950"
                    onClick={() => handleDelete(session.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
