import { useState } from 'react'
import { User, Lock, Bell, Globe, Palette, Shield, Save, Eye, EyeOff, Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { SUPPORTED_LANGUAGES } from '@/i18n'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/utils/cn'
import toast from 'react-hot-toast'

type Tab = 'profile' | 'security' | 'notifications' | 'platform' | 'appearance'

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'profile', label: 'Profile', icon: <User size={15} /> },
  { id: 'security', label: 'Security', icon: <Lock size={15} /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell size={15} /> },
  { id: 'platform', label: 'Platform', icon: <Globe size={15} /> },
  { id: 'appearance', label: 'Appearance', icon: <Palette size={15} /> },
]

const LANGUAGES = SUPPORTED_LANGUAGES
const TIMEZONES = ['Africa/Johannesburg (SAST +2)', 'Africa/Nairobi (EAT +3)', 'Africa/Lagos (WAT +1)', 'Africa/Accra (GMT +0)']

export default function SettingsPage() {
  const { user, updateUser } = useAuthStore()
  const { i18n } = useTranslation()
  const [tab, setTab] = useState<Tab>('profile')

  /* Profile state */
  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [phone, setPhone] = useState('+27 82 000 0000')
  const [org, setOrg] = useState('Carbon Smart Solutions Africa')
  const [saving, setSaving] = useState(false)

  /* Security state */
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [twoFA, setTwoFA] = useState(false)

  /* Notification prefs */
  const [notifs, setNotifs] = useState({
    pestAlerts: true, weatherAlerts: true, carbonReports: true,
    enrollments: true, lowStock: true, systemUpdates: false,
    emailDigest: true, smsAlerts: false,
  })

  /* Platform config */
  const [language, setLanguage] = useState(
    LANGUAGES.find((l) => l.code === i18n.language) ?? LANGUAGES[0]
  )
  const [timezone, setTimezone] = useState(TIMEZONES[0])
  const [units, setUnits] = useState<'metric' | 'imperial'>('metric')
  const [currency, setCurrency] = useState('ZAR')
  const [apiKey] = useState('csa_live_sk_' + 'x'.repeat(32))
  const [showKey, setShowKey] = useState(false)

  const saveProfile = async () => {
    setSaving(true)
    await new Promise((r) => setTimeout(r, 700))
    updateUser({ name, email })
    toast.success('Profile updated successfully')
    setSaving(false)
  }

  const changePassword = async () => {
    if (!currentPw) { toast.error('Enter your current password'); return }
    if (newPw.length < 8) { toast.error('New password must be at least 8 characters'); return }
    if (newPw !== confirmPw) { toast.error('Passwords do not match'); return }
    setSaving(true)
    await new Promise((r) => setTimeout(r, 800))
    toast.success('Password changed successfully')
    setCurrentPw(''); setNewPw(''); setConfirmPw('')
    setSaving(false)
  }

  const toggleNotif = (key: keyof typeof notifs) =>
    setNotifs((prev) => ({ ...prev, [key]: !prev[key] }))

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      {/* Tab bar */}
      <div className="flex gap-1 bg-white border border-gray-100 rounded-2xl p-1.5 shadow-sm w-fit">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn('flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all',
              tab === t.id ? 'bg-[#06192C] text-white shadow-sm' : 'text-gray-400 hover:text-[#06192C] hover:bg-gray-50')}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── PROFILE ── */}
      {tab === 'profile' && (
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader><CardTitle>Personal Information</CardTitle>
              <Badge variant={user?.role === 'admin' ? 'blue' : user?.role === 'agri_officer' ? 'cyan' : 'green'}>
                {user?.role?.replace('_', ' ')}
              </Badge>
            </CardHeader>

            {/* Avatar */}
            <div className="flex items-center gap-4 mb-6 p-4 bg-[#F4F8F6] rounded-xl">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#98CF59] to-[#40BBB9] flex items-center justify-center text-white text-2xl font-bold shrink-0">
                {name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-[#06192C]">{name}</p>
                <p className="text-xs text-gray-400 font-mono mt-0.5">{user?.farmerId ?? 'CSA-ADMIN-001'}</p>
                <button className="text-xs text-[#40BBB9] font-semibold mt-1.5 hover:underline">
                  Change photo
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Full Name" value={name} onChange={(e) => setName(e.target.value)} icon={<User size={14} />} />
              <Input label="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <Input label="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} />
              <Input label="Organisation" value={org} onChange={(e) => setOrg(e.target.value)} />
            </div>

            <div className="flex justify-end mt-4 pt-4 border-t border-gray-100">
              <Button onClick={saveProfile} loading={saving}>
                <Save size={14} /> Save Profile
              </Button>
            </div>
          </Card>

          <Card>
            <CardHeader><CardTitle>Account Details</CardTitle></CardHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              {[
                { label: 'Account ID', value: user?.id?.slice(0, 16) + '...' ?? '—' },
                { label: 'Role', value: user?.role?.replace('_', ' ') ?? '—' },
                { label: 'Member Since', value: '15 January 2024' },
                { label: 'Last Login', value: 'Today, 09:42 AM' },
                { label: 'Account Status', value: 'Active' },
                { label: 'Data Region', value: 'Africa (ZA)' },
              ].map((r) => (
                <div key={r.label} className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="text-xs text-gray-400">{r.label}</span>
                  <span className="text-xs font-semibold text-[#06192C]">{r.value}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ── SECURITY ── */}
      {tab === 'security' && (
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader><CardTitle>Change Password</CardTitle><Lock size={16} className="text-gray-400" /></CardHeader>
            <div className="flex flex-col gap-4 max-w-md">
              <Input label="Current Password" type={showPw ? 'text' : 'password'} value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)} icon={<Lock size={14} />}
                rightIcon={<button type="button" onClick={() => setShowPw(!showPw)}>{showPw ? <EyeOff size={14} /> : <Eye size={14} />}</button>} />
              <Input label="New Password" type={showPw ? 'text' : 'password'} value={newPw}
                onChange={(e) => setNewPw(e.target.value)} icon={<Lock size={14} />} />
              <Input label="Confirm New Password" type={showPw ? 'text' : 'password'} value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)} icon={<Lock size={14} />} />

              {/* Password strength */}
              {newPw.length > 0 && (
                <div>
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className={cn('flex-1 h-1 rounded-full',
                        newPw.length >= i * 3 ? (newPw.length >= 12 ? 'bg-[#98CF59]' : newPw.length >= 8 ? 'bg-[#40BBB9]' : 'bg-orange-400') : 'bg-gray-200')} />
                    ))}
                  </div>
                  <p className="text-[10px] text-gray-400">
                    {newPw.length < 8 ? 'Too short' : newPw.length < 12 ? 'Acceptable' : 'Strong password'}
                  </p>
                </div>
              )}

              <Button onClick={changePassword} loading={saving} className="w-fit">
                <Shield size={14} /> Update Password
              </Button>
            </div>
          </Card>

          <Card>
            <CardHeader><CardTitle>Two-Factor Authentication</CardTitle>
              <Badge variant={twoFA ? 'green' : 'gray'}>{twoFA ? 'Enabled' : 'Disabled'}</Badge>
            </CardHeader>
            <p className="text-sm text-gray-500 mb-4">
              Add an extra layer of security to your account using an authenticator app or SMS.
            </p>
            <Button variant={twoFA ? 'outline' : 'primary'} onClick={() => { setTwoFA(!twoFA); toast.success(twoFA ? '2FA disabled' : '2FA enabled') }}>
              <Shield size={14} /> {twoFA ? 'Disable 2FA' : 'Enable 2FA'}
            </Button>
          </Card>

          <Card>
            <CardHeader><CardTitle>Active Sessions</CardTitle></CardHeader>
            <div className="flex flex-col gap-2">
              {[
                { device: 'Chrome on Windows 11', location: 'Fourways, Gauteng', time: 'Now (current)', current: true },
                { device: 'Safari on iPhone 15', location: 'Johannesburg, GP', time: '2 hours ago', current: false },
              ].map((s) => (
                <div key={s.device} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-[#F4F8F6]">
                  <div>
                    <p className="text-xs font-semibold text-[#06192C]">{s.device}</p>
                    <p className="text-[10px] text-gray-400">{s.location} · {s.time}</p>
                  </div>
                  {s.current
                    ? <Badge variant="green"><Check size={10} /> Current</Badge>
                    : <button className="text-xs text-red-500 font-semibold hover:underline" onClick={() => toast.success('Session revoked')}>Revoke</button>}
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ── NOTIFICATIONS ── */}
      {tab === 'notifications' && (
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader><CardTitle>Alert Preferences</CardTitle></CardHeader>
            <div className="flex flex-col gap-1">
              {([
                { key: 'pestAlerts', label: 'Pest & disease outbreak alerts', desc: 'Immediate alerts when pest reports are filed' },
                { key: 'weatherAlerts', label: 'Climate risk warnings', desc: 'Alerts for extreme weather in farm regions' },
                { key: 'carbonReports', label: 'Carbon report generation', desc: 'Notify when monthly carbon reports are ready' },
                { key: 'enrollments', label: 'New farmer enrollments', desc: 'Notify on each new farmer registration' },
                { key: 'lowStock', label: 'Low inventory alerts', desc: 'Alert when stock drops below reorder level' },
                { key: 'systemUpdates', label: 'Platform system updates', desc: 'Maintenance windows and feature releases' },
              ] as { key: keyof typeof notifs; label: string; desc: string }[]).map((n) => (
                <div key={n.key} className="flex items-center justify-between py-3.5 border-b border-gray-50">
                  <div>
                    <p className="text-sm font-semibold text-[#06192C]">{n.label}</p>
                    <p className="text-xs text-gray-400">{n.desc}</p>
                  </div>
                  <button onClick={() => toggleNotif(n.key)}
                    className={cn('w-11 h-6 rounded-full transition-all relative shrink-0',
                      notifs[n.key] ? 'bg-[#40BBB9]' : 'bg-gray-200')}>
                    <span className={cn('absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all',
                      notifs[n.key] ? 'left-[22px]' : 'left-0.5')} />
                  </button>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader><CardTitle>Delivery Channels</CardTitle></CardHeader>
            <div className="flex flex-col gap-1">
              {([
                { key: 'emailDigest', label: 'Daily email digest', desc: 'Summary of platform activity sent each morning' },
                { key: 'smsAlerts', label: 'SMS critical alerts', desc: 'SMS for critical and emergency alerts only' },
              ] as { key: keyof typeof notifs; label: string; desc: string }[]).map((n) => (
                <div key={n.key} className="flex items-center justify-between py-3.5 border-b border-gray-50">
                  <div>
                    <p className="text-sm font-semibold text-[#06192C]">{n.label}</p>
                    <p className="text-xs text-gray-400">{n.desc}</p>
                  </div>
                  <button onClick={() => toggleNotif(n.key)}
                    className={cn('w-11 h-6 rounded-full transition-all relative shrink-0',
                      notifs[n.key] ? 'bg-[#40BBB9]' : 'bg-gray-200')}>
                    <span className={cn('absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all',
                      notifs[n.key] ? 'left-[22px]' : 'left-0.5')} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-4 pt-4 border-t border-gray-100">
              <Button onClick={() => toast.success('Notification preferences saved')} size="sm">
                <Save size={13} /> Save Preferences
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ── PLATFORM ── */}
      {tab === 'platform' && (
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader><CardTitle>Regional Settings</CardTitle></CardHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#06192C]/70 uppercase tracking-wide">Language</label>
                <select
                  value={language.code}
                  onChange={(e) => {
                    const lang = LANGUAGES.find((l) => l.code === e.target.value) ?? LANGUAGES[0]
                    setLanguage(lang)
                    i18n.changeLanguage(lang.code)
                    toast.success(`Language changed to ${lang.label}`)
                  }}
                  className="bg-[#F4F8F6] border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-[#06192C] focus:outline-none focus:ring-2 focus:ring-[#40BBB9]/40">
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>{l.flag} {l.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#06192C]/70 uppercase tracking-wide">Timezone</label>
                <select value={timezone} onChange={(e) => setTimezone(e.target.value)}
                  className="bg-[#F4F8F6] border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-[#06192C] focus:outline-none focus:ring-2 focus:ring-[#40BBB9]/40">
                  {TIMEZONES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#06192C]/70 uppercase tracking-wide">Currency</label>
                <select value={currency} onChange={(e) => setCurrency(e.target.value)}
                  className="bg-[#F4F8F6] border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-[#06192C] focus:outline-none focus:ring-2 focus:ring-[#40BBB9]/40">
                  {['ZAR', 'USD', 'EUR', 'KES', 'GHS', 'NGN'].map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#06192C]/70 uppercase tracking-wide">Measurement Units</label>
                <div className="flex gap-3">
                  {(['metric', 'imperial'] as const).map((u) => (
                    <label key={u} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" value={u} checked={units === u} onChange={() => setUnits(u)} className="accent-[#40BBB9]" />
                      <span className="text-sm font-medium text-[#06192C] capitalize">{u}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-4 pt-4 border-t border-gray-100">
              <Button onClick={() => toast.success('Regional settings saved')} size="sm">
                <Save size={13} /> Save Settings
              </Button>
            </div>
          </Card>

          <Card>
            <CardHeader><CardTitle>API Access</CardTitle><Badge variant="blue">Developer</Badge></CardHeader>
            <p className="text-xs text-gray-400 mb-4">Use this key to integrate CarbonSmart data with external systems and farm equipment.</p>
            <div className="flex gap-2 items-center">
              <div className="flex-1 bg-[#F4F8F6] border border-gray-200 rounded-xl px-4 py-2.5 font-mono text-xs text-[#06192C] truncate">
                {showKey ? apiKey : apiKey.slice(0, 12) + '•'.repeat(32)}
              </div>
              <button onClick={() => setShowKey(!showKey)}
                className="p-2.5 border border-gray-200 rounded-xl text-gray-400 hover:text-[#06192C] hover:bg-gray-50">
                {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
              <button onClick={() => { navigator.clipboard.writeText(apiKey); toast.success('API key copied') }}
                className="p-2.5 border border-gray-200 rounded-xl text-gray-400 hover:text-[#06192C] hover:bg-gray-50 text-xs font-semibold px-3">
                Copy
              </button>
            </div>
            <p className="text-[10px] text-gray-400 mt-2">Keep this key secret. Regenerate immediately if compromised.</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => toast.success('API key regenerated')}>
              Regenerate Key
            </Button>
          </Card>

          <Card>
            <CardHeader><CardTitle>Data & Privacy</CardTitle><Shield size={15} className="text-gray-400" /></CardHeader>
            <div className="flex flex-col gap-3">
              {[
                { label: 'Download my data', desc: 'Export all your farm and carbon data as a ZIP file', action: 'Request Export' },
                { label: 'Delete account', desc: 'Permanently delete your account and all associated data', action: 'Request Deletion', danger: true },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-3 border-b border-gray-50">
                  <div>
                    <p className="text-sm font-semibold text-[#06192C]">{item.label}</p>
                    <p className="text-xs text-gray-400">{item.desc}</p>
                  </div>
                  <Button size="sm" variant={item.danger ? 'danger' : 'outline'}
                    onClick={() => toast.success(`${item.action} submitted`)}>
                    {item.action}
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ── APPEARANCE ── */}
      {tab === 'appearance' && (
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader><CardTitle>Theme</CardTitle></CardHeader>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'light', label: 'Light', preview: 'bg-white border-gray-200' },
                { id: 'dark', label: 'Dark (Soon)', preview: 'bg-[#06192C] border-[#06192C]', disabled: true },
                { id: 'auto', label: 'System (Soon)', preview: 'bg-gradient-to-br from-white to-[#06192C] border-gray-300', disabled: true },
              ].map((t) => (
                <button key={t.id} disabled={t.disabled}
                  className={cn('rounded-2xl border-2 p-4 text-center transition-all',
                    t.id === 'light' ? 'border-[#40BBB9] shadow-md' : 'border-gray-100',
                    t.disabled && 'opacity-40 cursor-not-allowed')}>
                  <div className={cn('w-full h-16 rounded-xl border mb-2', t.preview)} />
                  <p className="text-xs font-semibold text-[#06192C]">{t.label}</p>
                  {t.id === 'light' && <Badge variant="cyan" className="mt-1">Active</Badge>}
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader><CardTitle>Sidebar Density</CardTitle></CardHeader>
            <div className="flex flex-col gap-2">
              {['Compact', 'Default', 'Comfortable'].map((d) => (
                <label key={d} className={cn('flex items-center gap-3 p-3 rounded-xl border cursor-pointer',
                  d === 'Default' ? 'border-[#40BBB9] bg-[#40BBB9]/5' : 'border-gray-100 hover:bg-[#F4F8F6]')}>
                  <input type="radio" name="density" defaultChecked={d === 'Default'} className="accent-[#40BBB9]" />
                  <span className="text-sm font-medium text-[#06192C]">{d}</span>
                </label>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
