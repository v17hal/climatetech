import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { User, Mail, Lock, Phone, MapPin, Leaf, ChevronRight, ChevronLeft, Check } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/utils/cn'
import toast from 'react-hot-toast'

const step1Schema = z.object({
  name: z.string().min(2, 'Full name required'),
  email: z.string().email('Valid email required'),
  phone: z.string().min(10, 'Valid phone number required'),
  nationalId: z.string().min(6, 'National ID required'),
})

const step2Schema = z.object({
  farmName: z.string().min(2, 'Farm name required'),
  province: z.string().min(2, 'Province required'),
  district: z.string().min(2, 'District required'),
  farmSize: z.coerce.number().min(0.1, 'Farm size required'),
})

const step3Schema = z.object({
  password: z.string().min(8, 'Minimum 8 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

type Step1 = z.infer<typeof step1Schema>
type Step2 = z.infer<typeof step2Schema>
type Step3 = z.infer<typeof step3Schema>

const PROVINCES = [
  'Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal',
  'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape', 'Western Cape',
]

const CROP_TYPES = ['Maize', 'Wheat', 'Sorghum', 'Sunflower', 'Soybeans', 'Vegetables', 'Fruit', 'Cotton', 'Sugar Cane', 'Other']

const steps = ['Personal Info', 'Farm Details', 'Account Setup']

export default function RegisterPage() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [step, setStep] = useState(0)
  const [step1Data, setStep1Data] = useState<Step1 | null>(null)
  const [step2Data, setStep2Data] = useState<Step2 | null>(null)
  const [selectedCrops, setSelectedCrops] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const form1 = useForm<Step1>({ resolver: zodResolver(step1Schema) })
  const form2 = useForm<Step2>({ resolver: zodResolver(step2Schema) })
  const form3 = useForm<Step3>({ resolver: zodResolver(step3Schema) })

  const toggleCrop = (crop: string) =>
    setSelectedCrops((prev) => prev.includes(crop) ? prev.filter((c) => c !== crop) : [...prev, crop])

  const onStep1 = (data: Step1) => { setStep1Data(data); setStep(1) }
  const onStep2 = (data: Step2) => { setStep2Data(data); setStep(2) }

  const onStep3 = async (_data: Step3) => {
    setLoading(true)
    await new Promise((r) => setTimeout(r, 1200))
    const farmerId = `CSA-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`
    login(
      {
        id: crypto.randomUUID(),
        name: step1Data!.name,
        email: step1Data!.email,
        role: 'farmer',
        farmerId,
      },
      'demo-jwt-token'
    )
    toast.success(`Welcome, ${step1Data!.name.split(' ')[0]}! Your Farmer ID is ${farmerId}`)
    navigate('/dashboard')
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex bg-[#F4F8F6]">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-2/5 bg-[#06192C] flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-[#40BBB9]/10" />
        <div className="absolute -bottom-32 -left-20 w-80 h-80 rounded-full bg-[#98CF59]/10" />

        <div className="flex items-center gap-3 relative">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#40BBB9] to-[#22B3DB] flex items-center justify-center">
            <Leaf size={20} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-lg leading-tight">CarbonSmart</p>
            <p className="text-[#66C390] text-xs font-medium">Solutions Africa</p>
          </div>
        </div>

        <div className="relative">
          <h2 className="text-3xl font-bold text-white leading-snug mb-4">
            Join Africa's<br />
            <span className="text-[#98CF59]">Carbon Economy</span>
          </h2>
          <p className="text-white/50 text-sm leading-relaxed mb-8">
            Register your farm and start earning carbon credits while tracking soil health and adopting smart farming practices.
          </p>
          <div className="flex flex-col gap-3">
            {['Unique Farmer ID issued instantly', 'Carbon credit eligibility tracking', 'Free smart farming tools', 'GPS farm boundary mapping'].map((f) => (
              <div key={f} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-[#98CF59]/20 flex items-center justify-center shrink-0">
                  <Check size={11} className="text-[#98CF59]" />
                </div>
                <span className="text-white/70 text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="text-white/30 text-xs">
          Already enrolled?{' '}
          <Link to="/login" className="text-[#40BBB9] font-semibold hover:underline">
            Sign in here
          </Link>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-lg">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[#06192C]">Farmer Enrollment</h1>
            <p className="text-gray-400 text-sm mt-1">Step {step + 1} of {steps.length} — {steps[step]}</p>
          </div>

          {/* Step indicators */}
          <div className="flex items-center gap-2 mb-8">
            {steps.map((s, i) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all',
                    i < step ? 'bg-[#98CF59] text-white' :
                    i === step ? 'bg-[#40BBB9] text-white' :
                    'bg-gray-200 text-gray-400'
                  )}
                >
                  {i < step ? <Check size={14} /> : i + 1}
                </div>
                <span className={cn('text-xs font-medium hidden sm:block', i === step ? 'text-[#06192C]' : 'text-gray-400')}>
                  {s}
                </span>
                {i < steps.length - 1 && (
                  <div className={cn('flex-1 h-0.5 rounded', i < step ? 'bg-[#98CF59]' : 'bg-gray-200')} />
                )}
              </div>
            ))}
          </div>

          {/* Step 1 */}
          {step === 0 && (
            <form onSubmit={form1.handleSubmit(onStep1)} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Full Name" placeholder="John Mwangi" icon={<User size={15} />}
                  error={form1.formState.errors.name?.message} {...form1.register('name')} />
                <Input label="Phone Number" placeholder="+27 82 000 0000" icon={<Phone size={15} />}
                  error={form1.formState.errors.phone?.message} {...form1.register('phone')} />
              </div>
              <Input label="Email Address" type="email" placeholder="john@example.com" icon={<Mail size={15} />}
                error={form1.formState.errors.email?.message} {...form1.register('email')} />
              <Input label="National ID / Passport" placeholder="8001010000000" icon={<User size={15} />}
                error={form1.formState.errors.nationalId?.message} {...form1.register('nationalId')} />
              <Button type="submit" className="w-full mt-2">
                Continue <ChevronRight size={16} />
              </Button>
            </form>
          )}

          {/* Step 2 */}
          {step === 1 && (
            <form onSubmit={form2.handleSubmit(onStep2)} className="flex flex-col gap-4">
              <Input label="Farm Name" placeholder="Green Valley Farm" icon={<Leaf size={15} />}
                error={form2.formState.errors.farmName?.message} {...form2.register('farmName')} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#06192C]/70 uppercase tracking-wide">Province</label>
                  <select
                    className="bg-[#F4F8F6] border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-[#06192C] focus:outline-none focus:ring-2 focus:ring-[#40BBB9]/40 focus:border-[#40BBB9]"
                    {...form2.register('province')}
                  >
                    <option value="">Select province</option>
                    {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                  {form2.formState.errors.province && <span className="text-xs text-red-500">{form2.formState.errors.province.message}</span>}
                </div>
                <Input label="District" placeholder="Bojanala" icon={<MapPin size={15} />}
                  error={form2.formState.errors.district?.message} {...form2.register('district')} />
              </div>
              <Input label="Farm Size (hectares)" type="number" placeholder="25" step="0.1"
                error={form2.formState.errors.farmSize?.message} {...form2.register('farmSize')} />

              <div>
                <label className="text-xs font-semibold text-[#06192C]/70 uppercase tracking-wide block mb-2">
                  Crop Types (select all that apply)
                </label>
                <div className="flex flex-wrap gap-2">
                  {CROP_TYPES.map((c) => (
                    <button
                      key={c} type="button" onClick={() => toggleCrop(c)}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-xs font-semibold border transition-all',
                        selectedCrops.includes(c)
                          ? 'bg-[#40BBB9] text-white border-[#40BBB9]'
                          : 'bg-white text-gray-500 border-gray-200 hover:border-[#40BBB9]'
                      )}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 mt-2">
                <Button type="button" variant="outline" onClick={() => setStep(0)} className="flex-1">
                  <ChevronLeft size={16} /> Back
                </Button>
                <Button type="submit" className="flex-1">
                  Continue <ChevronRight size={16} />
                </Button>
              </div>
            </form>
          )}

          {/* Step 3 */}
          {step === 2 && (
            <form onSubmit={form3.handleSubmit(onStep3)} className="flex flex-col gap-4">
              <div className="bg-[#98CF59]/10 border border-[#98CF59]/30 rounded-2xl p-4 mb-2">
                <p className="text-xs font-bold text-[#06192C] mb-1">Enrollment Summary</p>
                <div className="text-xs text-gray-500 flex flex-col gap-0.5">
                  <span><strong>Name:</strong> {step1Data?.name}</span>
                  <span><strong>Farm:</strong> {step2Data?.farmName} · {step2Data?.farmSize} ha</span>
                  <span><strong>Location:</strong> {step2Data?.district}, {step2Data?.province}</span>
                  {selectedCrops.length > 0 && <span><strong>Crops:</strong> {selectedCrops.join(', ')}</span>}
                </div>
              </div>
              <Input label="Create Password" type="password" placeholder="Minimum 8 characters" icon={<Lock size={15} />}
                error={form3.formState.errors.password?.message} {...form3.register('password')} />
              <Input label="Confirm Password" type="password" placeholder="Repeat password" icon={<Lock size={15} />}
                error={form3.formState.errors.confirmPassword?.message} {...form3.register('confirmPassword')} />
              <div className="flex gap-3 mt-2">
                <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">
                  <ChevronLeft size={16} /> Back
                </Button>
                <Button type="submit" loading={loading} className="flex-1">
                  Complete Enrollment
                </Button>
              </div>
            </form>
          )}

          <p className="text-center text-sm text-gray-400 mt-6">
            Already enrolled?{' '}
            <Link to="/login" className="text-[#40BBB9] font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
