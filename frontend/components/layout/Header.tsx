'use client'

import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { LogOut, History, BarChart2 } from 'lucide-react'
import Link from 'next/link'

export default function Header() {
  const { user, logout } = useAuth()

  return (
    <header className="h-14 border-b border-gray-800 bg-gray-950 flex items-center justify-between px-6">
      <Link href="/" className="flex items-center gap-2">
        <BarChart2 className="text-blue-400 w-5 h-5" />
        <span className="text-white font-semibold text-lg">BizLytics</span>
      </Link>

      <div className="flex items-center gap-3">
        <Link href="/history">
          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white gap-2">
            <History className="w-4 h-4" />
            History
          </Button>
        </Link>

        {user && (
          <>
            <span className="text-gray-400 text-sm hidden sm:block">{user.email}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-gray-400 hover:text-red-400 gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </Button>
          </>
        )}
      </div>
    </header>
  )
}
