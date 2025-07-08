'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

function ChevronDownIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" fill="currentColor" {...props}>
      <path d="M4.7 7.3a1 1 0 0 1 1.4-1.4L8 8.6l1.9-1.9a1 1 0 1 1 1.4 1.4l-2.6 2.6a1 1 0 0 1-1.4 0L4.7 7.3Z" />
    </svg>
  )
}

function IssuesIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" fill="currentColor" {...props}>
      <path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
      <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z" />
    </svg>
  )
}

function PullRequestIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" fill="currentColor" {...props}>
      <path d="M1.5 3.25a2.25 2.25 0 1 1 3 2.122v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 1.5 3.25Zm5.677-.177L9.573.677A.25.25 0 0 1 10 .854V2.5h1A2.5 2.5 0 0 1 13.5 5v5.628a2.251 2.251 0 1 1-1.5 0V5a1 1 0 0 0-1-1h-1v1.646a.25.25 0 0 1-.427.177L7.177 3.427a.25.25 0 0 1 0-.354ZM3.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm0 9.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm8.25.75a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Z" />
    </svg>
  )
}

function SecurityIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" fill="currentColor" {...props}>
      <path d="M8 0c-.65 0-1.26.48-1.92.85C4.92 1.48 3.62 2 2.75 2c-.339 0-.65.013-.967.024C1.27 2.037.825 2.446.8 2.96c-.292 5.937 1.815 10.64 6.394 12.676a.814.814 0 0 0 .812 0c4.579-2.035 6.686-6.739 6.394-12.676-.024-.514-.47-.923-.983-.936A15.806 15.806 0 0 1 13.25 2c-.87 0-2.17-.52-3.33-1.15A2.51 2.51 0 0 0 8 0Z" />
    </svg>
  )
}

function ContributionIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" fill="currentColor" {...props}>
      <path d="M1.5 1.75V13.5h13.75a.75.75 0 0 1 0 1.5H.75a.75.75 0 0 1-.75-.75V1.75a.75.75 0 0 1 1.5 0Zm14.28 2.5a.75.75 0 0 0-1.06-1.06L10 7.94 7.53 5.47a.75.75 0 0 0-1.06 0L3.22 8.72a.75.75 0 0 0 1.06 1.06L7 7.06l2.47 2.47a.75.75 0 0 0 1.06 0l5.25-5.25Z" />
    </svg>
  )
}

function ReadmeIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" fill="currentColor" {...props}>
      <path d="M3.75 1.5a.25.25 0 0 0-.25.25v11.5c0 .138.112.25.25.25h8.5a.25.25 0 0 0 .25-.25V6H9.75A1.75 1.75 0 0 1 8 4.25V1.5H3.75Zm5.75.56v2.19c0 .138.112.25.25.25h2.19L9.5 2.06ZM2 1.75C2 .784 2.784 0 3.75 0h5.086c.464 0 .909.184 1.237.513l3.414 3.414c.329.328.513.773.513 1.237v8.086A1.75 1.75 0 0 1 12.25 16h-8.5A1.75 1.75 0 0 1 2 14.25V1.75Z" />
    </svg>
  )
}

function CodeOfConductIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" fill="currentColor" {...props}>
      <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm3.82 1.636a.75.75 0 0 1 1.038.175l.007.009c.103.118.22.222.35.31.264.178.683.37 1.285.37.602 0 1.02-.192 1.285-.371.13-.088.247-.192.35-.31l.007-.008a.75.75 0 0 1 1.222.87l-.614-.431c.614.43.614.431.613.431v.001l-.001.002-.002.003-.005.007-.014.019a1.984 1.984 0 0 1-.184.213c-.16.166-.338.316-.53.445-.63.418-1.37.638-2.127.629-.946 0-1.652-.308-2.126-.63a3.32 3.32 0 0 1-.715-.657 1.79 1.79 0 0 1-.14-.213L7.228 10l-.614.431a.75.75 0 0 1-.114-1.795Zm1.98-3.178a.75.75 0 0 1 .75.75v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 .75-.75Z" />
    </svg>
  )
}

function LicenseIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" fill="currentColor" {...props}>
      <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm3.82 1.636a.75.75 0 0 1 1.038.175l.007.009c.103.118.22.222.35.31.264.178.683.37 1.285.37.602 0 1.02-.192 1.285-.371.13-.088.247-.192.35-.31l.007-.008a.75.75 0 0 1 1.222.87l-.614-.431c.614.43.614.431.613.431v.001l-.001.002-.002.003-.005.007-.014.019a1.984 1.984 0 0 1-.184.213c-.16.166-.338.316-.53.445-.63.418-1.37.638-2.127.629-.946 0-1.652-.308-2.126-.63a3.32 3.32 0 0 1-.715-.657 1.79 1.79 0 0 1-.14-.213L7.228 10l-.614.431a.75.75 0 0 1-.114-1.795Zm1.98-3.178a.75.75 0 0 1 .75.75v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 .75-.75Z" />
    </svg>
  )
}

function UniqueMenuIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
  // A modern, unique menu icon (three lines with a twist)
  return (
    <svg viewBox="0 0 32 32" fill="none" {...props}>
      <rect x="6" y="9" width="20" height="2.5" rx="1.25" fill="currentColor"/>
      <rect x="10" y="15" width="12" height="2.5" rx="1.25" fill="currentColor"/>
      <rect x="6" y="21" width="20" height="2.5" rx="1.25" fill="currentColor"/>
    </svg>
  )
}

const menuItems = [
  {
    name: 'Issues',
    href: 'https://github.com/RAWx18/Beetle/issues',
    icon: IssuesIcon,
    color: 'text-blue-400',
    bgColor: 'bg-blue-600/20',
    borderColor: 'border-blue-500/30',
    hoverBg: 'hover:bg-blue-600/30'
  },
  {
    name: 'Pull Requests',
    href: 'https://github.com/RAWx18/Beetle/pulls',
    icon: PullRequestIcon,
    color: 'text-green-400',
    bgColor: 'bg-green-600/20',
    borderColor: 'border-green-500/30',
    hoverBg: 'hover:bg-green-600/30'
  },
  {
    name: 'Security',
    href: 'https://github.com/RAWx18/Beetle/security',
    icon: SecurityIcon,
    color: 'text-purple-400',
    bgColor: 'bg-purple-600/20',
    borderColor: 'border-purple-500/30',
    hoverBg: 'hover:bg-purple-600/30'
  },
  {
    name: 'Contribution',
    href: 'https://github.com/RAWx18/Beetle/blob/main/CONTRIBUTING.md',
    icon: ContributionIcon,
    color: 'text-orange-400',
    bgColor: 'bg-orange-600/20',
    borderColor: 'border-orange-500/30',
    hoverBg: 'hover:bg-orange-600/30'
  },
  {
    name: 'README',
    href: 'https://github.com/RAWx18/Beetle/blob/main/README.md',
    icon: ReadmeIcon,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-600/20',
    borderColor: 'border-cyan-500/30',
    hoverBg: 'hover:bg-cyan-600/30'
  },
  {
    name: 'Code of Conduct',
    href: 'https://github.com/RAWx18/Beetle/blob/main/CODE_OF_CONDUCT.md',
    icon: CodeOfConductIcon,
    color: 'text-pink-400',
    bgColor: 'bg-pink-600/20',
    borderColor: 'border-pink-500/30',
    hoverBg: 'hover:bg-pink-600/30'
  },
  {
    name: 'License',
    href: 'https://github.com/RAWx18/Beetle/blob/main/LICENSE.md',
    icon: LicenseIcon,
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-600/20',
    borderColor: 'border-indigo-500/30',
    hoverBg: 'hover:bg-indigo-600/30'
  }
]

export function DropdownMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={
          `flex items-center justify-center w-12 h-12 rounded-full bg-gray-900/90 shadow-lg border border-gray-800/60 backdrop-blur-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-sky-400
          hover:shadow-sky-900/40 hover:bg-gray-800/90
          ${isOpen ? 'ring-2 ring-sky-400' : ''}`
        }
        aria-label="Open menu"
        style={{boxShadow: '0 4px 24px 0 rgba(56,189,248,0.08)'}}
      >
        <UniqueMenuIcon className="h-7 w-7 text-sky-300 transition-transform duration-200" />
      </button>
      
      {isOpen && (
        <div className="absolute left-0 mt-2 w-56 bg-gray-900/95 rounded-xl shadow-2xl ring-1 ring-black/5 backdrop-blur-md z-50 overflow-hidden border border-gray-800">
          <div className="py-2">
            {menuItems.map((item, index) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center px-4 py-3 text-sm text-gray-200 hover:bg-gray-800 hover:text-sky-300 transition-all duration-150 group`}
                  onClick={() => setIsOpen(false)}
                >
                  <div className={`p-2 rounded-md bg-gray-800 transition-all duration-200 mr-3`}>
                    <Icon className={`h-4 w-4 ${item.color} group-hover:scale-110 transition-transform duration-200`} />
                  </div>
                  <span className="font-medium">{item.name}</span>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
} 