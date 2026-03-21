import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

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
    // Expected to be called as a Webhook from Supabase Auth when a new user signs up
    // Payload matches Supabase Webhook payload format: { type: 'INSERT', record: { email: '...' } }
    const { record } = await req.json()

    if (!record || !record.email) {
      throw new Error('Missing user email in payload')
    }

    const email = record.email

    const MAILCHIMP_API_KEY = Deno.env.get('MAILCHIMP_API_KEY')
    const MAILCHIMP_LIST_ID = Deno.env.get('MAILCHIMP_LIST_ID')
    
    if (!MAILCHIMP_API_KEY || !MAILCHIMP_LIST_ID) {
       throw new Error('Mailchimp environment variables missing')
    }

    const dataCenter = MAILCHIMP_API_KEY.split('-')[1]
    const url = `https://${dataCenter}.api.mailchimp.com/3.0/lists/${MAILCHIMP_LIST_ID}/members`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `apikey ${MAILCHIMP_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email_address: email,
        status: 'subscribed',
      }),
    })

    // Mailchimp returns 400 if user is already on the list, which is fine to ignore
    if (!response.ok && response.status !== 400) {
      throw new Error(`Mailchimp error: ${response.statusText}`)
    }

    return new Response(JSON.stringify({ success: true, email }), {
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
