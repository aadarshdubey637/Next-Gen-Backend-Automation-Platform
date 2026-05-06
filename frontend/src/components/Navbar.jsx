import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Zap, User, LogOut, Settings, LayoutDashboard, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import AuthModal from './AuthModal'
import axios from 'axios'
import NotificationSystem from './NotificationSystem'

const Navbar = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [user, setUser] = useState(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  useEffect(() => {
    const syncAuth = () => {
      const token = localStorage.getItem('token')
      if (token) {
        fetchUser()
      } else {
        setUser(null)
      }
    }

    syncAuth()
    window.addEventListener('storage', syncAuth)
    return () => window.removeEventListener('storage', syncAuth)
  }, [])

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await axios.get('/api/v1/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setUser(res.data)
    } catch (err) {
      localStorage.removeItem('token')
      setUser(null)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    window.dispatchEvent(new Event('storage'))
    setUser(null)
    setIsDropdownOpen(false)
    window.location.href = '/'
  }

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-[#1a1a1a]">
        {/* Navbar Dot Pattern Background */}
        <div className="absolute inset-0 z-[-1] opacity-10 pointer-events-none select-none" 
             style={{ 
               backgroundImage: 'radial-gradient(#333 1px, transparent 1px)', 
               backgroundSize: '24px 24px' 
             }}>
        </div>
        
        <div className="max-w-7xl mx-auto px-8 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-4 group">
            <div className="w-10 h-10 bg-[#1a1a1a] rounded-md flex items-center justify-center border border-[#333] group-hover:border-[#00ffaa]/50 transition-all duration-500 shadow-2xl shadow-inner">
              <Zap className="text-[#00ffaa] fill-[#00ffaa] w-5 h-5 group-hover:scale-110 transition-transform" />
            </div>
            <span className="font-medium text-xl tracking-tighter text-white group-hover:text-[#00ffaa] transition-colors uppercase">AutoBackend</span>
          </Link>
          
          <div className="hidden lg:flex items-center gap-10">
            {[
              { label: 'Core', to: '/' },
              { label: 'Pricing', to: '/generator?tab=pricing' },
              { label: 'Builder', to: '/generator' },
              { label: 'Docs', to: '/generator?tab=docs' },
              { label: 'Logs', to: '#' }
            ].map((link) => (
              <Link 
                key={link.label}
                to={link.to} 
                className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 hover:text-white transition-all relative group"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#00ffaa] transition-all duration-300 group-hover:w-full opacity-0 group-hover:opacity-100" />
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-6">
            {user && <NotificationSystem />}
            {user ? (
              <div className="relative">
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-3 pl-2 pr-2 py-1.5 rounded-md bg-[#1a1a1a] border border-[#333] hover:border-[#00ffaa]/30 transition-all group shadow-inner"
                >
                  <div className="w-8 h-8 rounded-md bg-gradient-to-br from-[#00ffaa]/20 to-[#00ffaa]/5 flex items-center justify-center text-[#00ffaa] font-bold border border-[#00ffaa]/20 text-xs">
                    {user.username[0].toUpperCase()}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 group-hover:text-white transition-colors">{user.username}</span>
                  <ChevronDown size={12} className={`text-slate-500 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute top-full right-0 mt-3 w-56 bg-[#0f0f0f] border border-[#1a1a1a] rounded-md p-2 shadow-2xl backdrop-blur-xl"
                    >
                      <div className="px-4 py-3 border-b border-[#1a1a1a] mb-2">
                        <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Authorized Session</p>
                        <p className="text-[10px] font-bold text-white truncate uppercase tracking-tight mt-1">{user.email}</p>
                      </div>
                      <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-white/[0.02] hover:text-white transition-all">
                        <Settings size={14} /> Control Panel
                      </button>
                      <button 
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500/5 transition-all"
                      >
                        <LogOut size={14} /> Terminate
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <button 
                onClick={() => setIsAuthModalOpen(true)}
                className="bg-[#00ffaa] text-black font-black py-2.5 px-8 rounded-md hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(0,255,170,0.2)] text-[10px] uppercase tracking-[0.2em] border border-[#00ffaa]/20"
              >
                Access System
              </button>
            )}
          </div>
        </div>
      </nav>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onAuthSuccess={(userData) => setUser(userData)}
      />
    </>
  )
}

export default Navbar
