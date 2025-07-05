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
    const handleCallback = async () => {
      try {
        const token = searchParams.get('token')
        const user = searchParams.get('user')

        if (!token || !user) {
          setStatus('error')
          setMessage('No authentication token or user data received')
          setTimeout(() => router.push('/'), 3000)
          return
        }

        try {
          // Parse user data and set it in the context
          const userData = JSON.parse(decodeURIComponent(user))
          setUserFromCallback(userData, token)
          
          setStatus('success')
          setMessage('Authentication successful! Redirecting...')
          setTimeout(() => router.push('/contribution'), 2000)
        } catch (error) {
          console.error('Error parsing user data:', error)
          setStatus('error')
          setMessage('Invalid user data received')
          setTimeout(() => router.push('/'), 3000)
        }
      } catch (error) {
        console.error('Auth callback error:', error)
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
          </>
        )}
        
        {status === 'success' && (
          <>
            <CheckCircle className="w-12 h-12 mx-auto text-green-500" />
            <h1 className="text-2xl font-semibold text-green-600">Success!</h1>
            <p className="text-muted-foreground">{message}</p>
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