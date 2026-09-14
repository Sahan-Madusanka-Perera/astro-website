'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { MagazineUpload } from '@/components/admin/MagazineUpload';

export default function NewIssuePage() {
  return (
    <div>
      <Link
        href="/admin/magazine"
        className="group inline-flex items-center gap-2 text-[0.875rem] text-star-faint transition-colors hover:text-azure-glow"
      >
        <ArrowLeft className="h-4 w-4 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-x-1" />
        Back to magazine
      </Link>
      <h1 className="display mt-6 text-[1.875rem]">Upload an issue</h1>
      <p className="mt-2.5 max-w-[60ch] text-[0.9375rem] text-star-faint">
        Drop in the PDF. This browser turns every page into images for the flipbook, you check it in the preview, and it goes live.
      </p>
      <div className="mt-8">
        <MagazineUpload />
      </div>
    </div>
  );
}
