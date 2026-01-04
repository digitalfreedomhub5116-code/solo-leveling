// AudioContext singleton to prevent multiple contexts
let audioCtx: AudioContext | null = null;

const getContext = () => {
    if (!audioCtx) {
        // Support for standard and webkit prefix
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioCtx;
}

export const playSystemSoundEffect = (type: string) => {
    try {
        const ctx = getContext();
        // Ensure context is running (browser autoplay policy)
        if (ctx.state === 'suspended') {
            ctx.resume();
        }
        
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        // Sound profiles based on NotificationType
        switch (type) {
            case 'SUCCESS': 
                // Quest Complete: Uplifting major third chime
                osc.type = 'sine';
                osc.frequency.setValueAtTime(523.25, now); // C5
                osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
                
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
                
                osc.start(now);
                osc.stop(now + 0.4);
                break;
                
            case 'PURCHASE': 
                // Shop Buy: Retro digital coin sound
                osc.type = 'square';
                osc.frequency.setValueAtTime(1200, now);
                osc.frequency.setValueAtTime(1800, now + 0.08);
                
                gain.gain.setValueAtTime(0.05, now);
                gain.gain.linearRampToValueAtTime(0.001, now + 0.2);
                
                osc.start(now);
                osc.stop(now + 0.2);
                break;

            case 'LEVEL_UP': 
                // Level Up: Power surge sweep (Sawtooth + Sine harmony)
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(220, now);
                osc.frequency.linearRampToValueAtTime(880, now + 1.2);
                
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.linearRampToValueAtTime(0.001, now + 1.4);
                
                osc.start(now);
                osc.stop(now + 1.4);
                
                // Secondary layer for richness
                const osc2 = ctx.createOscillator();
                const gain2 = ctx.createGain();
                osc2.type = 'sine';
                osc2.connect(gain2);
                gain2.connect(ctx.destination);
                osc2.frequency.setValueAtTime(440, now);
                osc2.frequency.linearRampToValueAtTime(1760, now + 1.2);
                
                gain2.gain.setValueAtTime(0.1, now);
                gain2.gain.linearRampToValueAtTime(0.001, now + 1.4);
                
                osc2.start(now);
                osc2.stop(now + 1.4);
                break;

            case 'WARNING': 
                // Decay/Warning: Low descending buzz
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(100, now);
                osc.frequency.linearRampToValueAtTime(80, now + 0.3);
                
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.linearRampToValueAtTime(0.001, now + 0.3);
                
                osc.start(now);
                osc.stop(now + 0.3);
                break;
                
             case 'DANGER': 
                // Penalty: Harsh lower buzz
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(60, now);
                
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
                
                osc.start(now);
                osc.stop(now + 0.5);
                break;

            case 'SYSTEM':
            default: 
                // Generic: Short high-tech blip
                osc.type = 'sine';
                osc.frequency.setValueAtTime(800, now);
                
                gain.gain.setValueAtTime(0.03, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
                
                osc.start(now);
                osc.stop(now + 0.1);
                break;
        }

    } catch (e) {
        console.error("Audio Playback Error", e);
    }
};