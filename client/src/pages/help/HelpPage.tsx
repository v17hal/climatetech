import { useState } from 'react'
import { HelpCircle, Search, ChevronDown, ChevronUp, Mail, Phone, ExternalLink, BookOpen, Video, MessageSquare, Leaf } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { cn } from '@/utils/cn'
import toast from 'react-hot-toast'

const FAQS = [
  {
    category: 'Farmer Enrollment',
    items: [
      { q: 'How do I enroll a new farmer?', a: 'Go to Farmers → click "Enroll Farmer". Complete the 3 steps: personal info, farm details, and account setup. A unique CSA Farmer ID is generated automatically on completion.' },
      { q: 'Can a farmer enroll themselves?', a: 'Yes. Farmers can self-enroll via the Register page at /register. They receive their Farmer ID on completion and can log in immediately.' },
      { q: 'How is the Farmer ID structured?', a: 'IDs follow the format CSA-YYYY-NNNNN, where YYYY is the enrollment year and NNNNN is a zero-padded sequential number (e.g. CSA-2024-00042).' },
    ],
  },
  {
    category: 'Carbon Tracking',
    items: [
      { q: 'How do I add a carbon reading?', a: 'Go to Carbon Tracking → "Add Reading". Select the farmer, enter the date, choose manual or sensor input, then fill in carbon level, soil pH, organic matter, and moisture values.' },
      { q: 'What is the difference between manual and sensor input?', a: 'Manual input is entered by a field officer. Sensor input is captured automatically via connected IoT soil sensors. Both are tracked and tagged accordingly in reports.' },
      { q: 'How is carbon compliance calculated?', a: 'A farm is carbon-credit eligible when its carbon level exceeds 3.0 tCO₂/ha consistently across 3+ consecutive readings, and the farmer holds active status.' },
    ],
  },
  {
    category: 'Reports & Exports',
    items: [
      { q: 'How do I export a report as PDF?', a: 'Go to Analytics & Reports → Report Builder tab. Select a report template, apply your filters, then click "Export as PDF". The report downloads with branded CarbonSmart formatting.' },
      { q: 'Which report templates are available?', a: 'Four templates: Carbon Metrics Report, Financial Summary Report, Farm Performance Report, and Compliance & MRV Report. Each has pre-defined columns and can be filtered by province, status, and date range.' },
      { q: 'Can I schedule automated reports?', a: 'Scheduled reports are on the roadmap. Currently reports are generated on-demand. Subscribe to the daily email digest in Settings → Notifications for a daily summary.' },
    ],
  },
  {
    category: 'Mapping & GPS',
    items: [
      { q: 'How do I draw a farm boundary on the map?', a: 'Go to Farm Map → click "Draw Boundary". Click on the map to place polygon points. After 3 or more points the boundary is saved. You can switch between Street, Satellite, and Terrain layers.' },
      { q: 'Why do some farms not appear on the map?', a: 'Farms only appear on the map if GPS coordinates have been recorded. Coordinates can be set on the Farmer Detail page. Farms without coordinates are listed in the sidebar but not pinned on the map.' },
    ],
  },
  {
    category: 'LSM Scoring',
    items: [
      { q: 'What is LSM and why does it matter?', a: 'LSM (Lifestyle Metrics) categorises farms from LSM1 (subsistence) to LSM5 (commercial) based on income, land size, water access, equipment, market access, and financial services. It determines which support services and carbon credit pathways each farmer qualifies for.' },
      { q: 'How do I score a farm?', a: 'Go to LSM Profiles → "Score a Farm". Answer the 6 weighted questions. The system automatically calculates the total score and assigns an LSM category with recommended services.' },
    ],
  },
]

const GUIDES = [
  { title: 'Getting Started Guide', desc: 'Platform overview, first login, and onboarding your first farmer', icon: <BookOpen size={18} />, color: '#40BBB9', tag: 'Beginner' },
  { title: 'Carbon Data Collection', desc: 'How to collect and submit soil carbon readings in the field', icon: <Leaf size={18} />, color: '#98CF59', tag: 'Field' },
  { title: 'LSM Scoring Tutorial', desc: 'Step-by-step guide to scoring farms and applying targeted services', icon: <Video size={18} />, color: '#336599', tag: 'Video' },
  { title: 'Report Builder Guide', desc: 'Creating, filtering, and exporting carbon and financial reports', icon: <BookOpen size={18} />, color: '#66C390', tag: 'Reports' },
  { title: 'Map & GPS Setup', desc: 'Drawing farm boundaries and setting GPS coordinates per farm', icon: <BookOpen size={18} />, color: '#22B3DB', tag: 'Maps' },
  { title: 'Admin Onboarding Checklist', desc: 'Everything an admin needs to do before going live with farmers', icon: <BookOpen size={18} />, color: '#336599', tag: 'Admin' },
]

export default function HelpPage() {
  const [search, setSearch] = useState('')
  const [openFAQ, setOpenFAQ] = useState<string | null>(null)
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [sending, setSending] = useState(false)

  const filteredFAQs = FAQS.map((cat) => ({
    ...cat,
    items: cat.items.filter(
      (item) => !search || item.q.toLowerCase().includes(search.toLowerCase()) || item.a.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter((cat) => cat.items.length > 0)

  const sendMessage = async () => {
    if (!contactForm.message || !contactForm.email) { toast.error('Please fill in email and message'); return }
    setSending(true)
    await new Promise((r) => setTimeout(r, 900))
    toast.success('Message sent! We\'ll respond within 24 hours.')
    setContactForm({ name: '', email: '', subject: '', message: '' })
    setSending(false)
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      {/* Drop a Seed banner */}
      <div className="bg-gradient-to-r from-[#06192C] to-[#0d2d4a] rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-[#40BBB9]/10" />
        <div className="absolute right-24 bottom-0 w-28 h-28 rounded-full bg-[#98CF59]/8" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 bg-[#98CF59]/20 text-[#98CF59] text-xs font-bold px-3 py-1.5 rounded-full mb-3">
            <Leaf size={12} /> Drop a Seed
          </div>
          <h2 className="text-white text-lg font-bold mb-1">Help & Support Centre</h2>
          <p className="text-white/50 text-sm">
            Everything you need to make the most of CarbonSmart Solutions Africa.
          </p>
        </div>
      </div>

      {/* Search */}
      <Input
        placeholder="Search FAQs, guides, and documentation..."
        icon={<Search size={15} />}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="text-base"
      />

      {/* Quick guides */}
      {!search && (
        <div>
          <p className="text-xs font-bold text-[#06192C]/50 uppercase tracking-widest mb-3">Documentation & Guides</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {GUIDES.map((g) => (
              <button key={g.title}
                onClick={() => toast.success(`Opening: ${g.title}`)}
                className="text-left bg-white border border-gray-100 rounded-2xl p-4 hover:shadow-md transition-all hover:border-gray-200 group">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: g.color + '20', color: g.color }}>
                    {g.icon}
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: g.color + '15', color: g.color }}>
                    {g.tag}
                  </span>
                </div>
                <p className="text-xs font-bold text-[#06192C] mb-1">{g.title}</p>
                <p className="text-[10px] text-gray-400 leading-relaxed">{g.desc}</p>
                <div className="flex items-center gap-1 mt-3 text-[10px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: g.color }}>
                  Read guide <ExternalLink size={10} />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* FAQs */}
      <div>
        <p className="text-xs font-bold text-[#06192C]/50 uppercase tracking-widest mb-3">
          {search ? `Search results for "${search}"` : 'Frequently Asked Questions'}
        </p>
        {filteredFAQs.length === 0 ? (
          <Card className="text-center py-10">
            <HelpCircle size={28} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm font-medium text-gray-400">No results found for "{search}"</p>
            <p className="text-xs text-gray-400 mt-1">Try different keywords or contact support below</p>
          </Card>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredFAQs.map((cat) => (
              <Card key={cat.category} padding="none">
                <div className="px-5 py-3.5 border-b border-gray-100">
                  <p className="text-xs font-bold text-[#06192C]">{cat.category}</p>
                </div>
                {cat.items.map((item) => {
                  const key = cat.category + item.q
                  const open = openFAQ === key
                  return (
                    <div key={item.q} className="border-b border-gray-50 last:border-0">
                      <button
                        onClick={() => setOpenFAQ(open ? null : key)}
                        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-[#F4F8F6] transition-colors">
                        <span className="text-sm font-semibold text-[#06192C] pr-4">{item.q}</span>
                        {open ? <ChevronUp size={16} className="text-[#40BBB9] shrink-0" /> : <ChevronDown size={16} className="text-gray-400 shrink-0" />}
                      </button>
                      {open && (
                        <div className="px-5 pb-4">
                          <p className="text-sm text-gray-500 leading-relaxed">{item.a}</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Contact */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Contact form */}
        <Card>
          <CardHeader><CardTitle>Contact Support</CardTitle><MessageSquare size={16} className="text-gray-400" /></CardHeader>
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <Input label="Your Name" placeholder="John Mwangi" value={contactForm.name}
                onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })} />
              <Input label="Email" type="email" placeholder="you@example.com" value={contactForm.email}
                onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} />
            </div>
            <Input label="Subject" placeholder="Issue with carbon reading upload" value={contactForm.subject}
              onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })} />
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#06192C]/70 uppercase tracking-wide">Message</label>
              <textarea rows={4} placeholder="Describe your issue or question in detail..."
                value={contactForm.message}
                onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                className="bg-[#F4F8F6] border border-gray-200 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#40BBB9]/40" />
            </div>
            <Button onClick={sendMessage} loading={sending} className="w-full">
              <Mail size={14} /> Send Message
            </Button>
          </div>
        </Card>

        {/* Direct contact */}
        <div className="flex flex-col gap-3">
          <Card>
            <CardTitle className="mb-3">Direct Contact</CardTitle>
            <div className="flex flex-col gap-3">
              {[
                { icon: <Mail size={16} />, label: 'Email Support', value: 'info@carbonsmartsolutionsafrica.co.za', color: '#40BBB9' },
                { icon: <Phone size={16} />, label: 'Phone', value: '+27 (11) 568 8017', color: '#98CF59' },
                { icon: <MessageSquare size={16} />, label: 'WhatsApp', value: '+27 (11) 568 8017', color: '#66C390' },
              ].map((c) => (
                <div key={c.label} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-[#F4F8F6] transition-colors">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: c.color + '20', color: c.color }}>
                    {c.icon}
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-semibold">{c.label}</p>
                    <p className="text-xs font-semibold text-[#06192C]">{c.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardTitle className="mb-1">Office Address</CardTitle>
            <p className="text-xs text-gray-400 mb-3">Visit us during business hours (Mon–Fri, 08:00–17:00)</p>
            <p className="text-sm font-semibold text-[#06192C]">Design Quarters</p>
            <p className="text-xs text-gray-500">Leslie Road, Fourways</p>
            <p className="text-xs text-gray-500">2191, Gauteng, South Africa</p>
            <button onClick={() => toast.success('Opening map...')}
              className="flex items-center gap-1.5 text-xs font-semibold text-[#40BBB9] mt-3 hover:underline">
              View on map <ExternalLink size={11} />
            </button>
          </Card>

          <Card className="bg-[#06192C] border-0">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-xl bg-[#40BBB9]/20 flex items-center justify-center">
                <Leaf size={14} className="text-[#40BBB9]" />
              </div>
              <p className="text-white font-bold text-sm">Support Hours</p>
            </div>
            <p className="text-white/50 text-xs leading-relaxed">
              Standard support: Mon–Fri 08:00–17:00 SAST<br />
              Emergency alerts: 24/7 via WhatsApp<br />
              Response time: Within 4 business hours
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}
