import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, Lock, Eye, EyeOff, Leaf } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/store/authStore'
import { api, ApiError } from '@/services/api'
import type { User } from '@/types'
import toast from 'react-hot-toast'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type FormData = z.infer<typeof schema>

/* Demo credentials — seeded in the backend DB; also used as offline fallback */
const DEMO_USERS = [
  { email: 'admin@carbonsmart.co.za', password: 'admin123', role: 'admin', name: 'Sipho Dlamini', label: 'CSSA Admin' },
  { email: 'officer@carbonsmart.co.za', password: 'officer123', role: 'field_officer', name: 'Amara Osei', label: 'Field Officer' },
  { email: 'lab@carbonsmart.co.za', password: 'lab123', role: 'lab_technician', name: 'Naledi Khumalo', label: 'Lab Technician' },
  { email: 'auditor@carbonsmart.co.za', password: 'auditor123', role: 'vvb_auditor', name: 'Erik Johansson', label: 'VVB Auditor' },
  { email: 'farmer@carbonsmart.co.za', password: 'farmer123', role: 'farmer', name: 'John Mwangi', farmerId: 'CSA-2024-00001', label: 'Farmer' },
] as const

interface LoginResponse {
  user: User
  access: string
  refresh: string
}

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const res = await api.post<LoginResponse>('/api/v1/auth/login', data)
      login(res.user, res.access, res.refresh)
      toast.success(`Welcome back, ${res.user.name.split(' ')[0]}!`)
      navigate('/dashboard')
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message)
      } else {
        /* API unreachable — fall back to local demo mode so the UI still works */
        const matched = DEMO_USERS.find(
          (u) => u.email === data.email && u.password === data.password
        )
        if (matched) {
          login(
            {
              id: crypto.randomUUID(),
              name: matched.name,
              email: matched.email,
              role: matched.role,
              farmerId: 'farmerId' in matched ? matched.farmerId : undefined,
            },
            'demo-jwt-token'
          )
          toast.success(`Welcome back, ${matched.name.split(' ')[0]}! (offline demo mode)`)
          navigate('/dashboard')
        } else {
          toast.error('API unreachable and no matching demo credentials')
        }
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-[#F4F8F6]">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#06192C] flex-col justify-between p-12 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-[#40BBB9]/10" />
        <div className="absolute -bottom-32 -left-20 w-96 h-96 rounded-full bg-[#98CF59]/10" />
        <div className="absolute top-1/2 right-0 w-64 h-64 rounded-full bg-[#22B3DB]/8" />

        {/* Logo */}
        <div className="flex items-center gap-3 relative">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#40BBB9] to-[#22B3DB] flex items-center justify-center">
            <Leaf size={20} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-lg leading-tight">CarbonSmart</p>
            <p className="text-[#66C390] text-xs font-medium">Solutions Africa</p>
          </div>
        </div>

        {/* Hero text */}
        <div className="relative">
          <div className="inline-block bg-[#40BBB9]/20 text-[#40BBB9] text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            Drop a Seed. Grow a Carbon Economy.
          </div>
          <h2 className="text-4xl font-bold text-white leading-snug mb-4">
            Climate Solutions<br />
            <span className="text-[#98CF59]">Rooted in</span><br />
            African Soil
          </h2>
          <p className="text-white/50 text-sm leading-relaxed max-w-xs">
            Empowering African farmers with real-time carbon tracking, smart farming tools, and sustainable income through carbon markets.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 relative">
          {[
            { value: '12,400+', label: 'Farmers Enrolled' },
            { value: '84k tCO₂', label: 'Carbon Tracked' },
            { value: '94%', label: 'Compliance Rate' },
          ].map((s) => (
            <div key={s.label} className="bg-white/8 rounded-2xl p-4 border border-white/10">
              <p className="text-[#98CF59] font-bold text-xl">{s.value}</p>
              <p className="text-white/40 text-xs mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#40BBB9] to-[#22B3DB] flex items-center justify-center">
              <Leaf size={18} className="text-white" />
            </div>
            <div>
              <p className="text-[#06192C] font-bold">CarbonSmart Solutions Africa</p>
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[#06192C]">Welcome back</h1>
            <p className="text-gray-400 text-sm mt-1">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="you@carbonsmart.co.za"
              icon={<Mail size={15} />}
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              icon={<Lock size={15} />}
              rightIcon={
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="cursor-pointer">
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              }
              error={errors.password?.message}
              {...register('password')}
            />

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="accent-[#40BBB9]" />
                <span className="text-gray-500">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-[#40BBB9] font-semibold hover:underline">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" loading={loading} className="w-full mt-2 py-3">
              Sign In
            </Button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-6">
            New farmer?{' '}
            <Link to="/register" className="text-[#40BBB9] font-semibold hover:underline">
              Enroll now
            </Link>
          </p>

          {/* Demo credentials */}
          <div className="mt-8 p-4 bg-[#40BBB9]/8 rounded-2xl border border-[#40BBB9]/20">
            <p className="text-xs font-bold text-[#06192C] mb-2">Demo Credentials</p>
            <div className="flex flex-col gap-1.5">
              {DEMO_USERS.map((u) => (
                <button
                  key={u.email}
                  type="button"
                  onClick={() => { setValue('email', u.email); setValue('password', u.password) }}
                  className="flex justify-between items-center text-xs hover:bg-[#40BBB9]/10 rounded-lg px-1.5 py-0.5 -mx-1.5 transition-colors cursor-pointer"
                  title={`Sign in as ${u.label}`}
                >
                  <span className="text-gray-500">{u.email}</span>
                  <span className="text-[#40BBB9] font-mono">{u.password}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
