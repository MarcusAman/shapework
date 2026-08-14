export type AgentState = 
  | 'idle' 
  | 'starting' 
  | 'listening' 
  | 'collecting' 
  | 'finalizing' 
  | 'thinking' 
  | 'speaking' 
  | 'follow_up' 
  | 'cancelled' 
  | 'error';

export interface AgentTranscriptItem {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
}

export interface PendingProposal {
  type: string;        // e.g. "DRAFT_OFFER", "DISPATCH_VENDOR", "NOTIFY_COORDINATORS"
  summary: string;     // Spoken description
  value: any;          // Structured payload
  isConfirmed: boolean;
}

export interface AgentRuntimeState {
  agentName: string;
  status: AgentState;
  interimTranscript: string;
  transcriptHistory: AgentTranscriptItem[];
  pendingProposal: PendingProposal | null;
  errorMessage: string | null;
}

export type AgentAction =
  | { type: 'SET_STATUS'; payload: AgentState }
  | { type: 'SET_INTERIM_TRANSCRIPT'; payload: string }
  | { type: 'CLEAR_INTERIM_TRANSCRIPT' }
  | { type: 'ADD_TRANSCRIPT'; payload: { sender: 'user' | 'agent'; text: string } }
  | { type: 'LOAD_TRANSCRIPTS'; payload: AgentTranscriptItem[] }
  | { type: 'CLEAR_TRANSCRIPTS' }
  | { type: 'SET_PROPOSAL'; payload: PendingProposal | null }
  | { type: 'CONFIRM_PROPOSAL' }
  | { type: 'REJECT_PROPOSAL' }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET' };

export const initialRuntimeState: AgentRuntimeState = {
  agentName: 'NORA',
  status: 'idle',
  interimTranscript: '',
  transcriptHistory: [],
  pendingProposal: null,
  errorMessage: null
};

export function agentRuntimeReducer(state: AgentRuntimeState, action: AgentAction): AgentRuntimeState {
  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  switch (action.type) {
    case 'SET_STATUS':
      return { ...state, status: action.payload };

    case 'SET_INTERIM_TRANSCRIPT':
      return { ...state, interimTranscript: action.payload };

    case 'CLEAR_INTERIM_TRANSCRIPT':
      return { ...state, interimTranscript: '' };

    case 'LOAD_TRANSCRIPTS':
      return {
        ...state,
        transcriptHistory: Array.isArray(action.payload) ? action.payload : []
      };

    case 'CLEAR_TRANSCRIPTS':
      return {
        ...state,
        transcriptHistory: []
      };

    case 'ADD_TRANSCRIPT':
      return {
        ...state,
        transcriptHistory: [
          ...state.transcriptHistory,
          {
            id: `${action.payload.sender}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            sender: action.payload.sender,
            text: action.payload.text,
            timestamp: timeStr
          }
        ]
      };

    case 'SET_PROPOSAL':
      return {
        ...state,
        pendingProposal: action.payload,
        status: action.payload ? 'follow_up' : state.status
      };

    case 'CONFIRM_PROPOSAL':
      if (!state.pendingProposal) return state;
      return {
        ...state,
        pendingProposal: { ...state.pendingProposal, isConfirmed: true },
        status: 'idle'
      };

    case 'REJECT_PROPOSAL':
      return {
        ...state,
        pendingProposal: null,
        status: 'idle'
      };

    case 'SET_ERROR':
      return {
        ...state,
        status: action.payload ? 'error' : 'idle',
        errorMessage: action.payload
      };

    case 'RESET':
      return {
        ...initialRuntimeState,
        agentName: state.agentName
      };

    default:
      return state;
  }
}
