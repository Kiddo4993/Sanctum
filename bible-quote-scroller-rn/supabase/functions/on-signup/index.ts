// supabase/functions/on-signup/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY') || '';
// LIST_ID must be a number for Brevo's API
const LIST_ID = parseInt(Deno.env.get('BREVO_LIST_ID') || '2', 10);

serve(async (req) => {
  try {
    const { record } = await req.json();
    const email = record.email;

    if (!email) {
      return new Response("No email provided", { status: 400 });
    }

    // Add contact directly to a Brevo List
    const res = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'api-key': BREVO_API_KEY
      },
      body: JSON.stringify({
        email: email,
        listIds: [LIST_ID],
        updateEnabled: true // Crucial: updates lists if contact already exists
      })
    });

    const data = await res.json();
    
    return new Response(JSON.stringify({ success: true, data }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
