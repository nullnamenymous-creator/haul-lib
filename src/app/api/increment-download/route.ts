import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

export async function POST(req: NextRequest) {
  try {
    const { fileId } = await req.json();

    if (!fileId) {
      return NextResponse.json({ error: 'fileId is required' }, { status: 400 });
    }

    const supabase = createClient();

    // Try RPC first
    const { error: rpcError } = await (supabase as any).rpc('increment_download_count', {
      target_file_id: fileId,
    });

    if (rpcError) {
      // Fallback: direct update
      const { data: currentData } = await (supabase
        .from('media_files') as any)
        .select('download_count')
        .eq('id', fileId)
        .single();

      if (currentData) {
        await (supabase
          .from('media_files') as any)
          .update({ download_count: (currentData.download_count || 0) + 1 })
          .eq('id', fileId);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error?.message }, { status: 200 });
  }
}
