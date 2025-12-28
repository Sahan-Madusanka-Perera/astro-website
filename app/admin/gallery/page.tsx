'use client';

import { useState } from 'react';
import { useGallery } from '@/hooks/useGallery';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { Plus, Trash2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminGalleryPage() {
  const { images, isLoading, uploadImage, deleteImage } = useGallery();
  const [showUploadForm, setShowUploadForm] = useState(false);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      await deleteImage(id);
      toast.success('Image deleted successfully');
    } catch (error) {
      toast.error('Failed to delete image');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
      </div>
    );
  }

  if (showUploadForm) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Upload Image</h1>
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 max-w-2xl">
          <ImageUpload
            onSubmit={async (formData) => {
              await uploadImage(formData);
              setShowUploadForm(false);
            }}
            onCancel={() => setShowUploadForm(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gallery</h1>
          <p className="text-gray-600 mt-2">Manage your astronomy club gallery</p>
        </div>
        <button
          onClick={() => setShowUploadForm(true)}
          className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Upload Image
        </button>
      </div>

      {images.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 border border-gray-200 text-center">
          <ImageIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No images yet
          </h3>
          <p className="text-gray-600 mb-6">
            Start building your gallery by uploading images
          </p>
          <button
            onClick={() => setShowUploadForm(true)}
            className="inline-flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Upload Image
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {images.map((image) => (
            <div
              key={image.id}
              className="group relative aspect-square rounded-lg overflow-hidden bg-gray-100"
            >
              <img
                src={image.image_url}
                alt={image.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4">
                <h3 className="text-white font-semibold text-center mb-2">
                  {image.title}
                </h3>
                {image.description && (
                  <p className="text-white/80 text-sm text-center mb-4 line-clamp-2">
                    {image.description}
                  </p>
                )}
                <button
                  onClick={() => handleDelete(image.id)}
                  className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
