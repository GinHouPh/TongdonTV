'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AccordionProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}

export function Accordion({ title, children, defaultOpen = false }: AccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 text-left"
      >
        <span className="font-medium text-gray-900 dark:text-white">{title}</span>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        )}
      </button>
      <div className={cn('overflow-hidden transition-all duration-200', isOpen ? 'max-h-[1000px]' : 'max-h-0')}>
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}

interface MultiSelectProps {
  label: string
  options: { value: string; label: string }[]
  selected: string[]
  onChange: (values: string[]) => void
  placeholder?: string
}

export function MultiSelect({ label, options, selected, onChange, placeholder = 'Select...' }: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false)

  const toggleOption = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter(v => v !== value))
    } else {
      onChange([...selected, value])
    }
  }

  return (
    <div className="relative space-y-1">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-left"
      >
        <span className={cn('text-sm', selected.length === 0 ? 'text-gray-400' : 'text-gray-900 dark:text-white')}>
          {selected.length === 0 ? placeholder : `${selected.length} selected`}
        </span>
        <ChevronDown className="w-4 h-4 text-gray-500" />
      </button>
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {options.map(opt => (
            <label
              key={opt.value}
              className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <input
                type="checkbox"
                checked={selected.includes(opt.value)}
                onChange={() => toggleOption(opt.value)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">{opt.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

interface RangeSliderProps {
  label: string
  min: number
  max: number
  value: [number, number]
  onChange: (value: [number, number]) => void
  step?: number
  format?: (value: number) => string
}

export function RangeSlider({ label, min, max, value, onChange, step = 1, format = (v) => v.toString() }: RangeSliderProps) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
        <span className="text-sm text-gray-500">{format(value[0])} - {format(value[1])}</span>
      </div>
      <div className="flex items-center gap-4">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value[0]}
          onChange={(e) => onChange([parseFloat(e.target.value), value[1]])}
          className="flex-1"
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value[1]}
          onChange={(e) => onChange([value[0], parseFloat(e.target.value)])}
          className="flex-1"
        />
      </div>
    </div>
  )
}

interface ChipProps {
  label: string
  onRemove?: () => void
  variant?: 'default' | 'primary' | 'success' | 'danger'
}

export function Chip({ label, onRemove, variant = 'default' }: ChipProps) {
  const variants = {
    default: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    primary: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    success: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    danger: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
  }

  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full', variants[variant])}>
      {label}
      {onRemove && (
        <button onClick={onRemove} className="hover:text-red-600">
          <span className="sr-only">Remove</span>
          &times;
        </button>
      )}
    </span>
  )
}

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  const pages = []
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...')
    }
  }

  return (
    <div className="flex items-center justify-center gap-1">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-1 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
      >
        Previous
      </button>
      {pages.map((page, idx) => (
        <button
          key={idx}
          onClick={() => typeof page === 'number' && onPageChange(page)}
          disabled={page === '...'}
          className={cn(
            'px-3 py-1 text-sm rounded-lg',
            page === currentPage ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
          )}
        >
          {page}
        </button>
      ))}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-1 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
      >
        Next
      </button>
    </div>
  )
}