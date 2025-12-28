export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  image_url?: string;
  category: 'observation' | 'workshop' | 'seminar' | 'trip' | 'other';
  registration_link?: string;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface EventFormData {
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  category: Event['category'];
  registration_link?: string;
  is_featured: boolean;
  image?: File;
}
