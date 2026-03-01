import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  // 1. Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 })
  }

  try {
    const payload = await req.json();

    // This function is triggered via Webhook. We extract the inserted/updated record.
    const record = payload.record;

    if (!record || !record.id) {
      return new Response(JSON.stringify({ error: "No gig record provided" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!API_KEY) {
      throw new Error("GEMINI_API_KEY is missing.");
    }

    // Prepare the text to embed: combination of title, description, and tags
    const textToEmbed = `Title: ${record.title}. Description: ${record.description}. Skills: ${(record.skill_tags || []).join(', ')}`;

    // Call Gemini to get the embedding vector (using text-embedding-004 model)
    const embedUrl = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${API_KEY}`;

    const embedResponse = await fetch(embedUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'models/text-embedding-004',
        content: {
          parts: [{ text: textToEmbed }]
        }
      })
    });

    if (!embedResponse.ok) {
      const errorText = await embedResponse.text();
      throw new Error(`Embedding API Error: ${embedResponse.status} - ${errorText}`);
    }

    const embedData = await embedResponse.json();
    const embeddingArray = embedData.embedding?.values;

    if (!embeddingArray || !Array.isArray(embeddingArray)) {
      throw new Error("Failed to extract valid embedding array from Gemini.");
    }

    // Initialize Supabase admin client to update the specific record
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Update the gig record with the semantic vector
    const { error: updateError } = await supabaseAdmin
      .from('gigs')
      .update({ embedding: embeddingArray })
      .eq('id', record.id);

    if (updateError) {
      throw new Error(`Supabase Update Error: ${updateError.message}`);
    }

    return new Response(
      JSON.stringify({ success: true, message: `Vector embedded for gig ${record.id}` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    console.error("Vectorization Error:", errorMessage);

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
