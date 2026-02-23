
// Follow this setup guide to deploy: https://supabase.com/docs/guides/functions
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3"

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, payload } = await req.json()
    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) throw new Error('Missing GEMINI_API_KEY')

    const genAI = new GoogleGenerativeAI(apiKey)

    // --- 1. QUEST ANALYSIS ---
    if (action === 'ANALYZE_QUEST') {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
      
      const prompt = `
        Role: ForgeGuard AI (Gamified Life System Judge).
        Task: Analyze user quest difficulty.
        User Stats: ${JSON.stringify(payload.userStats)}
        Quest Title: "${payload.title}"
        
        Output JSON:
        {
          "rank": "E" | "D" | "C" | "B" | "A" | "S",
          "xp": number (10-500),
          "category": "strength" | "intelligence" | "focus" | "social" | "willpower" | "discipline",
          "reasoning": "Brief explanation",
          "estimatedDuration": number (minutes),
          "isSpam": boolean
        }
      `
      
      const result = await model.generateContent(prompt)
      const response = await result.response
      const text = response.text()
      
      // Extract JSON from markdown code block if present
      const jsonStr = text.replace(/```json\n|\n```/g, "").trim()
      
      return new Response(jsonStr, {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // --- 2. TICKET/IMAGE VERIFICATION ---
    if (action === 'VERIFY_PROOF') {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
      
      const { imageBase64, reason, context } = payload
      
      const prompt = `
        Role: ForgeGuard AI (Anti-Cheat System).
        Task: Verify if the image provides proof for the user's claim.
        User Claim/Reason: "${reason}"
        Context: ${context || "General Appeal"}
        
        Instructions:
        1. Analyze the image. Does it look like a valid proof photo (e.g. gym selfie, completed work, screen log)?
        2. If image is black, blurry, irrelevant (e.g. a cat), or clearly fake, REJECT.
        3. If image plausibly supports the claim, APPROVE.
        
        Output JSON:
        {
          "verdict": "APPROVED" | "REJECTED",
          "confidence": number (0-100),
          "analysis": "Brief analysis of the image content vs the claim."
        }
      `
      
      // Convert base64 to part
      const imagePart = {
        inlineData: {
          data: imageBase64,
          mimeType: "image/jpeg"
        }
      }

      const result = await model.generateContent([prompt, imagePart])
      const response = await result.response
      const text = response.text()
      
      const jsonStr = text.replace(/```json\n|\n```/g, "").trim()

      return new Response(jsonStr, {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    throw new Error(`Unknown action: ${action}`)

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
