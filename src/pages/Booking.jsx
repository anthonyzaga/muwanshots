import { useState, useMemo } from 'react';
import Container from '../components/ui/Container';
import { PageHeader, Card } from '../components/ui/Card';
import { Field, Input, Textarea, Select } from '../components/ui/Form';
import content from '../content/content.json';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const eventTypes = [
  'Wedding',
  'Kukyala / Introduction',
  'Graduation',
  'Birthday / Celebration',
  'Corporate / Event',
  'Indoor / Studio Portrait',
  'Outdoor / Lifestyle',
  'Baby / Family / Maternity',
  'Other',
];

function buildMessage(data) {
  const lines = [
    'Hi Muwan Shots,',
    '',
    "I'd like to enquire about covering my event.",
    '',
    `Name: ${data.name || '-'}`,
    `Phone: ${data.phone || '-'}`,
    `Event: ${data.eventType || '-'}`,
    `Date: ${data.date || 'To be confirmed'}`,
    `Location: ${data.location || '-'}`,
    `Service: ${data.service || '-'}`,
    data.guests ? `Guests: ${data.guests}` : null,
    '',
    data.details ? `Additional details:\n${data.details}` : null,
    '',
    'Thank you.',
  ].filter(Boolean);
  return lines.join('\n');
}

export default function Booking() {
  useDocumentTitle('Booking - Muwan Shots', 'Enquire to book Muwan Shots for your wedding, kukyala, graduation or event - Masaka & Kampala.');
  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    name: '', phone: '', eventType: '', date: '', location: '', service: 'Photography', guests: '', details: '',
  });
  const [errors, setErrors] = useState({});

  const message = useMemo(() => buildMessage(data), [data]);
  const waLink = useMemo(() => `https://wa.me/${content.contact.phone.replace(/[^0-9]/g,'')}?text=${encodeURIComponent(message)}`, [message]);

  function validate(currentStep = step) {
    const e = {};
    if (currentStep >= 1) {
      if (!data.eventType) e.eventType = 'Select event type';
      if (!data.date) e.date = 'Enter date (or To be confirmed)';
      if (!data.location.trim()) e.location = 'Enter location';
    }
    if (currentStep >= 2) {
      if (!data.name.trim()) e.name = 'Enter your name';
      if (!data.phone.trim()) e.phone = 'Enter phone number';
      else if (!/^\+?[0-9 ]{9,15}$/.test(data.phone.replace(/ /g,''))) e.phone = 'Enter valid phone';
    }
    return e;
  }

  function next() {
    const e = validate(step);
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setStep(s => Math.min(3, s+1));
  }

  return (
    <>
      <Container>
        <PageHeader eyebrow="Booking" title="Let’s plan your date." description="This form builds a clear WhatsApp enquiry - no account, no spam. You review before sending." />
        {/* stepper */}
        <div className="mt-6 flex items-center gap-2 text-xs">
          {[
            { n:1, t:'Your Event' },
            { n:2, t:'Your Details' },
            { n:3, t:'Review & Send' },
          ].map(s => (
            <div key={s.n} className="flex items-center gap-2">
              <span className={`w-7 h-7 rounded-full inline-flex items-center justify-center text-xs font-semibold border ${step>=s.n ? 'bg-[var(--text-primary)] text-[var(--bg)] border-[var(--text-primary)]' : 'bg-[var(--surface)] text-[var(--text-muted)] border-[var(--border)]'}`}>{s.n}</span>
              <span className={`${step===s.n ? 'text-[var(--text-primary)] font-medium' : 'text-[var(--text-muted)]'} hidden sm:inline`}>{String(s.n).padStart(2,'0')} - {s.t}</span>
              {s.n<3 && <span className="w-8 sm:w-12 h-px bg-[var(--border)] mx-1 sm:mx-2" />}
            </div>
          ))}
        </div>
      </Container>

      <Container className="mt-8 pb-12">
        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3">
            <Card className="p-6 sm:p-7">
              {step===1 && (
                <div className="space-y-5">
                  <p className="text-xs tracking-[0.18em] uppercase font-semibold text-[var(--accent)]">01 - Your Event</p>
                  <Field label="Event type" id="eventType" error={errors.eventType} required>
                    <Select id="eventType" value={data.eventType} onChange={e=>setData({...data, eventType:e.target.value})} error={errors.eventType}>
                      <option value="">Select event type</option>
                      {eventTypes.map(o=> <option key={o} value={o}>{o}</option>)}
                    </Select>
                  </Field>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Event date" id="date" error={errors.date} hint="Day/month/year or 'To be confirmed'">
                      <Input id="date" type="date" value={data.date} onChange={e=>setData({...data, date:e.target.value})} error={errors.date} />
                    </Field>
                    <Field label="Location / Venue" id="location" error={errors.location} required>
                      <Input id="location" placeholder="e.g., Masaka, hotel name" value={data.location} onChange={e=>setData({...data, location:e.target.value})} error={errors.location} />
                    </Field>
                  </div>
                  <Field label="Service needed" id="service">
                    <Select id="service" value={data.service} onChange={e=>setData({...data, service:e.target.value})}>
                      <option>Photography</option>
                      <option>Videography</option>
                      <option>Photography + Videography</option>
                    </Select>
                  </Field>
                  <Field label="Guests (optional)" id="guests" hint="Approximate headcount helps planning">
                    <Input id="guests" placeholder="e.g., 120" value={data.guests} onChange={e=>setData({...data, guests:e.target.value})} />
                  </Field>
                </div>
              )}
              {step===2 && (
                <div className="space-y-5">
                  <p className="text-xs tracking-[0.18em] uppercase font-semibold text-[var(--accent)]">02 - Your Details</p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Your name" id="name" error={errors.name} required>
                      <Input id="name" placeholder="Full name" value={data.name} onChange={e=>setData({...data, name:e.target.value})} error={errors.name} />
                    </Field>
                    <Field label="Phone (WhatsApp)" id="phone" error={errors.phone} required>
                      <Input id="phone" placeholder="+256 ..." value={data.phone} onChange={e=>setData({...data, phone:e.target.value})} error={errors.phone} />
                    </Field>
                  </div>
                  <Field label="Additional details" id="details" hint="Timeline, must-have shots, venue notes - anything helpful">
                    <Textarea id="details" placeholder="Tell us a bit about your vision..." value={data.details} onChange={e=>setData({...data, details:e.target.value})} rows={5} />
                  </Field>
                </div>
              )}
              {step===3 && (
                <div className="space-y-5">
                  <p className="text-xs tracking-[0.18em] uppercase font-semibold text-[var(--accent)]">03 - Review & Send</p>
                  <div className="rounded-xl bg-[var(--bg-soft)] border border-[var(--border)] p-4">
                    <p className="text-xs tracking-wide uppercase text-[var(--text-muted)] font-medium mb-2">WhatsApp message preview</p>
                    <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans text-[var(--text-primary)]">{message}</pre>
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">You’ll be redirected to WhatsApp to send this message. Nothing is stored on a server.</p>
                </div>
              )}

              <div className="mt-8 flex gap-3">
                {step>1 && <button onClick={()=>setStep(s=>s-1)} className="h-11 px-6 rounded-full border border-[var(--border)] bg-[var(--surface)] text-sm font-medium">Back</button>}
                {step<3 ? (
                  <button onClick={next} className="ml-auto h-11 px-7 rounded-full bg-[var(--text-primary)] text-[var(--bg)] text-sm font-semibold">Continue</button>
                ) : (
                  <a href={waLink} target="_blank" rel="noopener noreferrer" className="ml-auto inline-flex items-center justify-center h-11 px-7 rounded-full bg-[#25D366] text-white text-sm font-semibold">Continue to WhatsApp</a>
                )}
              </div>
            </Card>
            <p className="mt-4 text-xs text-[var(--text-muted)] text-center">Prefer to chat directly? <a href={content.contact.whatsapp} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">Open WhatsApp</a> or call <a href={`tel:${content.contact.phone}`} className="underline underline-offset-4">{content.contact.phone}</a></p>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <Card className="p-6">
              <p className="font-medium">What happens next?</p>
              <ol className="mt-3 space-y-2 text-sm text-[var(--text-muted)] leading-relaxed list-decimal list-inside">
                <li>You send the WhatsApp enquiry.</li>
                <li>We reply with availability and clear next steps.</li>
                <li>We confirm coverage and deliver a curated gallery.</li>
              </ol>
              <div className="mt-4 rounded-xl bg-[var(--bg-soft)] border border-[var(--border)] p-4 text-sm">
                <p className="font-medium">Contact</p>
                <p className="text-[var(--text-muted)] mt-1">{content.contact.phone} • {content.contact.email}</p>
                <p className="text-[var(--text-muted)]">{content.contact.location}</p>
              </div>
            </Card>
            <Card className="p-6 bg-[var(--accent)]/10 border-[var(--accent)]/20">
              <p className="text-sm font-medium">No hidden pricing.</p>
              <p className="text-sm text-[var(--text-muted)] mt-1 leading-relaxed">Quotes depend on hours, location and deliverables. Share your date for an accurate estimate.</p>
            </Card>
          </div>
        </div>
      </Container>
    </>
  );
}
