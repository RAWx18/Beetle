"use client"

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'

export default function AuthCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { validateToken, setUserFromCallback } = useAuth()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Processing authentication...')

  useEffect(() => {
    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.error('Auth callback timeout - redirecting to homepage')
      setStatus('error')
      setMessage('Authentication timeout - redirecting to homepage')
      setTimeout(() => router.push('/'), 2000)
    }, 5000) // 5 second timeout

    const handleCallback = async () => {
      try {
        console.log('Starting auth callback processing...')
        const token = searchParams.get('token')
        const user = searchParams.get('user')

        console.log('Token received:', token ? 'Yes' : 'No')
        console.log('User received:', user ? 'Yes' : 'No')

        if (!token || !user) {
          console.error('Missing token or user data')
          clearTimeout(timeoutId)
          setStatus('error')
          setMessage('No authentication token or user data received')
          setTimeout(() => router.push('/'), 3000)
          return
        }

        try {
          console.log('Parsing user data...')
          // Parse user data and set it in the context
          const userData = JSON.parse(decodeURIComponent(user))
          console.log('User data parsed successfully:', userData)
          
          console.log('Setting user in context...')
          setUserFromCallback(userData, token)
          
          // Clear timeout since we're successful
          clearTimeout(timeoutId)
          
          // Get redirect destination from URL params or default to internal website
          const redirectTo = searchParams.get('redirect') || '/contribution'
          console.log('Redirecting to internal website:', redirectTo)
          
          // Try immediate redirect with fallback
          try {
            router.push(redirectTo)
          } catch (routerError) {
            console.error('Router push failed, using window.location:', routerError)
            window.location.href = redirectTo
          }
        } catch (error) {
          console.error('Error parsing user data:', error)
          clearTimeout(timeoutId)
          setStatus('error')
          setMessage('Invalid user data received')
          setTimeout(() => router.push('/'), 3000)
        }
      } catch (error) {
        console.error('Auth callback error:', error)
        clearTimeout(timeoutId)
        setStatus('error')
        setMessage('An error occurred during authentication')
        setTimeout(() => router.push('/'), 3000)
      }
    }

    handleCallback()
  }, [searchParams, validateToken, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 p-8">
        {status === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
            <h1 className="text-2xl font-semibold">Authenticating...</h1>
            <p className="text-muted-foreground">{message}</p>
            <button
              onClick={() => {
                const redirectTo = searchParams.get('redirect') || '/contribution'
                window.location.href = redirectTo
              }}
              className="mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Continue to App
            </button>
          </>
        )}
        

        
        {status === 'error' && (
          <>
            <XCircle className="w-12 h-12 mx-auto text-red-500" />
            <h1 className="text-2xl font-semibold text-red-600">Authentication Failed</h1>
            <p className="text-muted-foreground">{message}</p>
          </>
        )}
      </div>
    </div>
  )
} 