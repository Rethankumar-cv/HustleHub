const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
    // 1. Always Handle CORS Preflight First
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders, status: 200 })
    }

    try {
        const API_KEY = Deno.env.get('GEMINI_API_KEY');
        if (!API_KEY) {
            throw new Error("GEMINI_API_KEY is missing from Supabase Edge Function Secrets.");
        }

        const { gigTitle, gigDescription, clientReview } = await req.json();

        if (!gigTitle || (!gigDescription && !clientReview)) {
            return new Response(JSON.stringify({ error: "Missing required parameters" }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            });
        }

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${API_KEY}`;

        const systemPrompt = `You are Kai, an expert freelance AI assistant for HustleHub, a campus micro-gig platform. 
A student just completed a gig and received a 4+ star review. Your goal is to generate a 'Proof of Work' (Portfolio Card) entry based on the gig details and the positive review.

Return ONLY a valid JSON object matching exactly this schema, without any backticks, markdown, or extra text:
{
  "title": "A short, professional title for this portfolio piece (3-6 words)",
  "summary": "A 2-sentence professional summary highlighting the value delivered and quoting/referencing the client's positive review if applicable.",
  "skills_used": ["Skill 1", "Skill 2"] // 1-3 skills demonstrated in this gig
}`;

        const requestBody = {
            contents: [{
                parts: [{ text: `Gig Title: ${gigTitle}\nGig Description: ${gigDescription || 'N/A'}\nClient Review: ${clientReview || 'Excellent work!'}` }]
            }],
            systemInstruction: {
                parts: [{ text: systemPrompt }]
            },
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 8192,
                responseMimeType: "application/json" // Force JSON output
            }
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Gemini API Error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!generatedText) {
            throw new Error("Gemini returned an empty response.");
        }

        let jsonStr = generatedText.trim();
        if (jsonStr.startsWith('```')) {
            jsonStr = jsonStr.replace(/^```(json)?/i, '').replace(/```$/i, '').trim();
        }

        const parsedResult = JSON.parse(jsonStr);

        return new Response(
            JSON.stringify(parsedResult),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        console.error("Kai Generate PoW Error:", errorMessage);

        return new Response(
            JSON.stringify({ error: errorMessage }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
    }
})
