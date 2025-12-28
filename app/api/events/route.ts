import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { uploadImage, STORAGE_BUCKETS } from '@/lib/supabase/storage';
import { supabase } from '@/lib/supabase/client';
import type { Event } from '@/types/event';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('events')
      .select('*')
      .order('date', { ascending: true });

    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { message: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const eventData: Partial<Event> = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      date: formData.get('date') as string,
      time: formData.get('time') as string,
      location: formData.get('location') as string,
      category: formData.get('category') as Event['category'],
      registration_link: formData.get('registration_link') as string || undefined,
      is_featured: formData.get('is_featured') === 'true',
    };

    // Handle image upload if present
    const imageFile = formData.get('image') as File | null;
    if (imageFile && imageFile.size > 0) {
      const { url, error } = await uploadImage(
        STORAGE_BUCKETS.EVENTS,
        imageFile
      );
      
      if (error) throw new Error('Failed to upload image');
      eventData.image_url = url;
    }

    const { data, error } = await supabaseAdmin
      .from('events')
      .insert([eventData])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { message: 'Failed to create event' },
      { status: 500 }
    );
  }
}
