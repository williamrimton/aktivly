const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/resend'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
  if (!LOVABLE_API_KEY) {
    return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY is not configured' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: 'RESEND_API_KEY is not configured' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const { participants, activityTitle, siteUrl } = await req.json()

    if (!participants || !Array.isArray(participants) || participants.length === 0) {
      return new Response(JSON.stringify({ error: 'No participants provided' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!activityTitle || typeof activityTitle !== 'string') {
      return new Response(JSON.stringify({ error: 'activityTitle is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const results = []

    for (const p of participants) {
      if (!p.email) continue

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1a1a1a;">Hej ${p.name || 'där'}!</h2>
          <p style="color: #555; font-size: 16px; line-height: 1.5;">
            Du har blivit inbjuden till en ny aktivitet: <strong>${activityTitle}</strong>
          </p>
          <p style="color: #555; font-size: 16px; line-height: 1.5;">
            Logga in på Aktivly för att se detaljer och svara på inbjudan.
          </p>
          <a href="${siteUrl || 'https://aktivly.lovable.app'}/login" 
             style="display: inline-block; background: #6366f1; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px;">
            Logga in och svara
          </a>
          <p style="color: #999; font-size: 12px; margin-top: 32px;">
            Detta mail skickades från Aktivly.
          </p>
        </div>
      `

      const response = await fetch(`${GATEWAY_URL}/emails`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'X-Connection-Api-Key': RESEND_API_KEY,
        },
        body: JSON.stringify({
          from: 'Aktivly <onboarding@resend.dev>',
          to: [p.email],
          subject: `Du är inbjuden till: ${activityTitle}`,
          html,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        console.error(`Failed to send to ${p.email}:`, data)
        results.push({ email: p.email, success: false, error: data })
      } else {
        results.push({ email: p.email, success: true })
      }
    }

    return new Response(JSON.stringify({ results }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: unknown) {
    console.error('Error sending notifications:', error)
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
