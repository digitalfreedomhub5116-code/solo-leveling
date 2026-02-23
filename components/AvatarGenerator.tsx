
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, RefreshCw, CheckCircle, ScanFace, Upload, ShieldCheck, AlertTriangle, Info } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface AvatarGeneratorProps {
  onComplete: (avatarUrl: string, originalUrl: string) => void;
}

// Critical Assets to Preload for Dashboard
const DASHBOARD_ASSETS = [
  "https://res.cloudinary.com/dcnqnbvp0/video/upload/f_auto,q_auto,w_600/v1770828792/Animate_the_blue_202602112220_fete1_dsjvdd.mp4", // Dusk Widget
  "https://res.cloudinary.com/dcnqnbvp0/video/upload/v1771008540/Untitled_video_-_Made_with_Clipchamp_21_ehz8d1.mp4", // Daily Chest
  "https://res.cloudinary.com/dcnqnbvp0/video/upload/v1771014509/tdthgf_-_Made_with_Clipchamp_2_qf8zyy.mp4",       // Legendary Chest
  "https://res.cloudinary.com/dcnqnbvp0/video/upload/v1771015223/The_chest_should_202602140208_znzx6_1_mya5vc.mp4"  // Alliance Chest
];

// --- IMAGE COMPRESSION UTILITY ---
const compressImage = (base64Str: string, maxWidth = 300, quality = 0.7): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ratio = maxWidth / img.width;
      // If image is already smaller, keep original dimensions
      const width = ratio < 1 ? maxWidth : img.width;
      const height = ratio < 1 ? img.height * ratio : img.height;
      
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
          // Better quality smoothing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
      } else {
          resolve(base64Str); // Fallback
      }
    };
    img.onerror = () => {
        resolve(base64Str); // Fallback
    };
  });
};

const AvatarGenerator: React.FC<AvatarGeneratorProps> = ({ onComplete }) => {
  const [image, setImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [status, setStatus] = useState<'IDLE' | 'GENERATING' | 'COMPLETE' | 'SAVING'>('IDLE');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- BACKGROUND PRELOADER ---
  useEffect(() => {
      // Trigger preload as soon as component mounts or when status changes to GENERATING
      if (status === 'GENERATING') {
          console.log("System: Pre-caching Dashboard Assets...");
          DASHBOARD_ASSETS.forEach(url => {
              const video = document.createElement('video');
              video.src = url;
              video.preload = 'auto';
              video.muted = true;
              video.load(); // Force browser to buffer
          });
      }
  }, [status]);

  // --- IMAGE PROCESSING ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Simple initial resize on upload if huge
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!image) return;
    setStatus('GENERATING');
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      // Compress the input selfie slightly to save bandwidth sending to API
      const compressedInput = await compressImage(image, 512, 0.8);
      const base64Data = compressedInput.split(',')[1]; 

      // Prompt tuned for strict cartoonification
      const prompt = `High-fidelity 3D stylized character render of the subject from the provided reference image, transformed into a futuristic 3D anime avatar to completely mask photorealistic identity. The character features large, expressive eyes reflecting neon city lights, smooth porcelain-like skin, and exaggerated, volumized hair consistent with high-end animation styles. The aesthetic is pure Cyberpunk: heavy contrast, moody atmosphere, and slight futuristic tech-wear styling on the clothing. Lighting is a dramatic dual-tone setup: intense electric pink rim lighting hitting one side of the face, contrasting with a deep cyan ambient glow on the other. The background is a dark, bokeh-blurred night cityscape with glowing neon signs and rain-slicked textures. Ultra-sharp focus, cinematic 3D rendering, glowing skin accents, chromatic aberration, ray-tracing, 8k resolution, vibrant neon palette.`;

      // Use gemini-2.5-flash-image for image editing/generation based on reference
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: [
          {
            parts: [
              { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
              { text: prompt }
            ]
          }
        ],
      });

      // Extract image from response
      const candidate = response.candidates?.[0];
      const part = candidate?.content?.parts?.find(p => p.inlineData);
      
      if (part && part.inlineData && part.inlineData.data) {
          const rawBase64 = `data:image/png;base64,${part.inlineData.data}`;
          
          // COMPRESS GENERATED IMAGE TO FIT LOCALSTORAGE
          // Reduce to 300px width and 70% quality JPEG
          const optimizedBase64 = await compressImage(rawBase64, 300, 0.7);
          
          setGeneratedImage(optimizedBase64);
          setStatus('COMPLETE');
      } else {
          throw new Error("The System failed to construct your avatar. Ensure the image is clear.");
      }

    } catch (err: any) {
      console.error("Avatar Gen Error:", err);
      setError(err.message || "Generation Failed. Check API Key or Quota.");
      setStatus('IDLE');
    }
  };

  const handleConfirm = async () => {
      if (generatedImage && image) {
          setStatus('SAVING');
          
          // Compress the original selfie too, as we store it for ForgeGuard checks
          const optimizedOriginal = await compressImage(image, 300, 0.6);

          setTimeout(() => {
              onComplete(generatedImage, optimizedOriginal);
          }, 500);
      }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black flex items-center justify-center p-6 font-mono overflow-hidden">
      {/* Glitch Background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,210,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,210,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: [0.1, 0.3, 0.1] }} 
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute inset-0 bg-system-neon/5 pointer-events-none"
      />

      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-4xl bg-[#0a0a0a] border border-system-border rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col relative z-10"
      >
        <div className="p-6 border-b border-gray-800 bg-gray-900/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <ScanFace size={24} className="text-system-neon animate-pulse" />
                <div>
                    <h2 className="text-xl font-black text-white uppercase tracking-tighter">Avatar Synthesis</h2>
                    <p className="text-[10px] text-gray-500 tracking-[0.2em] uppercase">Phase 1: Identity Masking</p>
                </div>
            </div>
            {status === 'GENERATING' && (
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-system-neon font-bold animate-pulse">PRELOADING WORLD...</span>
                    <RefreshCw className="animate-spin text-system-neon" size={20} />
                </div>
            )}
        </div>

        <div className="p-8 flex flex-col md:flex-row gap-8 items-center justify-center min-h-[400px]">
            
            {/* LEFT: ORIGINAL */}
            <div className="flex flex-col items-center gap-4 text-center">
                <div className="relative w-48 h-48 md:w-64 md:h-64 rounded-full border-2 border-dashed border-gray-700 flex items-center justify-center bg-black overflow-hidden group hover:border-system-neon/50 transition-colors">
                    {image ? (
                        <img src={image} alt="Selfie" className="w-full h-full object-cover opacity-50 grayscale" />
                    ) : (
                        <div className="flex flex-col items-center justify-center p-6 text-center">
                            <Camera size={40} className="mx-auto mb-3 opacity-50 text-gray-500" />
                            <span className="text-[10px] uppercase tracking-widest text-white font-bold mb-2">Upload Clear Selfie</span>
                            <p className="text-[8px] text-gray-500 leading-relaxed max-w-[140px]">
                                For optimal avatar synthesis, ensure your face is clearly visible, well-lit, and facing forward. Avoid filters or obstruction.
                            </p>
                        </div>
                    )}
                    
                    {/* Overlay for re-upload */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        <Upload size={24} className="text-white" />
                    </div>
                </div>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleFileUpload} 
                />
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[10px] text-gray-500 hover:text-white uppercase tracking-widest font-bold border-b border-transparent hover:border-white transition-all"
                >
                    {image ? "Change Source" : "Select Photo / Take Selfie"}
                </button>
            </div>

            {/* CENTER: PROCESSOR */}
            <div className="flex flex-col items-center justify-center">
                <div className={`h-px w-16 md:w-32 bg-gray-800 my-4 md:my-0 md:rotate-90 transition-colors ${status === 'GENERATING' ? 'bg-system-neon shadow-[0_0_10px_#00d2ff]' : ''}`} />
                <button
                    onClick={handleGenerate}
                    disabled={!image || status === 'GENERATING' || status === 'SAVING'}
                    className={`
                        w-12 h-12 rounded-full flex items-center justify-center border transition-all
                        ${status === 'COMPLETE' || status === 'SAVING'
                            ? 'bg-system-success border-system-success text-black' 
                            : status === 'GENERATING' 
                                ? 'bg-system-neon border-system-neon text-black animate-pulse'
                                : image ? 'bg-white text-black border-white hover:scale-110' : 'bg-gray-900 border-gray-800 text-gray-600 cursor-not-allowed'
                        }
                    `}
                >
                    {(status === 'COMPLETE' || status === 'SAVING') ? <CheckCircle size={24} /> : <RefreshCw size={20} className={status === 'GENERATING' ? 'animate-spin' : ''} />}
                </button>
            </div>

            {/* RIGHT: GENERATED */}
            <div className="flex flex-col items-center gap-4">
                <div className={`
                    relative w-48 h-48 md:w-64 md:h-64 rounded-full border-2 flex items-center justify-center bg-black overflow-hidden shadow-2xl
                    ${generatedImage ? 'border-system-neon shadow-[0_0_30px_rgba(0,210,255,0.3)]' : 'border-gray-800'}
                `}>
                    {generatedImage ? (
                        <>
                            <img src={generatedImage} alt="Avatar" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-system-neon/20 to-transparent pointer-events-none mix-blend-overlay" />
                        </>
                    ) : (
                        <div className="text-center text-gray-700 animate-pulse">
                            <ScanFace size={40} className="mx-auto mb-2 opacity-30" />
                            <span className="text-[10px] uppercase tracking-widest">Awaiting Synthesis</span>
                        </div>
                    )}
                </div>
                <div className="text-[10px] text-system-neon font-bold uppercase tracking-widest">
                    {generatedImage ? "Hunter Avatar" : "Target Output"}
                </div>
            </div>

        </div>

        {error && (
            <div className="px-8 pb-4">
                <div className="bg-red-900/20 border border-red-500/50 p-3 rounded flex items-center gap-3 text-red-400 text-xs font-mono">
                    <AlertTriangle size={16} />
                    {error}
                </div>
            </div>
        )}

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-800 bg-black/50 flex justify-between items-center">
            <div className="hidden md:flex items-center gap-2 text-[10px] text-gray-500">
                <Info size={12} />
                <span>The System generates a stylized Shadow Avatar to protect your identity.</span>
            </div>

            <button 
                onClick={handleConfirm}
                disabled={!generatedImage || status === 'SAVING'}
                className={`
                    px-8 py-3 rounded-lg font-black uppercase tracking-widest text-xs flex items-center gap-2 transition-all ml-auto
                    ${generatedImage 
                        ? 'bg-system-neon text-black hover:bg-white shadow-[0_0_20px_rgba(0,210,255,0.4)]' 
                        : 'bg-gray-900 text-gray-600 cursor-not-allowed'
                    }
                `}
            >
                {status === 'SAVING' ? <RefreshCw className="animate-spin" size={16} /> : <ShieldCheck size={16} />}
                {status === 'SAVING' ? "INTEGRATING..." : "INTEGRATE PROFILE"}
            </button>
        </div>

      </motion.div>
    </div>
  );
};

export default AvatarGenerator;
