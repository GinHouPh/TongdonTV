'use client'

import { Card } from '@/components/ui'

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage your application settings</p>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Profile Settings</h2>
        <p className="text-gray-600 dark:text-gray-400">Profile management coming soon...</p>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Application Settings</h2>
        <p className="text-gray-600 dark:text-gray-400">Application settings coming soon...</p>
      </Card>
    </div>
  )
}