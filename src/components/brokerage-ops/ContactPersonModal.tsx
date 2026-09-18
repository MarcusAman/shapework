import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  MessageSquare,
  Phone,
  Send,
  Sparkles,
  Check,
  Copy,
  User,
  Building,
  ShieldCheck,
  ExternalLink,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { useToast } from '../ui';

export interface ContactPersonTarget {
  name: string;
  firstName?: string;
  role?: string;
  office?: string;
  phone?: string;
  email?: string;
}

interface ContactPersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  person: ContactPersonTarget | null;
}

type ContactChannel = 'email' | 'sms';

interface MessageTemplate {
  id: string;
  title: string;
  description: string;
  emailSubject: string;
  emailBody: (firstName: string) => string;
  smsBody: (firstName: string) => string;
}

const TEMPLATES: MessageTemplate[] = [
  {
    id: 'quick_question',
    title: 'Quick Question',
    description: 'Brief inquiry regarding active workflow or listing',
    emailSubject: 'Quick question regarding listing / workflow',
    emailBody: (fn) =>
      `Hi ${fn},\n\nHope your week is going well! Do you have 5 minutes for a quick question regarding our upcoming listing workflow?\n\nLet me know when you're free to connect.\n\nBest regards,`,
    smsBody: (fn) =>
      `Hi ${fn}, quick question for you regarding our active listing workflow. Let me know when you have 2 minutes to talk!`
  },
  {
    id: 'deal_status',
    title: 'Deal / File Status',
    description: 'Touch base on contract milestones & deliverables',
    emailSubject: 'Update on transaction file & listing status',
    emailBody: (fn) =>
      `Hi ${fn},\n\nTouching base on the current status of our client file. All disclosures and marketing assets are currently progressing on track.\n\nPlease let me know if you need any additional documentation or support from the brokerage team.\n\nBest regards,`,
    smsBody: (fn) =>
      `Hi ${fn}, touching base with a quick update on our client file. Everything is progressing smoothly on schedule. Let me know if you need anything!`
  },
  {
    id: 'urgent_callback',
    title: 'Urgent Callback',
    description: 'Time-sensitive client or compliance item',
    emailSubject: 'Urgent: Time-sensitive transaction item requires attention',
    emailBody: (fn) =>
      `Hi ${fn},\n\nWe have a time-sensitive operational request requiring prompt attention regarding our active transaction.\n\nPlease give me a call or reply to this message as soon as you're able.\n\nThank you!`,
    smsBody: (fn) =>
      `Hi ${fn}, urgent time-sensitive item on our transaction. Please call or text me back as soon as you see this.`
  },
  {
    id: 'custom',
    title: 'Custom Note',
    description: 'Compose your own custom message',
    emailSubject: 'Nest Realty Brokerage Note',
    emailBody: (fn) => `Hi ${fn},\n\n`,
    smsBody: (fn) => `Hi ${fn}, `
  }
];

export const ContactPersonModal: React.FC<ContactPersonModalProps> = ({
  isOpen,
  onClose,
  person
}) => {
  const { toast } = useToast();
  const [channel, setChannel] = useState<ContactChannel>('email');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('quick_question');
  const [emailSubject, setEmailSubject] = useState<string>('');
  const [messageBody, setMessageBody] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isSent, setIsSent] = useState<boolean>(false);
  const [copiedText, setCopiedText] = useState<boolean>(false);

  const firstName = person?.firstName || person?.name?.split(' ')[0] || 'there';
  const personName = person?.name || 'Agent';
  const personPhone = person?.phone || '(910) 507-2047';
  const personEmail = person?.email || 'contact@nestrealty.com';
  const personRole = person?.role || 'Broker / Associate';
  const personOffice = person?.office || 'Mayfaire Office';

  // Apply template on selection or when person changes
  useEffect(() => {
    if (!person) return;
    const template = TEMPLATES.find(t => t.id === selectedTemplateId) || TEMPLATES[0];
    if (channel === 'email') {
      setEmailSubject(template.emailSubject);
      setMessageBody(template.emailBody(firstName));
    } else {
      setMessageBody(template.smsBody(firstName));
    }
    setIsSent(false);
  }, [selectedTemplateId, channel, person]);

  if (!isOpen || !person) return null;

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const template = TEMPLATES.find(t => t.id === templateId) || TEMPLATES[0];
    if (channel === 'email') {
      setEmailSubject(template.emailSubject);
      setMessageBody(template.emailBody(firstName));
    } else {
      setMessageBody(template.smsBody(firstName));
    }
  };

  const handleCopyMessage = () => {
    const fullText = channel === 'email' ? `Subject: ${emailSubject}\n\n${messageBody}` : messageBody;
    navigator.clipboard.writeText(fullText);
    setCopiedText(true);
    toast.success({
      title: 'Copied to Clipboard',
      description: 'Message content copied successfully.'
    });
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleSend = async () => {
    setIsSending(true);

    try {
      if (channel === 'sms') {
        const res = await fetch('/api/voice-agent/telephony/send-sms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            toNumber: personPhone,
            message: messageBody
          })
        });

        if (res.ok) {
          setIsSent(true);
          toast.success({
            title: `SMS Sent to ${personName}`,
            description: `Message delivered to ${personPhone}.`
          });
          setTimeout(() => {
            setIsSending(false);
            onClose();
          }, 1400);
          return;
        }
      }

      // Email dispatch / simulated send & mailto trigger
      const mailtoUrl = `mailto:${encodeURIComponent(personEmail)}?subject=${encodeURIComponent(
        emailSubject
      )}&body=${encodeURIComponent(messageBody)}`;

      // Try opening mailto client
      window.location.href = mailtoUrl;

      setIsSent(true);
      toast.success({
        title: `Email Prepared for ${personName}`,
        description: `Dispatched to ${personEmail} via email client.`
      });

      setTimeout(() => {
        setIsSending(false);
        onClose();
      }, 1400);
    } catch (err) {
      setIsSending(false);
      toast.error({
        title: 'Dispatch Failed',
        description: 'Unable to send message. Please copy text or try again.'
      });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 sm:p-6 text-left animate-fadeIn"
      data-testid="contact-person-modal"
    >
      {/* Blurred Backdrop */}
      <div
        className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm transition-opacity duration-300 z-0"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative bg-white border border-stone-200 rounded-3xl max-w-xl w-full shadow-2xl flex flex-col z-10 text-stone-900 overflow-hidden animate-scale-in">
        {/* Modal Header */}
        <div className="p-5 border-b border-stone-200 bg-[#F7F8F5] shrink-0 select-none flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#00635C]/10 border border-[#00635C]/20 flex items-center justify-center text-[#00635C] font-bold font-serif text-base shrink-0 shadow-2xs">
              {personName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-serif font-bold text-stone-900">{personName}</h3>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {personRole.includes('BIC') ? 'Broker-in-Charge' : personRole.includes('Leader') ? 'Team Lead' : 'Active Member'}
                </span>
              </div>
              <p className="text-xs text-stone-500 font-sans flex items-center gap-2 mt-0.5">
                <span>{personRole}</span>
                <span>•</span>
                <span>{personOffice}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-stone-200/80 rounded-xl text-stone-400 hover:text-stone-700 transition-colors cursor-pointer border-none bg-transparent"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 font-sans overflow-y-auto max-h-[75vh]">
          {/* Quick Contact Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-[#00635C] shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-semibold uppercase text-stone-400 block">Email Address</span>
                <a href={`mailto:${personEmail}`} className="text-xs font-semibold text-stone-800 truncate block hover:text-[#00635C]">
                  {personEmail}
                </a>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-[#00635C] shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-semibold uppercase text-stone-400 block">Direct Phone</span>
                <a href={`tel:${personPhone.replace(/[^0-9+]/g, '')}`} className="text-xs font-semibold text-stone-800 truncate block hover:text-[#00635C]">
                  {personPhone}
                </a>
              </div>
            </div>
          </div>

          {/* Channel Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-700 block">Select Communication Channel</label>
            <div className="grid grid-cols-2 gap-2 bg-stone-100/80 p-1 rounded-2xl border border-stone-200">
              <button
                type="button"
                onClick={() => setChannel('email')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  channel === 'email'
                    ? 'bg-white text-[#00635C] shadow-xs border border-stone-200/80'
                    : 'text-stone-600 hover:text-stone-900 bg-transparent border-transparent'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Send Email</span>
              </button>
              <button
                type="button"
                onClick={() => setChannel('sms')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  channel === 'sms'
                    ? 'bg-white text-[#00635C] shadow-xs border border-stone-200/80'
                    : 'text-stone-600 hover:text-stone-900 bg-transparent border-transparent'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Direct SMS Text</span>
              </button>
            </div>
          </div>

          {/* Message Templates */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#00635C]" />
                <span>Message Templates (Click to apply)</span>
              </label>
              <span className="text-[10px] text-stone-400">4 templates available</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => handleSelectTemplate(tmpl.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedTemplateId === tmpl.id
                      ? 'bg-emerald-50/80 border-[#00635C] ring-1 ring-[#00635C]/30 shadow-2xs'
                      : 'bg-white border-stone-200 hover:border-stone-300 hover:bg-stone-50/50'
                  }`}
                >
                  <div className="font-bold text-xs text-stone-900 flex items-center justify-between">
                    <span>{tmpl.title}</span>
                    {selectedTemplateId === tmpl.id && <Check className="w-3.5 h-3.5 text-[#00635C]" />}
                  </div>
                  <p className="text-[10.5px] text-stone-500 mt-0.5 line-clamp-1">{tmpl.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-3">
            {channel === 'email' && (
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-stone-600 uppercase tracking-wider">Email Subject</label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Subject line..."
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-[#00635C]/30 focus:border-[#00635C] transition-all"
                />
              </div>
            )}

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-stone-600 uppercase tracking-wider">
                  {channel === 'email' ? 'Email Message' : 'SMS Text Message'}
                </label>
                <span className="text-[10px] text-stone-400">
                  {messageBody.length} characters {channel === 'sms' && `(approx. ${Math.ceil(messageBody.length / 160)} SMS)`}
                </span>
              </div>
              <textarea
                rows={channel === 'email' ? 6 : 4}
                value={messageBody}
                onChange={(e) => setMessageBody(e.target.value)}
                placeholder="Write your message here..."
                className="w-full p-3.5 bg-stone-50 border border-stone-200 rounded-xl text-xs leading-relaxed font-sans text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-[#00635C]/30 focus:border-[#00635C] transition-all resize-none"
              />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-stone-200 bg-[#F7F8F5] flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleCopyMessage}
            className="px-3 py-2 bg-white hover:bg-stone-100 border border-stone-200 text-stone-700 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
          >
            {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-stone-500" />}
            <span>{copiedText ? 'Copied' : 'Copy Message'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 hover:bg-stone-200/60 text-stone-600 text-xs font-bold rounded-xl transition-colors cursor-pointer border-none bg-transparent"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSend}
              disabled={isSending || isSent || !messageBody.trim()}
              className="px-5 py-2 bg-[#00635C] hover:bg-[#00514B] disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-xs"
            >
              {isSent ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300 animate-bounce" />
                  <span>Message Sent!</span>
                </>
              ) : isSending ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>{channel === 'email' ? 'Send Email' : 'Send SMS'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPersonModal;
