import React from 'react';
import { motion, useMotionValue, useTransform, useReducedMotion } from 'framer-motion';
import { 
  Calendar, 
  User, 
  Clock, 
  ArrowRight, 
  Check, 
  ChevronLeft, 
  ChevronRight,
  Sparkles,
  HelpCircle,
  ShieldAlert,
  AlertTriangle,
  Layers,
  Mail,
  ShieldCheck,
  FileText,
  MessageSquare
} from 'lucide-react';
import { AttentionCardData } from '../../hooks/useNeedsAttentionDeck';

interface AttentionCardProps {
  key?: any;
  card: AttentionCardData;
  index: number;
  total: number;
  displayIndex: number;
  onSnooze: () => void | Promise<void>;
  onAction: () => void | Promise<void>;
  onOpen: () => void;
  isFront: boolean;
  onPrev?: () => void;
  onNext?: () => void;
}

export default function AttentionCard({
  card,
  index,
  total,
  displayIndex,
  onSnooze,
  onAction,
  onOpen,
  isFront,
  onPrev,
  onNext
}: AttentionCardProps) {
  const shouldReduceMotion = useReducedMotion();
  const [showExplanation, setShowExplanation] = React.useState(false);
  const x = useMotionValue(0);
  
  // Transform drag distance to rotation, scale, and background color indicators
  const rotate = useTransform(x, [-200, 200], [-10, 10]);
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0.5, 0.9, 1, 0.9, 0.5]);
  
  // Swipe indicators opacity
  const snoozeIndicatorOpacity = useTransform(x, [-120, -40], [1, 0]);
  const actionIndicatorOpacity = useTransform(x, [40, 120], [0, 1]);

  const handleDragEnd = (_event: any, info: any) => {
    if (shouldReduceMotion) return;
    const threshold = 100;
    if (info.offset.x < -threshold) {
      onSnooze();
    } else if (info.offset.x > threshold) {
      onAction();
    }
  };

  const getPriorityBadgeClass = (p: string) => {
    switch (p) {
      case 'owner_worthy':
        return 'bg-amber-50 border-amber-200 text-amber-900 font-bold';
      case 'critical':
      case 'high':
        return 'bg-red-50 border-red-200 text-red-700 font-bold';
      case 'medium':
        return 'bg-stone-50 border-stone-200 text-stone-700';
      default:
        return 'bg-stone-50 border-stone-100 text-stone-500';
    }
  };

  const getPriorityLabel = (p: string) => {
    if (p === 'owner_worthy') return 'Owner Worthy';
    return p.charAt(0).toUpperCase() + p.slice(1);
  };

  const isDueToday = (dateStr?: string) => {
    if (!dateStr) return false;
    const today = new Date().toDateString();
    const due = new Date(dateStr).toDateString();
    return due === today;
  };

  const getPlainLanguageLabel = () => {
    if (card.sourceType === 'approval' || card.type === 'proposal') {
      const isEmail = card.title.toLowerCase().includes('email') || card.summary.toLowerCase().includes('email');
      const isSMS = card.title.toLowerCase().includes('sms') || card.summary.toLowerCase().includes('sms');
      if (isEmail) return 'Email draft ready';
      if (isSMS) return 'SMS draft ready';
      return 'Approval needed';
    }

    if (card.originalRecord?.status === 'blocked' || card.type === 'blocked') {
      return 'Blocked request';
    }

    const isOverdueVal = card.dueDate && new Date(card.dueDate) < new Date();
    const isToday = card.dueDate && isDueToday(card.dueDate);
    if (isOverdueVal || isToday) {
      return 'Deadline approaching';
    }

    if (
      card.type === 'compliance' ||
      card.type === 'closing_compliance_risk' ||
      card.type === 'missing_information'
    ) {
      return 'Compliance item missing';
    }

    return 'Task needs owner';
  };

  // Map card categories to icons and colored text
  const getSubjectAndIcon = () => {
    const label = getPlainLanguageLabel();
    switch (label) {
      case 'Email draft ready':
        return {
          label,
          icon: <Mail className="w-3.5 h-3.5 text-purple-600" />,
          colorClass: 'text-purple-750 font-bold'
        };
      case 'SMS draft ready':
        return {
          label,
          icon: <MessageSquare className="w-3.5 h-3.5 text-indigo-650" />,
          colorClass: 'text-indigo-750 font-bold'
        };
      case 'Approval needed':
        return {
          label,
          icon: <Sparkles className="w-3.5 h-3.5 text-purple-600" />,
          colorClass: 'text-purple-750 font-bold'
        };
      case 'Blocked request':
        return {
          label,
          icon: <AlertTriangle className="w-3.5 h-3.5 text-red-650" />,
          colorClass: 'text-red-750 font-bold'
        };
      case 'Deadline approaching':
        return {
          label,
          icon: <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />,
          colorClass: 'text-amber-700 font-bold'
        };
      case 'Compliance item missing':
        return {
          label,
          icon: <ShieldAlert className="w-3.5 h-3.5 text-orange-600" />,
          colorClass: 'text-orange-705 font-bold'
        };
      default:
        return {
          label,
          icon: <Layers className="w-3.5 h-3.5 text-emerald-700" />,
          colorClass: 'text-emerald-750 font-bold'
        };
    }
  };

  const getWhyItMatters = () => {
    if (card.originalRecord?.why_it_matters) return card.originalRecord.why_it_matters;
    if (card.originalRecord?.whyItMatters) return card.originalRecord.whyItMatters;

    const titleLower = card.title.toLowerCase();
    if (titleLower.includes('transcript') || titleLower.includes('tax')) {
      return 'Closing could be delayed if the signed transcript request is not returned today.';
    }
    if (titleLower.includes('earnest') || titleLower.includes('wire')) {
      return 'Financing contingency can trigger unless wire deposit receipt is logged.';
    }
    if (titleLower.includes('financing delay') || titleLower.includes('extension')) {
      return 'The earnest money deposit could be forfeited if extension is not signed.';
    }
    if (titleLower.includes('foundation') || titleLower.includes('contingency')) {
      return 'Underwriting will reject clear-to-close unless the foundation crack waiver is signed.';
    }
    if (titleLower.includes('closing date') || titleLower.includes('date')) {
      return 'Compliance triggers require escrow target closing dates to balance TC capacity.';
    }
    if (titleLower.includes('photo') || titleLower.includes('flyer')) {
      return 'MLS syndication compliance forbids publishing listing without verified photos.';
    }
    if (titleLower.includes('credit')) {
      return 'Financing contingency requires updated credit authorizations to proceed.';
    }
    return 'Unresolved checklist items can delay closing and trigger compliance audits.';
  };

  const getAssignedText = () => {
    const owner = card.originalRecord?.assignedOwnerName || card.assignedTo;
    const role = card.originalRecord?.ownerRole || 'Broker Owner';
    const roleLabel = role === 'transaction_coordinator' ? 'Transaction Coordinator' : (role === 'compliance_partner' ? 'Compliance Partner' : 'Broker Owner');
    if (owner && owner.includes('Marcus')) return `${owner} (${roleLabel})`;
    if (owner && owner.includes('Sarah')) return `${owner} (${roleLabel})`;
    return `${owner} (${roleLabel})`;
  };

  const getDueText = () => {
    const dateStr = card.dueDate;
    if (!dateStr) return 'Today';
    const isOverdueVal = new Date(dateStr) < new Date();
    const isToday = isDueToday(dateStr);
    const dateFormatted = new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    if (isOverdueVal) return `${dateFormatted} (Overdue)`;
    if (isToday) return `${dateFormatted} (Today)`;
    return `${dateFormatted}`;
  };

  const getWhyAmISeeingThisText = () => {
    if (card.sourceType === 'approval' || card.type === 'proposal') {
      return 'This is a pending AI agent recommendation that requires your explicit review and authorization before dispatching external communications.';
    }
    const isOverdueVal = card.dueDate && new Date(card.dueDate) < new Date();
    const role = card.originalRecord?.ownerRole || 'Broker Owner';
    const roleLabel = role === 'transaction_coordinator' ? 'Transaction Coordinator' : (role === 'compliance_partner' ? 'Compliance Partner' : 'Broker Owner');
    return `This is due ${isOverdueVal ? 'recently (overdue)' : 'soon'}, is assigned to the ${roleLabel} role, and requires your sign-off to resolve the operational risk.`;
  };

  const getButtonLabels = () => {
    const titleLower = card.title.toLowerCase();
    if (card.sourceType === 'approval' || card.type === 'proposal') {
      const isEmailOrSMS = titleLower.includes('email') || titleLower.includes('sms') || titleLower.includes('draft');
      if (isEmailOrSMS) {
        return {
          primary: 'Review before sending',
          secondary: 'Review draft'
        };
      }
      return {
        primary: 'Resolve issue',
        secondary: 'Review details'
      };
    }
    if (titleLower.includes('closing date') || titleLower.includes('date')) {
      return {
        primary: 'Request missing info',
        secondary: 'Open full task'
      };
    }
    if (titleLower.includes('document') || titleLower.includes('disclosure')) {
      return {
        primary: 'Resolve issue',
        secondary: 'Open full task'
      };
    }
    return {
      primary: 'Resolve issue',
      secondary: 'Review details'
    };
  };

  const getSnoozeCopy = () => {
    const isOverdueVal = card.originalRecord?.dueDate && new Date(card.originalRecord.dueDate) < new Date();
    if (isOverdueVal) return 'Not now — remind me in 15 mins';
    if (card.priority === 'owner_worthy') return 'Not now — remind me in 30 mins';
    if (card.priority === 'high' || card.priority === 'critical') return 'Not now — remind me in 1 hour';
    if (card.priority === 'medium') return 'Not now — remind me in 4 hours';
    return 'Not now — remind me tomorrow';
  };

  // Stack styling for background cards (fanned upwards behind the front card)
  const translateY = index * -12;
  const scale = 1 - index * 0.035;

  const stackStyle = !isFront ? {
    transform: `translateY(${translateY}px) scale(${scale})`,
    zIndex: total - index,
    opacity: Math.max(0.04, 1 - index * 0.28), // Steeper decay to fade backmost cards (index 3 & 4)
    pointerEvents: 'none' as const
  } : {};

  const subject = getSubjectAndIcon();

  // Render high-fidelity visual mockups on the card body
  const renderVisualMock = () => {
    if (card.sourceType === 'approval' || card.type === 'proposal') {
      const isEmail = card.title.toLowerCase().includes('email') || card.summary.toLowerCase().includes('email');
      const isSMS = card.title.toLowerCase().includes('sms') || card.summary.toLowerCase().includes('sms');
      const recipient = card.originalRecord?.recipient || 'Agent / Client';
      const channel = isEmail ? 'Email Draft' : (isSMS ? 'SMS Text' : 'Signal Log');
      
      return (
        <div className="bg-[#f8f9fa] border border-[#e4decb]/60 rounded-2xl p-4 space-y-2 text-[11px] font-sans">
          <div className="flex justify-between items-center border-b border-stone-200/60 pb-1.5 font-bold text-stone-500">
            <span className="flex items-center gap-1.5">
              {isEmail ? <Mail className="w-3.5 h-3.5 text-stone-400" /> : <MessageSquare className="w-3.5 h-3.5 text-stone-400" />}
              <span>{channel} to {recipient}</span>
            </span>
            <span className="bg-[#eaf2ee] text-[#18382b] px-2 py-0.5 rounded text-[9px] uppercase tracking-wider font-extrabold">Ready to dispatch</span>
          </div>
          <div className="space-y-1">
            <div className="text-stone-400 font-semibold"><span className="text-stone-500 font-bold">Subject:</span> {card.title}</div>
            <div className="text-stone-600 bg-white border border-stone-200/50 rounded-lg p-2.5 leading-relaxed italic max-h-20 overflow-y-auto font-mono">
              "{card.summary}"
            </div>
          </div>
        </div>
      );
    }

    // Default compliance / operational work item visual mockup
    return (
      <div className="bg-[#fcfbf7] border border-[#e4decb]/60 rounded-2xl p-4 space-y-3 text-[11px] font-sans">
        <div className="flex justify-between items-center border-b border-stone-200/60 pb-1.5 font-bold text-stone-500">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-stone-400" />
            <span>Escrow & Compliance Auditing</span>
          </span>
          <span className="bg-red-50 text-red-700 px-2 py-0.5 rounded text-[9px] uppercase tracking-wider font-extrabold border border-red-100">Attention Gated</span>
        </div>
        <div className="space-y-1">
          <span className="text-stone-400 text-[9px] uppercase tracking-wider font-bold block">Related Record</span>
          <span className="text-[#18382b] flex items-center gap-1 font-semibold">
            <FileText className="w-3.5 h-3.5 text-stone-400" />
            <span className="truncate">{card.originalRecord?.relatedLabel || 'Nest Property File'}</span>
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="relative w-full h-full">
      {/* OVERLAPPING ARROW NAVIGATION BUTTONS ON THE CARD ITSELF */}
      {isFront && onPrev && onNext && total > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPrev();
            }}
            className="absolute left-[-22px] md:left-[-32px] top-1/2 -translate-y-1/2 z-[60] bg-[#fffdf7] border border-[#e4decb] hover:bg-stone-50 hover:scale-110 active:scale-95 p-2 md:p-3 rounded-full shadow-[0_4px_10px_rgba(55,47,35,0.08)] text-stone-600 transition-all duration-200 cursor-pointer flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#18382b]"
            aria-label="Previous card"
          >
            <ChevronLeft className="w-4 h-4 md:w-5 md:h-5 text-[#18382b]" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            className="absolute right-[-22px] md:right-[-32px] top-1/2 -translate-y-1/2 z-[60] bg-[#fffdf7] border border-[#e4decb] hover:bg-stone-50 hover:scale-110 active:scale-95 p-2 md:p-3 rounded-full shadow-[0_4px_10px_rgba(55,47,35,0.08)] text-stone-600 transition-all duration-200 cursor-pointer flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#18382b]"
            aria-label="Next card"
          >
            <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-[#18382b]" />
          </button>
        </>
      )}

      <motion.div
        aria-label={`Card ${displayIndex} of ${total} in ${subject.label} deck`}
        style={
          isFront
            ? (shouldReduceMotion ? { zIndex: 50 } : { x, rotate, opacity, zIndex: 50 })
            : stackStyle
        }
        drag={isFront && !shouldReduceMotion ? 'x' : false}
        dragConstraints={{ left: -250, right: 250 }}
        onDragEnd={handleDragEnd}
        whileHover={isFront && !shouldReduceMotion ? { scale: 1.02, y: -6 } : undefined}
        whileTap={isFront && !shouldReduceMotion ? { scale: 0.98 } : undefined}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className={`absolute w-full attention-card ${
          isFront ? 'attention-card-front' : 'attention-card-back'
        } bg-[#fffdf7] border border-[#e4decb]/90 rounded-[28px] select-none transition-all duration-300 flex flex-col overflow-hidden h-[400px] ${
          isFront ? 'shadow-[0_24px_60px_rgba(55,47,35,0.12),0_4px_12px_rgba(55,47,35,0.06)]' : 'border-[#e4decb]/60 shadow-[0_4px_12px_rgba(55,47,35,0.02)]'
        }`}
      >
        {/* Swipe Feedback Overlays */}
        {isFront && !shouldReduceMotion && (
          <>
            <motion.div
              style={{ opacity: snoozeIndicatorOpacity }}
              className="absolute top-16 left-4 bg-amber-50 border border-amber-200 text-amber-800 text-[10px] uppercase font-bold tracking-wider px-3 py-1 rounded-full flex items-center gap-1 pointer-events-none z-[70]"
            >
              <Clock className="w-3 h-3" />
              <span>Snooze</span>
            </motion.div>
            <motion.div
              style={{ opacity: actionIndicatorOpacity }}
              className="absolute top-16 right-4 bg-[#eaf2ee] border border-[#18382b]/30 text-[#18382b] text-[10px] uppercase font-bold tracking-wider px-3 py-1 rounded-full flex items-center gap-1 pointer-events-none z-[70]"
            >
              <Check className="w-3 h-3" />
              <span>Resolve</span>
            </motion.div>
          </>
        )}

        {/* 1. Header Block: Category Subject & Page Index */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-[#e4decb]/50 bg-stone-50/50">
          <div className="flex items-center gap-2">
            {subject.icon}
            <span className={`text-[10px] font-bold uppercase tracking-wider ${subject.colorClass}`}>
              {subject.label}
            </span>
          </div>
          <span className="text-[10px] font-bold text-stone-500 tracking-wider">
            {displayIndex} of {total}
          </span>
        </div>

        {/* 2. Content Block */}
        <div className="p-5 flex-grow flex flex-col justify-between space-y-3.5">
          <div className="space-y-3.5 text-left">
            <div className="flex items-start justify-between gap-4">
              <h3 className="font-serif text-sm md:text-base font-bold text-[#18382b] leading-tight">
                {card.title}
              </h3>
              <span className={`text-[8px] uppercase tracking-wider border px-2 py-0.5 rounded-full shrink-0 ${getPriorityBadgeClass(card.priority)}`}>
                {getPriorityLabel(card.priority)}
              </span>
            </div>

            <p className="text-[11px] text-stone-600 font-medium leading-relaxed">
              {card.summary}
            </p>

            {/* Why it matters & metadata grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[10px] bg-stone-50/60 border border-[#e4decb]/30 rounded-xl p-3">
              <div className="space-y-2">
                <div>
                  <span className="text-[8px] text-stone-400 block uppercase tracking-wider font-bold leading-none mb-1">Why it matters</span>
                  <span className="text-stone-700 font-semibold leading-normal">{getWhyItMatters()}</span>
                </div>
                <div>
                  <span className="text-[8px] text-stone-400 block uppercase tracking-wider font-bold leading-none mb-1">Assigned to</span>
                  <span className="text-stone-700 font-semibold leading-normal">{getAssignedText()}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div>
                  <span className="text-[8px] text-stone-400 block uppercase tracking-wider font-bold leading-none mb-1">Due</span>
                  <span className="text-stone-700 font-semibold leading-normal">{getDueText()}</span>
                </div>
                <div>
                  <span className="text-[8px] text-stone-400 block uppercase tracking-wider font-bold leading-none mb-1">Recommended Next Action</span>
                  <span className="text-[#18382b] font-bold leading-normal">{card.recommendedNextAction}</span>
                </div>
              </div>
            </div>

            {/* Expandable Why am I seeing this */}
            <div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowExplanation(!showExplanation);
                }}
                className="text-[9px] text-[#18382b] font-bold hover:underline flex items-center gap-1 cursor-pointer focus:outline-none"
              >
                <span>{showExplanation ? 'Hide details' : 'Why am I seeing this?'}</span>
              </button>
              {showExplanation && (
                <p className="mt-1 text-[9px] text-stone-500 leading-normal bg-stone-50 p-2 rounded border border-stone-200/50">
                  {getWhyAmISeeingThisText()}
                </p>
              )}
            </div>
          </div>
          
          {/* Footer Actions */}
          {isFront && (
            <div className="pt-2 flex items-center justify-between gap-3 border-t border-[#e4decb]/30 bg-white">
              <button
                type="button"
                onClick={onSnooze}
                className="px-3 py-2 border border-stone-200 hover:border-amber-300 hover:bg-amber-50/50 text-stone-600 hover:text-amber-800 rounded-xl transition-all text-xs font-bold flex items-center gap-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500"
                aria-label="Snooze item"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{getSnoozeCopy()}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onOpen}
                  className="px-3.5 py-2 border border-stone-200 hover:border-[#18382b] hover:bg-stone-50 text-[#18382b] rounded-xl transition-all text-xs font-bold cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#18382b]"
                  aria-label={getButtonLabels().secondary}
                >
                  <span>{getButtonLabels().secondary}</span>
                </button>
                <button
                  type="button"
                  onClick={onAction}
                  className="px-3.5 py-2 bg-[#18382b] hover:bg-[#1f4938] text-white rounded-xl transition-all text-xs font-bold flex items-center gap-1 cursor-pointer shadow-sm focus:outline-none focus:ring-2 focus:ring-[#18382b]"
                  aria-label={getButtonLabels().primary}
                >
                  <span>{getButtonLabels().primary}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
