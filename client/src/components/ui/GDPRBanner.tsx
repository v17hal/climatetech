import { useState, useEffect } from 'react'
import { Shield, X, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from './Button'
import { cn } from '@/utils/cn'

const STORAGE_KEY = 'cs-gdpr-consent'

export function GDPRBanner() {
  const [visible, setVisible] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [prefs, setPrefs] = useState({ essential: true, analytics: true, functional: true })

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) setVisible(true)
  }, [])

  const accept = (all: boolean) => {
    const consent = all
      ? { essential: true, analytics: true, functional: true }
      : { essential: true, ...prefs }
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...consent, date: new Date().toISOString() }))
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[9999] flex justify-center">
      <div className="w-full max-w-2xl bg-[#06192C] rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
        <div className="p-5">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#40BBB9]/20 rounded-xl flex items-center justify-center shrink-0">
                <Shield size={16} className="text-[#40BBB9]" />
              </div>
              <div>
                <p className="text-white font-bold text-sm">Your Privacy Matters</p>
                <p className="text-white/50 text-xs mt-0.5">
                  We use cookies to keep the platform secure and improve your experience.
                  We comply with GDPR and POPIA (South Africa).
                </p>
              </div>
            </div>
            <button onClick={() => accept(false)} className="text-white/30 hover:text-white shrink-0 p-1">
              <X size={16} />
            </button>
          </div>

          {/* Expandable preferences */}
          {expanded && (
            <div className="mb-4 flex flex-col gap-2">
              {[
                { key: 'essential' as const, label: 'Essential Cookies', desc: 'Required for login and security. Cannot be disabled.', locked: true },
                { key: 'analytics' as const, label: 'Analytics', desc: 'Helps us understand how the platform is used to improve features.' },
                { key: 'functional' as const, label: 'Functional', desc: 'Remembers your preferences such as language, timezone, and layout.' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3">
                  <div>
                    <p className="text-white text-xs font-semibold">{item.label}</p>
                    <p className="text-white/40 text-[10px]">{item.desc}</p>
                  </div>
                  <button
                    disabled={item.locked}
                    onClick={() => !item.locked && setPrefs((p) => ({ ...p, [item.key]: !p[item.key] }))}
                    className={cn(
                      'w-10 h-5 rounded-full transition-all relative shrink-0',
                      (item.locked || prefs[item.key]) ? 'bg-[#40BBB9]' : 'bg-white/20',
                      item.locked && 'cursor-not-allowed opacity-70'
                    )}
                  >
                    <span className={cn(
                      'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all',
                      (item.locked || prefs[item.key]) ? 'left-[22px]' : 'left-0.5'
                    )} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-white/40 hover:text-white text-xs font-semibold transition-colors"
            >
              {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              {expanded ? 'Hide preferences' : 'Manage preferences'}
            </button>
            <div className="flex gap-2 ml-auto">
              <Button variant="ghost" size="sm" className="text-white/60 hover:text-white hover:bg-white/10 text-xs"
                onClick={() => accept(false)}>
                Accept selection
              </Button>
              <Button size="sm" className="text-xs" onClick={() => accept(true)}>
                Accept all
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
