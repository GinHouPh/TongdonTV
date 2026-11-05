'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/store'
import { ToastProvider } from '@/components/ui/Toast'

export function Providers({ children }: { children: React.ReactNode }) {
  const { darkMode } = useAppStore()

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  return (
    <ToastProvider>
      {children}
    </ToastProvider>
  )
}