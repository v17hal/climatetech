import { Construction } from 'lucide-react'
import { Card } from '@/components/ui/Card'

interface PlaceholderPageProps {
  title: string
  description?: string
}

export default function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="text-center max-w-md w-full">
        <div className="w-16 h-16 bg-[#40BBB9]/12 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Construction size={28} className="text-[#40BBB9]" />
        </div>
        <h2 className="text-lg font-bold text-[#06192C] mb-2">{title}</h2>
        <p className="text-sm text-gray-400">
          {description ?? 'This module is coming in the next session. All features will be fully implemented.'}
        </p>
        <div className="mt-4 inline-block bg-[#98CF59]/12 text-[#4a7a1e] text-xs font-semibold px-3 py-1.5 rounded-full">
          In Development
        </div>
      </Card>
    </div>
  )
}
