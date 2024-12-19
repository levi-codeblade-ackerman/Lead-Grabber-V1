export interface Message {
  id: string;
  customer_name: string;
  customer_phone?: string;
  message: string;
  thread_id: string;
  company_id: string;
  status: 'new' | 'replied' | 'assigned';
  source: 'web' | 'leadform' | 'leadbox';
  created: string;
  initials: string;
  color: string;
} 