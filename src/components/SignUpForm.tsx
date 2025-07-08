import { useId } from 'react'

import { Button } from '@/components/Button'

export function SignUpForm() {
  let id = useId()

  return (
    <div className="relative isolate mt-6 flex items-center pr-1">
      <div className="peer w-0 flex-auto bg-transparent px-4 py-2.5 text-base text-white sm:text-[0.8125rem]/6">
        Want to be a contributor?
      </div>
      <a
        href="mailto:rawx18.dev@gmail.com?subject=Beetle%20Contributor%20Inquiry"
        className="inline-flex items-center gap-2 px-4 py-2.5 text-[0.8125rem]/6 font-semibold text-white transition-colors hover:text-sky-300 focus:outline-hidden"
      >
        Email Maintainer
        <svg viewBox="0 0 16 16" aria-hidden="true" fill="currentColor" className="h-4 w-4">
          <path fillRule="evenodd" d="M6.22 3.22a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 010-1.06z" clipRule="evenodd" />
        </svg>
      </a>
      <div className="absolute inset-0 -z-10 rounded-lg transition peer-focus:ring-4 peer-focus:ring-sky-300/15" />
      <div className="absolute inset-0 -z-10 rounded-lg bg-white/2.5 ring-1 ring-white/15 transition peer-focus:ring-sky-300" />
    </div>
  )
}