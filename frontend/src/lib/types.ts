export interface Child {
  id: string;
  name: string;
  age: number;
  avatar_url?: string;
  favorite_color?: string;
  favorite_animal?: string;
  interests: string[];
  dislikes: string[];
  parent_notes?: string;
}

export interface Activity {
  id: string;
  title: string;
  slug: string;
  theme: string;
  description?: string;
  image_url?: string;
  min_age?: number;
  max_age?: number;
  duration_minutes: number;
  difficulty?: string;
  requires_parent: boolean;
  status: string;
}

export interface ScheduleItem {
  id: string;
  activity_id: string;
  day_of_week: number;
  start_time?: string;
  duration_minutes: number;
  status: 'planned' | 'complete' | 'completed' | 'skip' | 'skipped' | 'postponed';
  activity?: Activity;
}

export interface Schedule {
  id: string;
  child_id: string;
  title: string;
  week_start_date: string;
  theme?: string;
  items: ScheduleItem[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  message: string;
  created_at: string;
}

export interface AIProvider {
  name: string;
  provider_type: string;
  model?: string;
  capabilities: string[];
  api_key_env?: string;
}
