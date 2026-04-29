import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, User, Mail, Phone, MapPin, Leaf } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { cn } from '@/utils/cn'
import { provinceOptions, cropOptions, practiceOptions } from '@/data/mockFarmers'
import type { Farmer } from '@/types'

const schema = z.object({
  name: z.string().min(2, 'Required'),
  email: z.string().email('Valid email required'),
  phone: z.string().min(10, 'Required'),
  nationalId: z.string().min(6, 'Required'),
  farmName: z.string().min(2, 'Required'),
  province: z.string().min(2, 'Required'),
  district: z.string().min(2, 'Required'),
  farmSize: z.coerce.number().positive('Must be > 0'),
  farmSizeUnit: z.enum(['ha', 'acres']),
  status: z.enum(['active', 'pending', 'inactive']),
})

type FormData = z.infer<typeof schema>

interface Props {
  farmer: Farmer | null
  onClose: () => void
  onSave: (data: Partial<Farmer>) => void
}

export function FarmerFormModal({ farmer, onClose, onSave }: Props) {
  const isEdit = !!farmer
  const [selectedCrops, setSelectedCrops] = useState<string[]>(farmer?.cropTypes ?? [])
  const [selectedPractices, setSelectedPractices] = useState<string[]>(farmer?.farmingPractices ?? [])

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '', email: '', phone: '', nationalId: '',
      farmName: '', province: '', district: '',
      farmSize: 10, farmSizeUnit: 'ha', status: 'pending',
    },
  })

  useEffect(() => {
    if (farmer) {
      reset({
        name: farmer.name, email: farmer.email, phone: farmer.phone,
        nationalId: farmer.nationalId, farmName: farmer.farmName,
        province: farmer.province, district: farmer.district,
        farmSize: farmer.farmSize, farmSizeUnit: farmer.farmSizeUnit,
        status: farmer.status,
      })
      setSelectedCrops(farmer.cropTypes)
      setSelectedPractices(farmer.farmingPractices)
    }
  }, [farmer, reset])

  const toggleCrop = (c: string) => setSelectedCrops((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c])
  const togglePractice = (p: string) => setSelectedPractices((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p])

  const onSubmit = (data: FormData) => {
    onSave({ ...data, cropTypes: selectedCrops, farmingPractices: selectedPractices })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#06192C]/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <div>
            <h2 className="text-base font-bold text-[#06192C]">
              {isEdit ? 'Edit Farmer Profile' : 'Enroll New Farmer'}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {isEdit ? `Editing ${farmer.farmerId}` : 'All fields are required'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-[#06192C] transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 flex flex-col gap-5">
          {/* Personal */}
          <div>
            <p className="text-xs font-bold text-[#06192C]/50 uppercase tracking-widest mb-3">Personal Information</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Full Name" placeholder="John Mwangi" icon={<User size={14} />}
                error={errors.name?.message} {...register('name')} />
              <Input label="Phone" placeholder="+27 82 000 0000" icon={<Phone size={14} />}
                error={errors.phone?.message} {...register('phone')} />
              <Input label="Email" type="email" placeholder="john@example.com" icon={<Mail size={14} />}
                error={errors.email?.message} {...register('email')} />
              <Input label="National ID / Passport" placeholder="8001010000000" icon={<User size={14} />}
                error={errors.nationalId?.message} {...register('nationalId')} />
            </div>
          </div>

          {/* Farm */}
          <div>
            <p className="text-xs font-bold text-[#06192C]/50 uppercase tracking-widest mb-3">Farm Details</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Farm Name" placeholder="Green Valley Farm" icon={<Leaf size={14} />}
                error={errors.farmName?.message} {...register('farmName')} />
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input label="Farm Size" type="number" step="0.1" placeholder="25"
                    error={errors.farmSize?.message} {...register('farmSize')} />
                </div>
                <div className="w-24 flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#06192C]/70 uppercase tracking-wide">Unit</label>
                  <select {...register('farmSizeUnit')}
                    className="bg-[#F4F8F6] border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-[#06192C] focus:outline-none focus:ring-2 focus:ring-[#40BBB9]/40">
                    <option value="ha">ha</option>
                    <option value="acres">acres</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#06192C]/70 uppercase tracking-wide">Province</label>
                <select {...register('province')}
                  className="bg-[#F4F8F6] border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-[#06192C] focus:outline-none focus:ring-2 focus:ring-[#40BBB9]/40">
                  <option value="">Select province</option>
                  {provinceOptions.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
                {errors.province && <span className="text-xs text-red-500">{errors.province.message}</span>}
              </div>
              <Input label="District" placeholder="Bojanala" icon={<MapPin size={14} />}
                error={errors.district?.message} {...register('district')} />
            </div>
          </div>

          {/* Crops */}
          <div>
            <p className="text-xs font-bold text-[#06192C]/50 uppercase tracking-widest mb-3">Crop Types</p>
            <div className="flex flex-wrap gap-2">
              {cropOptions.map((c) => (
                <button key={c} type="button" onClick={() => toggleCrop(c)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-semibold border transition-all',
                    selectedCrops.includes(c)
                      ? 'bg-[#40BBB9] text-white border-[#40BBB9]'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-[#40BBB9]'
                  )}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Practices */}
          <div>
            <p className="text-xs font-bold text-[#06192C]/50 uppercase tracking-widest mb-3">Farming Practices</p>
            <div className="flex flex-wrap gap-2">
              {practiceOptions.map((p) => (
                <button key={p} type="button" onClick={() => togglePractice(p)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-semibold border transition-all',
                    selectedPractices.includes(p)
                      ? 'bg-[#98CF59] text-[#06192C] border-[#98CF59]'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-[#98CF59]'
                  )}>
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          <div>
            <p className="text-xs font-bold text-[#06192C]/50 uppercase tracking-widest mb-3">Status</p>
            <div className="flex gap-4">
              {(['active', 'pending', 'inactive'] as const).map((s) => (
                <label key={s} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" value={s} {...register('status')} className="accent-[#40BBB9]" />
                  <span className={cn('text-sm font-medium capitalize',
                    s === 'active' ? 'text-[#40BBB9]' : s === 'pending' ? 'text-orange-500' : 'text-gray-400'
                  )}>{s}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2 border-t border-gray-100">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" className="flex-1">{isEdit ? 'Save Changes' : 'Enroll Farmer'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
