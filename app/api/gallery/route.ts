import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { uploadImage, STORAGE_BUCKETS } from '@/lib/supabase/storage';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('gallery')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error fetching gallery:', error);
    return NextResponse.json(
      { message: 'Failed to fetch gallery' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const imageFile = formData.get('image') as File;
    if (!imageFile) {
      return NextResponse.json(
        { message: 'Image file is required' },
        { status: 400 }
      );
    }

    // Upload image to Supabase Storage
    const { url, error: uploadError } = await uploadImage(
      STORAGE_BUCKETS.GALLERY,
      imageFile
    );

    if (uploadError) throw new Error('Failed to upload image');

    const imageData = {
      title: formData.get('title') as string,
      description: formData.get('description') as string || null,
      image_url: url,
      event_id: formData.get('event_id') as string || null,
      uploaded_by: 'admin',
      tags: formData.get('tags') 
        ? JSON.parse(formData.get('tags') as string) 
        : [],
    };

    const { data, error } = await supabaseAdmin
      .from('gallery')
      .insert([imageData])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json(
      { message: 'Failed to upload image' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { message: 'Image ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from('gallery')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ message: 'Image deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to delete image' },
      { status: 500 }
    );
  }
}
