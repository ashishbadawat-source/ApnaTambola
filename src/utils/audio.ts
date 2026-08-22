/**
 * Web Audio synthesizer for Tambola sound effects + Speech Synthesis
 */
import { getTambolaCallText, VoiceLanguage } from './tambolaNicknames';

let audioCtx: AudioContext | null = null;
let preferredVoiceLang: VoiceLanguage = 'both';

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
    window.speechSynthesis.cancel();
    const activeLang = language || getCallerVoiceLanguage();
    const text = getTambolaCallText(num, activeLang);
    const utterance = new SpeechSynthesisUtterance(text);
    
    utterance.rate = 0.95;
    utterance.pitch = 1.05;
    utterance.volume = 1.0;

    const voices = window.speechSynthesis.getVoices();
    if (activeLang === 'hi') {
      utterance.lang = 'hi-IN';
      const hiVoice = voices.find(v => v.lang.includes('hi') || v.name.toLowerCase().includes('hindi') || v.lang.includes('IN'));
      if (hiVoice) utterance.voice = hiVoice;
    } else if (activeLang === 'en') {
      utterance.lang = 'en-IN';
      const enVoice = voices.find(v => v.lang.includes('en-IN') || v.lang.includes('en_US') || v.lang.includes('en-GB'));
      if (enVoice) utterance.voice = enVoice;
    } else {
      utterance.lang = 'hi-IN';
      const inVoice = voices.find(v => v.lang.includes('hi') || v.lang.includes('en-IN') || v.lang.includes('IN'));
      if (inVoice) utterance.voice = inVoice;
    }

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('Speech synthesis error', err);
  }
}
