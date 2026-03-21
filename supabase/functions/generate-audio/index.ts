import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { quoteId, verseText, voiceId = '21m00Tcm4TlvDq8ikWAM' } = await req.json()

    if (!quoteId || !verseText) {
      throw new Error('Missing require parameters')
    }

    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY')
    if (!ELEVENLABS_API_KEY) throw new Error('Missing ELEVENLABS_API_KEY')

    // 1. Call ElevenLabs TTS API
    const elRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg'
      },
      body: JSON.stringify({
        text: verseText,
        model_id: 'eleven_monolingual_v1',
        voice_settings: { stability: 0.75, similarity_boost: 0.75 }
      }),
    })

    if (!elRes.ok) throw new Error(`ElevenLabs API error: ${elRes.statusText}`)
    
    // Get audio as ArrayBuffer directly
    const audioBuffer = await elRes.arrayBuffer()

    // 2. Upload to Supabase Storage
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!)

    const filename = `${quoteId}_${voiceId}.mp3`
    
    const { error: uploadError } = await supabase.storage
      .from('verse-audio')
      .upload(filename, audioBuffer, {
        contentType: 'audio/mpeg',
        upsert: true
      })

    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`)
    }

    // 3. Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('verse-audio')
      .getPublicUrl(filename)

    return new Response(JSON.stringify({ audioUrl: publicUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
