'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store'
import {
  LayoutDashboard,
  Film,
  Download,
  Upload,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/catalogue', icon: Film, label: 'Catalogue' },
  { href: '/dashboard/import', icon: Upload, label: 'Import from TMDb' },
  { href: '/dashboard/export', icon: Download, label: 'Export' },
  { href: '/dashboard/settings', icon: Settings, label: 'Settings' }
]

export function Sidebar() {
  const pathname = usePathname()
  const { sidebarCollapsed, toggleSidebar } = useAppStore()

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700',
        'transition-all duration-300 flex flex-col z-40',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
        {!sidebarCollapsed && (
          <span className="font-bold text-lg text-gray-900 dark:text-white">MovieAdmin</span>
        )}
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronLeft className="w-5 h-5 text-gray-500" />
          )}
        </button>
      </div>

      <nav className="flex-1 py-4">
        {navItems.map(item => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-colors',
                isActive
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                  : 'text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!sidebarCollapsed && <span className="font-medium">{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleLogout}
          className={cn(
            'flex items-center gap-3 w-full px-4 py-3 rounded-lg',
            'text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800',
            'transition-colors'
          )}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!sidebarCollapsed && <span className="font-medium">Logout</span>}
        </button>
      </div>
    </aside>
  )
}