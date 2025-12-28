'use client';

import { useRouter } from 'next/navigation';
import { useGallery } from '@/hooks/useGallery';
import { ImageUpload } from '@/components/admin/ImageUpload';

export default function UploadImagePage() {
  const router = useRouter();
  const { uploadImage } = useGallery();

  const handleUpload = async (formData: FormData) => {
    await uploadImage(formData);
    router.push('/admin/gallery');
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Upload Images</h1>
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <ImageUpload
          onSubmit={handleUpload}
          onCancel={() => router.push('/admin/gallery')}
        />
      </div>
    </div>
  );
}
