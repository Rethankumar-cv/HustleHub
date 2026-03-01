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
        // 2. Fetch API Key safely inside the request to catch configuration errors
        const API_KEY = Deno.env.get('GEMINI_API_KEY');
        if (!API_KEY) {
            throw new Error("GEMINI_API_KEY is missing from Supabase Edge Function Secrets.");
        }

        const { roughIdea } = await req.json();

        if (!roughIdea) {
            return new Response(JSON.stringify({ error: "Missing roughIdea parameter" }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            });
        }

        // We use gemini-3-flash-preview for the latest features
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${API_KEY}`;

        // System Prompt to coerce strictly into JSON
        const systemPrompt = `You are Kai, an expert freelance gig writer for HustleHub, a campus micro-gig platform in India.
Your goal is to take a student's rough idea and transform it into a concise, professional gig description, suggest a realistic, student-friendly budget in Indian Rupees (INR), and extract up to 4 exact skills needed.

CRITICAL INSTRUCTIONS FOR BUDGET: Do NOT default to 20 or 25. You must actually estimate the effort. Small tasks (1 hr) = 200-500. Medium tasks (2-3 hrs) = 500-1500. Large tasks = 1500+.

Return ONLY a valid JSON object matching exactly this schema, without any backticks, markdown, or extra text:
{
  "title": "A punchy, clear 4-8 word title",
  "description": "A 2-3 sentence professional description of the task requirements.",
  "suggestedBudget": 500, // Replace this with an ACTUAL estimated integer in INR based on the task effort. Do not use 20 or 25 unless it's a 2-minute task.
  "suggestedSkills": ["Skill 1", "Skill 2"] // 1-4 skills max
}`;

        const requestBody = {
            contents: [{
                parts: [{ text: `Rough Idea: ${roughIdea}` }]
            }],
            systemInstruction: {
                parts: [{ text: systemPrompt }]
            },
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 8192,
                responseMimeType: "application/json" // Force Gemini to return valid JSON
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

        // We mandated JSON format via prompt, but we add a stripping safeguard just in case
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
        console.error("Kai Enhance Error:", errorMessage);

        // Return 500 but crucially WE MUST STILL RETURN CORS HEADERS
        return new Response(
            JSON.stringify({ error: errorMessage }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
    }
})
