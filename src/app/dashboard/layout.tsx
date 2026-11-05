'use client'

import { Sidebar } from '@/components/Sidebar'
import { Header } from '@/components/Header'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store'
import { Providers } from '../providers'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed } = useAppStore()

  return (
    <Providers>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Sidebar />
        <div className={cn('transition-all duration-300', sidebarCollapsed ? 'ml-16' : 'ml-64')}>
          <Header />
          <main className="p-6">
            {children}
          </main>
        </div>
      </div>
    </Providers>
  )
}