import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Mail, Lock, User, Github, Chrome, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import axios from 'axios'

const GOOGLE_CLIENT_ID = '140672149575-ct5ltbol94ta43u0d730jt2lt0ftdjk1.apps.googleusercontent.com'

const AuthModal = ({ isOpen, onClose, onAuthSuccess }) => {
  const [mode, setMode] = useState('login') // login, signup
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  })

  useEffect(() => {
    if (isOpen) {
      setError('')
      setSuccess('')
      setLoading(false)
    }
  }, [isOpen, mode])

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      if (mode === 'signup') {
        await axios.post('/api/v1/auth/signup', {
          username: formData.username,
          email: formData.email,
          password: formData.password
        })
        setSuccess('Account created! Logging you in...')
        // Auto login after signup
        setTimeout(() => handleLogin(), 1500)
      } else {
        await handleLogin()
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Authentication failed')
      setLoading(false)
    }
  }

  const handleLogin = async () => {
    try {
      const res = await axios.post('/api/v1/auth/login', {
        username: formData.username,
        password: formData.password
      }, {
        timeout: 15000 // 15s timeout
      })
      localStorage.setItem('token', res.data.access_token)
      // Trigger a storage event manually for other components in the same tab
      window.dispatchEvent(new Event('storage'))
      setSuccess('Successfully logged in!')
      setTimeout(() => {
        onAuthSuccess(res.data.user)
        onClose()
      }, 1000)
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed')
      setLoading(false)
    }
  }

  const handleGoogleLogin = useCallback(() => {
    setError('')
    setLoading(true)

    // Check if Google Identity Services script is loaded
    if (!window.google?.accounts?.oauth2) {
      setError('Google Sign-In is loading... Please try again in a moment.')
      setLoading(false)
      return
    }

    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: 'openid email profile',
      callback: async (tokenResponse) => {
        if (tokenResponse.error) {
          console.error('Google OAuth Error:', tokenResponse)
          setError('Google Login Failed: ' + (tokenResponse.error_description || tokenResponse.error))
          setLoading(false)
          return
        }

        try {
          // 1. Fetch user info from Google
          const userInfo = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
          })
          
          // 2. Sync with our Backend to get a JWT token
          const backendRes = await axios.post('/api/v1/auth/google', {
            email: userInfo.data.email,
            username: userInfo.data.name,
            picture: userInfo.data.picture
          })

          // 3. Store our backend token
          localStorage.setItem('token', backendRes.data.access_token)
          window.dispatchEvent(new Event('storage'))
          setSuccess(`Welcome, ${userInfo.data.name}!`)
          
          setTimeout(() => {
            onAuthSuccess({ 
              username: userInfo.data.name, 
              email: userInfo.data.email,
              role: 'user',
              picture: userInfo.data.picture 
            })
            onClose()
          }, 1000)
        } catch (err) {
          console.error('Google Auth Sync Error:', err)
          setError('Google Login failed to sync with server')
        }
        setLoading(false)
      },
      error_callback: (err) => {
        console.error('Google Token Error:', err)
        if (err?.type === 'popup_closed') {
          setError('Google popup was closed. Please try again.')
        } else if (err?.type === 'popup_failed_to_open') {
          setError('Popup blocked! Please allow popups for this site.')
        } else {
          setError('Google Sign-In failed: ' + (err?.message || 'Unknown error'))
        }
        setLoading(false)
      }
    })

    // Request the access token (opens Google popup)
    client.requestAccessToken()
  }, [onAuthSuccess, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-deep/80 backdrop-blur-xl"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-md bg-surface border border-white/10 rounded-[32px] overflow-hidden shadow-2xl"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 hover:bg-white/5 rounded-full text-slate-500 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-10">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-white mb-2">
              {mode === 'login' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-slate-400 text-sm">
              {mode === 'login' ? 'Sign in to continue to AutoBackend' : 'Start your journey with AutoBackend'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                {error}
              </motion.div>
            )}

            {success && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3 text-emerald-400 text-sm"
              >
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                {success}
              </motion.div>
            )}

            {mode === 'signup' && (
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input 
                    type="email" 
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="name@example.com"
                    className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white text-sm focus:border-primary outline-none transition-all"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Username</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="text" 
                  name="username"
                  required
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="johndoe"
                  className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white text-sm focus:border-primary outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Password</label>
                {mode === 'login' && (
                  <button type="button" className="text-[10px] font-bold text-primary hover:underline">Forgot?</button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="password" 
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white text-sm focus:border-primary outline-none transition-all"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-deep font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all mt-4"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-surface px-4 text-slate-500 font-bold">Or continue with</span>
            </div>
          </div>

          {/* Social Logins */}
          <div className="space-y-3">
            <button 
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-sm font-bold text-white group"
            >
              <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center p-1 group-hover:scale-110 transition-transform">
                <svg viewBox="0 0 24 24" className="w-full h-full">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              </div>
              Continue with Google
            </button>
            <button className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-sm font-bold text-white">
              <Github className="w-5 h-5" />
              Continue with GitHub
            </button>
          </div>

          <div className="mt-8 text-center">
            <button 
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              className="text-sm text-slate-500 hover:text-white transition-all"
            >
              {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
              <span className="text-primary font-bold">{mode === 'login' ? 'Sign Up' : 'Log In'}</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default AuthModal
