
import { GoogleGenAI, Type } from "@google/genai";
import { CoreStats, Rank, Priority, HealthProfile } from "../types";
import { supabase } from "../lib/supabase";

// Initialize Client-Side Fallback
// NOTE: In production, this key should only be used by the Edge Function.
// We keep it here for local testing/fallback if the function fails.
const clientAI = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface QuestAnalysis {
    rank: Rank;
    xp: number;
    reasoning: string;
    isSpam: boolean;
    category: keyof CoreStats;
    estimatedDuration: number;
    suggestedTime?: string;
}

interface VerificationResult {
    verdict: 'APPROVED' | 'REJECTED';
    confidence: number;
    analysis: string;
}

// --- HYBRID EXECUTOR ---
// Tries Edge Function first, falls back to Client SDK
async function executeForgeGuard(action: 'ANALYZE_QUEST' | 'VERIFY_PROOF', payload: any): Promise<any> {
    try {
        console.log(`🛡️ ForgeGuard: Invoking ${action} via Edge Function...`);
        const { data, error } = await supabase.functions.invoke('forge-guard', {
            body: { action, payload }
        });

        if (error) throw error;
        if (!data) throw new Error("No data returned from Edge Function");
        
        console.log("🛡️ ForgeGuard: Edge Function Success", data);
        return data;

    } catch (edgeError) {
        console.warn("⚠️ ForgeGuard Edge Function Failed (Using Local Fallback):", edgeError);
        return executeLocalFallback(action, payload);
    }
}

// --- LOCAL FALLBACK LOGIC ---
async function executeLocalFallback(action: string, payload: any) {
    if (action === 'ANALYZE_QUEST') {
        const { title, userStats, userProfile, context } = payload;
        const prompt = `
        You are ForgeGuard, an impartial AI Judge.
        User Stats: ${JSON.stringify(userStats)}
        Activity Level: ${userProfile?.activityLevel || 'MODERATE'}
        Task: "${title}"
        Context: ${JSON.stringify(context)}
        
        Analyze difficulty. 
        If vague/nonsense, isSpam=true.
        Assign Rank (E-S), XP (10-500), Category.
        Estimate duration (mins).
        `;

        const response = await clientAI.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        rank: { type: Type.STRING, enum: ["E", "D", "C", "B", "A", "S"] },
                        xp: { type: Type.NUMBER },
                        reasoning: { type: Type.STRING },
                        isSpam: { type: Type.BOOLEAN },
                        category: { type: Type.STRING, enum: ["strength", "intelligence", "focus", "social", "willpower", "discipline"] },
                        estimatedDuration: { type: Type.NUMBER },
                        suggestedTime: { type: Type.STRING, nullable: true }
                    }
                }
            }
        });
        return JSON.parse(response.text || "{}");
    }

    if (action === 'VERIFY_PROOF') {
        const { imageBase64, reason } = payload;
        
        // Strip header if present for Gemini API (it handles base64 directly in inlineData)
        const cleanBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;

        const response = await clientAI.models.generateContent({
            model: "gemini-2.5-flash-image", // Multimodal model
            contents: [
                {
                    parts: [
                        { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } },
                        { text: `Verify this image supports the claim: "${reason}". Return JSON with verdict (APPROVED/REJECTED) and analysis.` }
                    ]
                }
            ],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        verdict: { type: Type.STRING, enum: ["APPROVED", "REJECTED"] },
                        confidence: { type: Type.NUMBER },
                        analysis: { type: Type.STRING }
                    }
                }
            }
        });
        return JSON.parse(response.text || "{}");
    }
}

// --- EXPORTED FUNCTIONS ---

export const analyzeQuest = async (
    title: string, 
    userProfile: HealthProfile,
    userStats: CoreStats,
    context?: any
): Promise<QuestAnalysis> => {
    return executeForgeGuard('ANALYZE_QUEST', { title, userProfile, userStats, context });
};

export const verifyProof = async (
    imageBase64: string,
    reason: string,
    context?: string
): Promise<VerificationResult> => {
    return executeForgeGuard('VERIFY_PROOF', { imageBase64, reason, context });
};
