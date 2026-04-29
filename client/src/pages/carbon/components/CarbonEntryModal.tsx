import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Leaf, FlaskConical, Droplets, Wind, FileText } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { cn } from '@/utils/cn'
import type { CarbonRecord, Farmer } from '@/types'

const schema = z.object({
  farmerId: z.string().min(1, 'Select a farmer'),
  date: z.string().min(1, 'Date required'),
  carbonLevel: z.coerce.number().min(0.1, 'Required').max(50),
  soilPH: z.coerce.number().min(3).max(10),
  organicMatter: z.coerce.number().min(0).max(100),
  moisture: z.coerce.number().min(0).max(100),
  inputMethod: z.enum(['manual', 'sensor']),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface Props {
  farmers: Farmer[]
  onClose: () => void
  onSave: (record: Omit<CarbonRecord, 'id'>) => void
}

const fields = [
  { name: 'carbonLevel' as const, label: 'Carbon Level (tCO₂/ha)', icon: <Leaf size={14} />, min: '0', max: '50', step: '0.01', placeholder: '3.50' },
  { name: 'soilPH' as const, label: 'Soil pH', icon: <FlaskConical size={14} />, min: '3', max: '10', step: '0.1', placeholder: '6.5' },
  { name: 'organicMatter' as const, label: 'Organic Matter (%)', icon: <Wind size={14} />, min: '0', max: '100', step: '0.1', placeholder: '2.8' },
  { name: 'moisture' as const, label: 'Soil Moisture (%)', icon: <Droplets size={14} />, min: '0', max: '100', step: '0.1', placeholder: '35.0' },
]

export function CarbonEntryModal({ farmers, onClose, onSave }: Props) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      inputMethod: 'manual',
      soilPH: 6.5,
      organicMatter: 2.5,
      moisture: 35,
    },
  })

  const method = watch('inputMethod')

  const onSubmit = (data: FormData) => {
    onSave({ ...data, inputMethod: data.inputMethod as 'manual' | 'sensor' })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#06192C]/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#40BBB9]/12 rounded-xl flex items-center justify-center">
              <Leaf size={16} className="text-[#40BBB9]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#06192C]">Add Carbon Reading</h2>
              <p className="text-xs text-gray-400">Soil health and carbon data entry</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-[#06192C] transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 flex flex-col gap-4">
          {/* Farmer + Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#06192C]/70 uppercase tracking-wide">Farmer</label>
              <select {...register('farmerId')}
                className="bg-[#F4F8F6] border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-[#06192C] focus:outline-none focus:ring-2 focus:ring-[#40BBB9]/40">
                <option value="">Select farmer...</option>
                {farmers.map((f) => (
                  <option key={f.id} value={f.id}>{f.name} — {f.farmerId}</option>
                ))}
              </select>
              {errors.farmerId && <span className="text-xs text-red-500">{errors.farmerId.message}</span>}
            </div>
            <Input label="Reading Date" type="date" error={errors.date?.message} {...register('date')} />
          </div>

          {/* Method toggle */}
          <div>
            <label className="text-xs font-semibold text-[#06192C]/70 uppercase tracking-wide block mb-2">Input Method</label>
            <div className="flex gap-3">
              {(['manual', 'sensor'] as const).map((m) => (
                <label key={m} className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border cursor-pointer text-sm font-semibold transition-all',
                  method === m ? 'bg-[#40BBB9] text-white border-[#40BBB9]' : 'bg-[#F4F8F6] text-gray-500 border-gray-200 hover:border-[#40BBB9]'
                )}>
                  <input type="radio" value={m} {...register('inputMethod')} className="hidden" />
                  {m === 'manual' ? <FileText size={14} /> : <Leaf size={14} />}
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </label>
              ))}
            </div>
          </div>

          {/* Soil metrics */}
          <div>
            <p className="text-xs font-bold text-[#06192C]/50 uppercase tracking-widest mb-3">Soil Measurements</p>
            <div className="grid grid-cols-2 gap-4">
              {fields.map((f) => (
                <div key={f.name}>
                  <Input
                    label={f.label} type="number" step={f.step} min={f.min} max={f.max}
                    placeholder={f.placeholder} icon={f.icon}
                    error={errors[f.name]?.message}
                    {...register(f.name)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#06192C]/70 uppercase tracking-wide">Notes (optional)</label>
            <textarea
              {...register('notes')}
              rows={2}
              placeholder="Post-rainfall reading, seasonal variation notes..."
              className="bg-[#F4F8F6] border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-[#06192C] placeholder:text-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-[#40BBB9]/40 focus:border-[#40BBB9]"
            />
          </div>

          <div className="flex gap-3 pt-2 border-t border-gray-100">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" className="flex-1">Save Reading</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
