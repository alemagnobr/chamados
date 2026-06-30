export type TicketStatus = 'EM_ANDAMENTO' | 'FINALIZADO';

export interface Ticket {
  id: string;
  status: TicketStatus;
  description: string;
  networkLogin: string;
  extension: string; // Ramal
  mobile: string;
  microLogicalAddress: string;
  printerLogicalAddress: string;
  monitorLogicalAddress: string;
  createdAt: string; // ISO date string
  finishedAt?: string; // ISO date string
  durationSeconds: number; // For active tracking and final reporting
  category?: string;
  associatedFaqId?: string;
  structuredResult?: string;
  isPaused?: boolean;
  selectedProcedures?: string[];
  problemSolved?: boolean;
  clientValidated?: boolean;
  isEscalated?: boolean;
  escalationContent?: string;
  user?: {
    name: string;
    email: string;
    id: string;
  };
}

export interface ActiveTicket extends Ticket {
  // Active tickets might have drafts or unsaved states
  isDraft: boolean;
}

export interface Procedure {
  id: string;
  name: string;
  description: string;
  steps?: string;
  category?: string;
}

export interface Orientation {
  id: string;
  name: string;
  description: string;
  steps?: string;
  category?: string;
}

export interface PredefinedSolution {
  id: string;
  title: string;
  content: string;
}

export interface FAQ {
  id: string;
  faqNumber: string;
  category: string;
  name: string;
  technicalInfo: string;
  type: 'Incidente' | 'Requisição de serviço' | '';
  service: string;
  subject: string;
  system: string;
  associatedProcedureId: string;
  procedure: string;
  originalLink?: string;
}

export interface Information {
  id: string;
  title: string;
  content: string;
}

export interface AppSettings {
  sla: {
    otima: number;
    boa: number;
    atencao: number;
    ruim: number;
    critica: number;
  };
  closingTextEnabled: boolean;
  closingText: string;
  categories: string[];
  procedures: Procedure[];
  predefinedSolutions: PredefinedSolution[];
  escalationTemplate: string;
  aiGuidelines: string[];
  aiPromptStandard?: string;
  aiPromptEscalated?: string;
  faqs?: FAQ[];
  systems?: string[];
  orientations?: Orientation[];
  geminiApiKey?: string;
  informations?: Information[];
}

