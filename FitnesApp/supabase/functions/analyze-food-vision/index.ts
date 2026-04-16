import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const _Deno = (globalThis as any).Deno;
const POLZA_AI_KEY = _Deno.env.get("POLZA_AI_KEY") ?? "";
const POLZA_AI_URL = "https://polza.ai/api/v1/chat/completions";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (!POLZA_AI_KEY) {
    return new Response(JSON.stringify({ error: "AI key not configured" }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }

  try {
    const { image_url, base64 } = await req.json();

    if (!image_url && !base64) {
      return new Response(JSON.stringify({ error: 'Image is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload = {
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Распознай еду на этом изображении и рассчитай примерную пищевую ценность для одной порции. Ответь только в формате JSON на русском языке со следующими полями: food_name (название блюда), calories (число), protein_g (число), fat_g (число), carbs_g (число), portion_size (размер порции, строка). Если на фото несколько продуктов, объедини их в один прием пищи."
            },
            {
              type: "image_url",
              image_url: {
                url: image_url || `data:image/jpeg;base64,${base64}`
              }
            }
          ]
        }
      ],
      response_format: { type: "json_object" }
    };

    const response = await fetch(POLZA_AI_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${POLZA_AI_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message || 'Error from Polza.ai');
    }

    const result = JSON.parse(data.choices[0].message.content);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
})
