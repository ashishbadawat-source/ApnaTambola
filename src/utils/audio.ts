/**
 * Web Audio synthesizer for Tambola sound effects + Speech Synthesis
 */
import { getTambolaCallText, VoiceLanguage } from './tambolaNicknames';

let audioCtx: AudioContext | null = null;
let preferredVoiceLang: VoiceLanguage = 'both';
let cachedVoices: SpeechSynthesisVoice[] = [];

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  const loadVoices = () => {
    try {
      cachedVoices = window.speechSynthesis.getVoices();
    } catch {}
  };
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;

  // Auto-unlock audio and speech on user interaction
  const unlockAudio = () => {
    getAudioContext();
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.resume();
        loadVoices();
      } catch {}
    }
  };
  window.addEventListener('click', unlockAudio, { passive: true });
  window.addEventListener('touchstart', unlockAudio, { passive: true });
}

export function setCallerVoiceLanguage(lang: VoiceLanguage): void {
  preferredVoiceLang = lang;
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('tambola_voice_lang', lang);
  }
}

export function getCallerVoiceLanguage(): VoiceLanguage {
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem('tambola_voice_lang') as VoiceLanguage;
    if (saved && (saved === 'en' || saved === 'hi' || saved === 'both')) {
      preferredVoiceLang = saved;
    }
  }
  return preferredVoiceLang;
}

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioCtxClass) {
      audioCtx = new AudioCtxClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function playNumberCallSound(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Pleasant high-pitch bingo bell ping
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.6);

    // Second harmonic sparkle
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1174.66, now + 0.05); // D6
    gain2.gain.setValueAtTime(0.15, now + 0.05);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.05);
    osc2.stop(now + 0.5);
  } catch (err) {
    console.warn('Audio play error', err);
  }
}

export function playDabSound(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.08); // E5

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  } catch {}
}

export function playWinningFanfare(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      const noteTime = now + i * 0.12;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.25, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 0.4);
    });
  } catch {}
}

export function playTicketPurchaseSound(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(329.63, now); // E4
    osc.frequency.exponentialRampToValueAtTime(493.88, now + 0.1); // B4
    osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.2); // E5

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  } catch {}
}

/**
 * Speech synthesis for caller (Supports English, Hindi, and Bilingual)
 */
export function speakNumberCall(
  num: number,
  enabled: boolean = true,
  language?: VoiceLanguage
): void {
  if (!enabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    const synth = window.speechSynthesis;
    if (synth.speaking || synth.pending) {
      synth.cancel();
    }
    if (synth.paused) {
      synth.resume();
    }

    const activeLang = language || getCallerVoiceLanguage() || 'both';
    const text = getTambolaCallText(num, activeLang);
    const utterance = new SpeechSynthesisUtterance(text);
    
    utterance.rate = 0.92;
    utterance.pitch = 1.02;
    utterance.volume = 1.0;

    const voices = (cachedVoices && cachedVoices.length > 0) ? cachedVoices : synth.getVoices();
    if (activeLang === 'hi') {
      utterance.lang = 'hi-IN';
      const hiVoice = voices.find(
        (v) =>
          v.lang.startsWith('hi') ||
          v.name.toLowerCase().includes('hindi') ||
          v.name.toLowerCase().includes('lekha') ||
          v.name.toLowerCase().includes('kalpana')
      );
      if (hiVoice) utterance.voice = hiVoice;
    } else if (activeLang === 'en') {
      utterance.lang = 'en-IN';
      const enVoice = voices.find(
        (v) =>
          v.lang.includes('en-IN') ||
          v.name.toLowerCase().includes('india') ||
          v.lang.includes('en_US') ||
          v.lang.includes('en-GB')
      );
      if (enVoice) utterance.voice = enVoice;
    } else {
      // Bilingual (Default)
      utterance.lang = 'hi-IN';
      const inVoice = voices.find(
        (v) =>
          v.lang.startsWith('hi') ||
          v.name.toLowerCase().includes('hindi') ||
          v.lang.includes('en-IN') ||
          v.name.toLowerCase().includes('india')
      );
      if (inVoice) utterance.voice = inVoice;
    }

    // Small timeout ensures cancel doesn't abort the newly queued speak in Blink/WebKit
    setTimeout(() => {
      try {
        if (synth.paused) {
          synth.resume();
        }
        synth.speak(utterance);
      } catch (e) {
        console.warn('Speech error on speak call', e);
      }
    }, 40);
  } catch (err) {
    console.warn('Speech synthesis error', err);
  }
}

/**
 * Pleasant alert chime when a new user registers or a new ID is synced
 */
export function playUserRegisteredSound(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Upward 3-note chime: C5 -> E5 -> G5
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((freq, i) => {
      const noteTime = now + i * 0.1;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.01, noteTime);
      gain.gain.linearRampToValueAtTime(0.2, noteTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 0.35);
    });
  } catch {}
}

/**
 * Voice announcement for winners and co-winners in Hindi/Bilingual
 */
export function speakWinnerAnnouncement(
  winnerNames: string[],
  prizeName: string,
  amountEach: number,
  enabled: boolean = true
): void {
  if (!enabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    const synth = window.speechSynthesis;
    if (synth.paused) synth.resume();
    let text = '';
    const isSplit = winnerNames.length > 1;
    if (isSplit) {
      text = `बधाई हो! ${prizeName} के 2 विजेता हैं: ${winnerNames.join(' और ')}! दोनों को बराबर ${amountEach} रुपए मिले हैं! Congratulations to both winners!`;
    } else {
      text = `बधाई हो! ${winnerNames[0]} ने ${prizeName} जीत लिया है! Congratulations!`;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.volume = 1.0;
    utterance.lang = 'hi-IN';
    setTimeout(() => {
      try {
        synth.speak(utterance);
      } catch (e) {}
    }, 700);
  } catch (e) {}
}

