import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft, Leaf, CheckCircle } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) { toast.error('Enter your email address'); return }
    setLoading(true)
    await new Promise((r) => setTimeout(r, 1000))
    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F8F6] p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-10">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#40BBB9] to-[#22B3DB] flex items-center justify-center">
            <Leaf size={18} className="text-white" />
          </div>
          <div>
            <p className="text-[#06192C] font-bold text-sm">CarbonSmart Solutions Africa</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {!sent ? (
            <>
              <div className="mb-6">
                <h1 className="text-xl font-bold text-[#06192C]">Reset your password</h1>
                <p className="text-sm text-gray-400 mt-1">
                  Enter your email and we'll send you a reset link.
                </p>
              </div>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="you@carbonsmart.co.za"
                  icon={<Mail size={15} />}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Button type="submit" loading={loading} className="w-full py-3">
                  Send Reset Link
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-[#98CF59]/15 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={28} className="text-[#98CF59]" />
              </div>
              <h2 className="text-lg font-bold text-[#06192C] mb-2">Check your email</h2>
              <p className="text-sm text-gray-400 mb-1">We sent a password reset link to</p>
              <p className="text-sm font-semibold text-[#40BBB9]">{email}</p>
              <p className="text-xs text-gray-400 mt-3">
                Didn't receive it? Check your spam folder or{' '}
                <button onClick={() => setSent(false)} className="text-[#40BBB9] font-semibold hover:underline">
                  try again
                </button>
              </p>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-gray-100 text-center">
            <Link to="/login" className="flex items-center justify-center gap-1.5 text-sm text-gray-400 hover:text-[#06192C] font-semibold transition-colors">
              <ArrowLeft size={14} /> Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
