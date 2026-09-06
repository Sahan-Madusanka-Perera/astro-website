'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useGallery } from '@/hooks/useGallery';
import { ImageUpload } from '@/components/admin/ImageUpload';

export default function UploadImagePage() {
  const router = useRouter();
  const { uploadImage } = useGallery();

  return (
    <div>
      <Link
        href="/admin/gallery"
        className="group inline-flex items-center gap-2 text-[0.875rem] text-star-faint transition-colors hover:text-azure-glow"
      >
        <ArrowLeft className="h-4 w-4 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-x-1" />
        Back to gallery
      </Link>
      <h1 className="display mt-6 text-[1.875rem]">Upload image</h1>
      <div className="mt-8 max-w-2xl rounded-sm border border-rule bg-void-1 p-6 md:p-8">
        <ImageUpload
          onSubmit={async (formData) => {
            await uploadImage(formData);
            router.push('/admin/gallery');
          }}
          onCancel={() => router.push('/admin/gallery')}
        />
      </div>
    </div>
  );
}
