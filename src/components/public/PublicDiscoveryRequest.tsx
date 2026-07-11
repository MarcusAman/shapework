import React, { useState } from 'react';
import { CheckCircle2, ChevronRight, HelpCircle, AlertCircle, ArrowLeft } from 'lucide-react';

interface PublicDiscoveryRequestProps {
  onNavigate: (path: string) => void;
}

export default function PublicDiscoveryRequest({ onNavigate }: PublicDiscoveryRequestProps) {
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    industry: '',
    teamSize: '',
    friction: '',
    nextStep: 'Workflow Discovery',
    message: ''
  });

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.company || !formData.email || !formData.industry || !formData.friction) {
      setStatus('error');
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    setStatus('loading');
    setErrorMsg('');

    try {
      const response = await fetch('/api/public/discovery-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to submit discovery request. Please try again.');
      }

      setStatus('success');
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setErrorMsg(err.message || 'An unexpected error occurred. Please try again.');
    }
  };

  if (status === 'success') {
    return (
      <div className="py-12 md:py-20 px-6 max-w-xl mx-auto text-left font-sans animate-fade-in">
        <div className="bg-surface border border-border-medium rounded-3xl p-8 md:p-12 shadow-soft space-y-6 text-center">
          <div className="w-16 h-16 bg-brand-soft rounded-full flex items-center justify-center mx-auto mb-4 text-brand-primary">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-text-primary tracking-tight">
            Discovery Request Received
          </h2>
          
          <p className="text-xs md:text-sm text-text-secondary leading-relaxed font-light">
            Thank you, <strong>{formData.name}</strong>. We have logged your request for <strong>{formData.company}</strong>. Our team will review your biggest operational friction points and reach out within 24 hours.
          </p>

          <div className="pt-4 border-t border-border-soft/60 space-y-3">
            <button
              onClick={() => onNavigate('/')}
              className="w-full py-3 bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Return Home</span>
            </button>
            <button
              onClick={() => onNavigate('/demo')}
              className="w-full py-3 bg-stone-50 hover:bg-stone-100 text-text-primary border border-border-soft text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Explore Demo Platform</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-10 md:py-16 px-6 max-w-2xl mx-auto text-left font-sans">
      <div className="space-y-6">
        {/* Back button */}
        <button
          onClick={() => onNavigate('/')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-text-primary cursor-pointer border-none bg-transparent p-0 focus:outline-none"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </button>

        <div className="space-y-2">
          <span className="text-[10px] uppercase font-bold tracking-widest text-brand-primary">
            Lead Capture
          </span>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-text-primary tracking-tight leading-tight">
            Request Workflow Discovery
          </h1>
          <p className="text-xs md:text-sm text-text-secondary font-light">
            We will trace your operational bottlenecks, deliver a ranked opportunity roadmap, and implement one quick win in one week for a flat $1,500 fee.
          </p>
        </div>

        {/* Lead Form */}
        <form onSubmit={handleSubmit} className="bg-surface border border-border-soft rounded-3xl p-6 md:p-8 shadow-soft space-y-5">
          {status === 'error' && (
            <div className="p-4 bg-risk-red-soft text-risk-red border border-risk-red/10 rounded-xl text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
              <p className="font-light">{errorMsg}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">
                Full Name <span className="text-risk-red">*</span>
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="Diane Ross"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-border-soft rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all font-sans"
              />
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">
                Email Address <span className="text-risk-red">*</span>
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="diane@brokerage.com"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-border-soft rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all font-sans"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Company */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">
                Company / Brokerage <span className="text-risk-red">*</span>
              </label>
              <input
                type="text"
                name="company"
                required
                value={formData.company}
                onChange={handleChange}
                placeholder="Apex Realty Services"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-border-soft rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all font-sans"
              />
            </div>

            {/* Phone */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">
                Phone Number <span className="text-text-tertiary">(Optional)</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="512-555-0192"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-border-soft rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all font-sans"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Industry */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">
                Industry <span className="text-risk-red">*</span>
              </label>
              <select
                name="industry"
                required
                value={formData.industry}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-border-soft rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all font-sans"
              >
                <option value="">Select industry...</option>
                <option value="Real Estate Brokerage">Real Estate Brokerage</option>
                <option value="Professional Services">Professional Services</option>
                <option value="Marketing / Agency">Marketing / Agency</option>
                <option value="Healthcare Practice">Healthcare Practice</option>
                <option value="Other Operations Heavy">Other Operations Heavy</option>
              </select>
            </div>

            {/* Team Size */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">
                Team Size <span className="text-text-tertiary">(Optional)</span>
              </label>
              <select
                name="teamSize"
                value={formData.teamSize}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-border-soft rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all font-sans"
              >
                <option value="">Select size...</option>
                <option value="1-5 employees">1-5 employees</option>
                <option value="6-15 employees">6-15 employees</option>
                <option value="16-50 employees">16-50 employees</option>
                <option value="51-200 employees">51-200 employees</option>
                <option value="200+ employees">200+ employees</option>
              </select>
            </div>
          </div>

          {/* Biggest Operational Friction */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">
              Biggest Operational Friction <span className="text-risk-red">*</span>
            </label>
            <textarea
              name="friction"
              required
              rows={3}
              value={formData.friction}
              onChange={handleChange}
              placeholder="e.g. Transactions aren't logged on time, owners spend hours forwarding emails to coordinators, compliance reviews are chased in a rush near closing week..."
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-border-soft rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all font-sans leading-relaxed resize-none"
            />
          </div>

          {/* Preferred Next Step */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">
              Preferred Next Step <span className="text-risk-red">*</span>
            </label>
            <select
              name="nextStep"
              required
              value={formData.nextStep}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-border-soft rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all font-sans"
            >
              <option value="Workflow Discovery">Workflow Discovery ($1,500 fixed diagnostic)</option>
              <option value="Intro Call">Schedule 15-minute Intro Call</option>
              <option value="Brokerage Demo">Request Private Brokerage Demo</option>
              <option value="Not sure yet">Not sure yet (let's discuss)</option>
            </select>
          </div>

          {/* Message */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">
              Additional Details <span className="text-text-tertiary">(Optional)</span>
            </label>
            <textarea
              name="message"
              rows={2}
              value={formData.message}
              onChange={handleChange}
              placeholder="Provide any additional context or timeline constraints..."
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-border-soft rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all font-sans leading-relaxed resize-none"
            />
          </div>

          <div className="text-[10px] text-text-tertiary font-light text-center mb-3">
            By submitting this form, you agree to our{' '}
            <button
              type="button"
              onClick={() => onNavigate('/terms')}
              className="font-bold underline text-text-secondary hover:text-brand-primary bg-transparent border-none p-0 cursor-pointer focus:outline-none inline"
            >
              Terms
            </button>{' '}
            and acknowledge our{' '}
            <button
              type="button"
              onClick={() => onNavigate('/privacy')}
              className="font-bold underline text-text-secondary hover:text-brand-primary bg-transparent border-none p-0 cursor-pointer focus:outline-none inline"
            >
              Privacy Policy
            </button>.
          </div>

          <div className="pt-4 border-t border-border-soft/60">
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full py-3 bg-brand-primary hover:bg-brand-primary-hover disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>{status === 'loading' ? 'Submitting...' : 'Request Discovery Session'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>

        <div className="mt-6 p-4 bg-brand-soft/30 border border-brand-primary/10 rounded-2xl flex items-start gap-2.5 text-[11px] text-text-secondary leading-normal">
          <CheckCircle2 className="w-4.5 h-4.5 text-brand-primary shrink-0 mt-0.5" />
          <p className="font-light">
            <strong>Privacy Guarantee:</strong> We protect your business structure and operational details. All submissions are processed over secure links, logged privately, and never shared with third parties.
          </p>
        </div>
      </div>
    </div>
  );
}
