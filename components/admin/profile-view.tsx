import { Camera, Check } from 'lucide-react'
import { Card, Field, Input, Textarea, Btn } from '@/components/admin/ui'

interface Profile {
  id: string; name: string; tagline: string; kicker: string; intro: string
  bio: string[]; stack: string; manifesto: string; contactHeadline: string; contactIntro: string; profileImage: string | null
}

export function ProfileView({ profile, setProfile, onSave, onUpload, saving }: {
  profile: Profile
  setProfile: (p: Profile) => void
  onSave: () => void
  onUpload: (file: File) => void
  saving: boolean
}) {
  const up = (key: keyof Profile, val: unknown) => setProfile({ ...profile, [key]: val })

  return (
    <div className="max-w-3xl flex flex-col gap-6">
      {/* Identity */}
      <Card title="Identity" desc="How you appear in the hero and about sections">
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-5">
            <div className="relative w-24 h-24 rounded-full overflow-hidden shrink-0" style={{ border: '1px solid var(--line)', background: 'var(--background)' }}>
              {profile.profileImage
                ? <img src={profile.profileImage} alt="Profile" className="w-full h-full object-cover" />
                : <div className="w-full h-full grid place-items-center text-2xl font-black" style={{ color: 'var(--green)' }}>{profile.name.charAt(0)}</div>}
              <label className="absolute inset-0 grid place-items-center cursor-pointer transition-colors" style={{ background: 'rgba(0,0,0,.55)', color: '#fff' }}>
                <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(f) }} />
                <Camera size={18} />
              </label>
            </div>
            <div>
              <p className="text-sm font-semibold">Profile photo</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>Hover the photo to upload a new image.</p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            <Field label="Name"><Input value={profile.name} onChange={e => up('name', e.target.value)} /></Field>
            <Field label="Tagline"><Input value={profile.tagline} onChange={e => up('tagline', e.target.value)} /></Field>
            <Field label="Kicker"><Input value={profile.kicker} onChange={e => up('kicker', e.target.value)} /></Field>
            <Field label="Stack"><Input value={profile.stack} onChange={e => up('stack', e.target.value)} /></Field>
          </div>
          <Field label="Intro"><Textarea rows={3} value={profile.intro} onChange={e => up('intro', e.target.value)} /></Field>
        </div>
      </Card>

      {/* About */}
      <Card title="About" desc="The paragraphs shown in your about section — one per line">
        <Field label="Bio paragraphs">
          <Textarea rows={5} value={profile.bio.join('\n')} onChange={e => up('bio', e.target.value.split('\n'))} />
        </Field>
      </Card>

      {/* Manifesto */}
      <Card title="Manifesto" desc="Your working philosophy quote">
        <Field label="Manifesto"><Input value={profile.manifesto} onChange={e => up('manifesto', e.target.value)} /></Field>
      </Card>

      {/* Contact */}
      <Card title="Contact" desc="Copy for the contact section">
        <div className="grid md:grid-cols-2 gap-5">
          <Field label="Headline"><Input value={profile.contactHeadline} onChange={e => up('contactHeadline', e.target.value)} /></Field>
          <div />
          <Field label="Intro (full width)" hint="Closes invite"><Textarea rows={3} value={profile.contactIntro} onChange={e => up('contactIntro', e.target.value)} /></Field>
        </div>
      </Card>

      <div className="flex justify-end">
        <Btn onClick={onSave} disabled={saving} className="px-6 py-3 text-base">
          <Check size={16} /> {saving ? 'Saving…' : 'Save profile'}
        </Btn>
      </div>
    </div>
  )
}
