export interface GalleryImage {
  id: string;
  title: string;
  description?: string;
  image_url: string;
  event_id?: string;
  uploaded_by: string;
  tags?: string[];
  created_at: string;
}

export interface GalleryUploadData {
  title: string;
  description?: string;
  event_id?: string;
  tags?: string[];
  image: File;
}
