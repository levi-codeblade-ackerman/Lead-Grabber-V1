export interface Message {
  id: string;
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  thread_id: string;
  company_id: string;
  status: 'new' | 'replied' | 'assigned';
  source: 'web' | 'leadform' | 'leadbox' | 'agent' | 'email' | 'sms';
  created: string;
  initials: string;
  color: string;
  assigned_to?: string;
  messages: {
    content: string;
    timestamp: string;
    is_agent_reply: boolean;
    agent_id?: string;
    agent_name?: string;
  }[];
  form_data?: Record<string, any>;
  source_url?: string;
} 