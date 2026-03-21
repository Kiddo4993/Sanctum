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
    const { quoteId, verseText, reference } = await req.json()

    if (!quoteId || !verseText) {
      throw new Error('Missing require parameters')
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
    if (!OPENAI_API_KEY) throw new Error('Missing OPENAI_API_KEY')

    // 1. Call OpenAI API
    const systemPrompt = "You are a thoughtful, contemplative guide. Explain the meaning of this Bible verse in 2-3 short, modern paragraphs. Be comforting, profound, and accessible. Do not use overly academic theology."
    const userPrompt = `Verse: ${reference}\nText: "${verseText}"\n\nExplain the meaning.`

    const openAiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 300,
      }),
    })

    if (!openAiRes.ok) throw new Error(`OpenAI API error: ${openAiRes.statusText}`)
    
    const openAiData = await openAiRes.json()
    const meaningText = openAiData.choices[0].message.content

    // 2. Save to Supabase (so we never generate it again)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!)

    const { error: dbError } = await supabase
      .from('quote_meanings')
      .insert({ quote_id: quoteId, meaning_text: meaningText })

    if (dbError) {
      console.error('Failed to cache meaning:', dbError)
      // We still return the meaning even if cache fails
    }

    return new Response(JSON.stringify({ meaning: meaningText }), {
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
