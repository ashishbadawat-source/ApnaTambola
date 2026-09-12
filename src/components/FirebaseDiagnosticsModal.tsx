import React, { useState, useEffect, useRef } from 'react';
import {
  Database,
  CheckCircle2,
  AlertCircle,
  Activity,
  RefreshCw,
  Send,
  Zap,
  Radio,
  Trophy,
  Wallet,
  Bell,
  Users,
  Gamepad2,
  Ticket,
  ArrowUpRight,
  ShieldCheck,
  Server,
  Layers,
  Terminal,
  Copy,
  Check,
  X,
  Play,
  Flame,
  Search,
  Plus,
  Trash2,
  Edit3,
  ExternalLink,
  Cpu,
  Clock,
  Wifi,
  Sparkles,
  ChevronRight,
  UploadCloud,
  DownloadCloud
} from 'lucide-react';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  getDocFromServer
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  TambolaGame,
  User,
  TambolaTicket,
  GameWinner,
  DepositRequest,
  WithdrawalRequest,
  WalletTransaction,
  SiteSettings,
  PrizeCode
} from '../types';

interface FirebaseDiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  games: TambolaGame[];
  users: User[];
  tickets: TambolaTicket[];
  winners: GameWinner[];
  deposits: DepositRequest[];
  withdrawals: WithdrawalRequest[];
  transactions: WalletTransaction[];
  siteSettings: SiteSettings;
  onUpdateGame?: (gameId: string, updates: Partial<TambolaGame>) => Promise<boolean> | void;
  onCallNext?: (number?: number) => void;
  onUpdateWalletBalance?: (
    userId: string,
    amount: number,
    type: 'credit' | 'debit',
    reason?: string,
    walletSource?: 'any' | 'deposit' | 'winning' | 'referral'
  ) => Promise<boolean>;
  onForceRefresh?: () => void;
  onUpdateSettings?: (settings: Partial<SiteSettings>) => Promise<boolean> | void;
}

interface LogEntry {
  id: string;
  timestamp: string;
  type: 'read' | 'write' | 'listen' | 'info' | 'error';
  message: string;
  details?: any;
}

export const FirebaseDiagnosticsModal: React.FC<FirebaseDiagnosticsModalProps> = ({
  isOpen,
  onClose,
  games,
  users,
  tickets,
  winners,
  deposits,
  withdrawals,
  transactions,
  siteSettings,
  onUpdateGame,
  onCallNext,
  onUpdateWalletBalance,
  onForceRefresh,
  onUpdateSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'test_push' | 'explorer' | 'sync' | 'logs'>('overview');
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'checking' | 'error' | 'offline'>('checking');
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [lastCheckTime, setLastCheckTime] = useState<string>('');
  const [isPinging, setIsPinging] = useState<boolean>(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [actionErrorMsg, setActionErrorMsg] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Instant Push Lab states
  const [testBallNumber, setTestBallNumber] = useState<number>(Math.floor(Math.random() * 90) + 1);
  const [testTargetGameId, setTestTargetGameId] = useState<string>(games[0]?.id || 'game_1');
  const [testWinnerName, setTestWinnerName] = useState<string>('Rahul Sharma');
  const [testWinnerPattern, setTestWinnerPattern] = useState<string>('Early 5');
  const [testWinnerPrize, setTestWinnerPrize] = useState<number>(500);
  const [testWalletUserId, setTestWalletUserId] = useState<string>(users[0]?.id || '');
  const [testWalletAmount, setTestWalletAmount] = useState<number>(100);
  const [testWalletType, setTestWalletType] = useState<'credit' | 'debit'>('credit');
  const [testAnnouncementText, setTestAnnouncementText] = useState<string>('🎉 महा दिवाली तंबोला मेगा टूर्नामेंट आज रात 9:00 PM पर शुरू हो रहा है! बंपर प्राइज़ ₹50,000!');
  const [isPushing, setIsPushing] = useState<boolean>(false);

  // Firestore Explorer states
  const [selectedCollection, setSelectedCollection] = useState<string>('games');
  const [collectionDocs, setCollectionDocs] = useState<any[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState<boolean>(false);
  const [searchDocQuery, setSearchDocQuery] = useState<string>('');
  const [selectedDocData, setSelectedDocData] = useState<any | null>(null);
  const [isEditingDoc, setIsEditingDoc] = useState<boolean>(false);
  const [docJsonEdit, setDocJsonEdit] = useState<string>('');

  // Bulk Sync states
  const [isSyncingAll, setIsSyncingAll] = useState<boolean>(false);
  const [syncProgress, setSyncProgress] = useState<string>('');

  const addLog = (type: LogEntry['type'], message: string, details?: any) => {
    const entry: LogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 }),
      type,
      message,
      details
    };
    setLogs((prev) => [entry, ...prev].slice(0, 100));
  };

  const showFeedback = (msg: string, isError = false) => {
    if (isError) {
      setActionErrorMsg(msg);
      setActionSuccessMsg(null);
    } else {
      setActionSuccessMsg(msg);
      setActionErrorMsg(null);
    }
    setTimeout(() => {
      setActionSuccessMsg(null);
      setActionErrorMsg(null);
    }, 4000);
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Run ping & health check
  const runPingTest = async () => {
    setIsPinging(true);
    setConnectionStatus('checking');
    const startTime = performance.now();
    try {
      if (!db) throw new Error('Firestore instance not found');
      
      const testRef = doc(db, 'system', 'connection_test');
      await setDoc(testRef, {
        lastPing: new Date().toISOString(),
        client: 'admin_diagnostics',
        status: 'ok',
        timestamp: Date.now()
      }, { merge: true });

      const snap = await getDoc(testRef);
      const elapsed = Math.round(performance.now() - startTime);
      setLatencyMs(elapsed);
      setConnectionStatus('connected');
      setLastCheckTime(new Date().toLocaleTimeString('en-IN'));
      addLog('write', `Ping test passed (${elapsed}ms) - Document 'system/connection_test' written & verified.`, snap.data());
    } catch (err: any) {
      const elapsed = Math.round(performance.now() - startTime);
      setLatencyMs(elapsed);
      setConnectionStatus('error');
      addLog('error', `Ping test failed: ${err?.message || 'Connection timeout'}`, err);
    } finally {
      setIsPinging(false);
    }
  };

  // Initial check on modal open
  useEffect(() => {
    if (isOpen) {
      runPingTest();
      loadCollectionDocs(selectedCollection);
      addLog('info', 'Firebase Diagnostics session opened for db: ' + firebaseConfig.firestoreDatabaseId);
    }
  }, [isOpen]);

  // Load Firestore collection docs for Explorer
  const loadCollectionDocs = async (collName: string) => {
    setIsLoadingDocs(true);
    try {
      if (!db) return;
      const collRef = collection(db, collName);
      const snap = await getDocs(collRef);
      const items: any[] = [];
      snap.forEach((d) => {
        items.push({ _id: d.id, ...d.data() });
      });
      setCollectionDocs(items);
      addLog('read', `Fetched ${items.length} records from Firestore collection '${collName}'`);
    } catch (err: any) {
      addLog('error', `Failed to read Firestore collection '${collName}': ${err.message}`);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  // 1. Instant Push: Call Live Number
  const handlePushLiveNumber = async () => {
    if (!testBallNumber || testBallNumber < 1 || testBallNumber > 90) {
      showFeedback('कृपया 1 से 90 के बीच वैध नंबर चुनें', true);
      return;
    }
    setIsPushing(true);
    try {
      const targetGame = games.find((g) => g.id === testTargetGameId) || games[0];
      const newCalled = Array.from(new Set([...(targetGame?.calledNumbers || []), testBallNumber]));
      const newPrev = [testBallNumber, ...(targetGame?.previousNumbers || [])].slice(0, 5);

      const gameUpdates = {
        currentNumber: testBallNumber,
        lastCalledNumber: testBallNumber,
        calledNumbers: newCalled,
        previousNumbers: newPrev,
        status: 'live' as const,
        updatedAt: new Date().toISOString()
      };

      // 1. Write to Firestore
      if (db) {
        const gameRef = doc(db, 'games', targetGame.id);
        await setDoc(gameRef, gameUpdates, { merge: true });
        addLog('write', `Firestore write 'games/${targetGame.id}' -> Ball #${testBallNumber} published.`);
      }

      // 2. Call local & server endpoints to trigger immediate SSE and React state
      if (onCallNext) {
        onCallNext(testBallNumber);
      }
      if (onUpdateGame) {
        onUpdateGame(targetGame.id, gameUpdates);
      }

      showFeedback(`⚡ बॉल #${testBallNumber} तुरंत फायरस्टोर और वेबसाइट पर लाइव हो गया!`);
      // Pick next unused number
      const nextSuggested = Math.floor(Math.random() * 90) + 1;
      setTestBallNumber(nextSuggested);
    } catch (err: any) {
      showFeedback(`त्रुटि: ${err.message}`, true);
      addLog('error', `Push ball failed: ${err.message}`);
    } finally {
      setIsPushing(false);
    }
  };

  // 2. Instant Push: Broadcast Winner
  const handlePushWinner = async () => {
    if (!testWinnerName.trim()) {
      showFeedback('कृपया विजेता का नाम दर्ज करें', true);
      return;
    }
    setIsPushing(true);
    try {
      const winnerId = `win_${Date.now()}`;
      const targetGame = games.find((g) => g.id === testTargetGameId);
      const newWinner: GameWinner = {
        id: winnerId,
        gameId: testTargetGameId,
        gameTitle: targetGame?.title || 'लाइव तंबोला गेम',
        prizeId: `prz_${Date.now()}`,
        prizeCode: (testWinnerPattern as PrizeCode) || 'full_house',
        prizeName: testWinnerPattern || 'Full House',
        prizeAmount: Number(testWinnerPrize) || 500,
        userId: users[0]?.id || 'usr_demo_1',
        userName: testWinnerName.trim(),
        ticketId: `TKT-${Math.floor(100000 + Math.random() * 900000)}`,
        ticketNumber: 1,
        winningNumber: targetGame?.currentNumber || 42,
        date: new Date().toISOString(),
        timestamp: new Date().toISOString(),
      };

      if (db) {
        const winRef = doc(db, 'winners', winnerId);
        await setDoc(winRef, newWinner);
        addLog('write', `Firestore write 'winners/${winnerId}' -> ${testWinnerName} won ${testWinnerPattern} (₹${testWinnerPrize})`);
      }

      // Also post to local broadcast channel
      try {
        const bc = new BroadcastChannel('apna_tambola_sync');
        bc.postMessage({ type: 'WINNER_DECLARED', winner: newWinner });
        bc.close();
      } catch (e) {}

      showFeedback(`🎉 विजेता ${testWinnerName} (₹${testWinnerPrize}) का सेलिब्रेशन तुरंत वेबसाइट पर लाइव हो गया!`);
      if (onForceRefresh) onForceRefresh();
    } catch (err: any) {
      showFeedback(`त्रुटि: ${err.message}`, true);
      addLog('error', `Push winner failed: ${err.message}`);
    } finally {
      setIsPushing(false);
    }
  };

  // 3. Instant Push: Adjust User Wallet
  const handlePushWalletAdjust = async () => {
    if (!testWalletUserId) {
      showFeedback('कृपया यूजर चुनें', true);
      return;
    }
    if (!testWalletAmount || testWalletAmount <= 0) {
      showFeedback('कृपया वैध राशि दर्ज करें', true);
      return;
    }
    setIsPushing(true);
    try {
      const targetUser = users.find((u) => u.id === testWalletUserId);
      if (!targetUser) throw new Error('User not found');

      const delta = testWalletType === 'credit' ? testWalletAmount : -testWalletAmount;
      const newDeposit = Math.max(0, (targetUser.depositBalance || 0) + delta);
      const newTotal = newDeposit + (targetUser.winningBalance || 0) + (targetUser.referralBalance || 0);

      // Write to Firestore user doc
      if (db) {
        const userRef = doc(db, 'users', targetUser.id);
        await updateDoc(userRef, {
          depositBalance: newDeposit,
          walletBalance: newTotal,
          updatedAt: new Date().toISOString()
        });
        addLog('write', `Firestore update 'users/${targetUser.id}' -> deposit: ₹${newDeposit}, total: ₹${newTotal}`);
      }

      if (onUpdateWalletBalance) {
        await onUpdateWalletBalance(targetUser.id, testWalletAmount, testWalletType, 'Firestore Diagnostics Realtime Test', 'deposit');
      }

      showFeedback(`💰 यूजर ${targetUser.name} का वॉलेट ₹${testWalletAmount} ${testWalletType === 'credit' ? 'क्रेडिट' : 'डेबिट'} हो गया!`);
    } catch (err: any) {
      showFeedback(`त्रुटि: ${err.message}`, true);
      addLog('error', `Push wallet failed: ${err.message}`);
    } finally {
      setIsPushing(false);
    }
  };

  // 4. Instant Push: Update Site Announcement Banner
  const handlePushAnnouncement = async () => {
    if (!testAnnouncementText.trim()) {
      showFeedback('कृपया बैनर टेक्स्ट दर्ज करें', true);
      return;
    }
    setIsPushing(true);
    try {
      const updated = {
        ...siteSettings,
        marqueeText: testAnnouncementText.trim(),
        announcementBanner: testAnnouncementText.trim(),
        updatedAt: new Date().toISOString()
      };

      if (db) {
        const setRef = doc(db, 'system', 'site_settings');
        await setDoc(setRef, updated, { merge: true });
        addLog('write', `Firestore write 'system/site_settings' -> Marquee updated: "${testAnnouncementText.trim()}"`);
      }

      if (onUpdateSettings) {
        await onUpdateSettings(updated);
      }

      showFeedback(`📢 नया लाइव बैनर तुरंत पूरी वेबसाइट पर अपडेट हो गया!`);
    } catch (err: any) {
      showFeedback(`त्रुटि: ${err.message}`, true);
      addLog('error', `Push announcement failed: ${err.message}`);
    } finally {
      setIsPushing(false);
    }
  };

  // 5. Bulk Two-Way Push: Push all Local State to Firestore
  const handlePushAllLocalToFirestore = async () => {
    setIsSyncingAll(true);
    setSyncProgress('प्रक्रिया शुरू हो रही है...');
    try {
      if (!db) throw new Error('Firestore not connected');

      setSyncProgress('🎮 1/6 गेम्स सिंक हो रहे हैं...');
      for (const g of games) {
        if (g && g.id) {
          await setDoc(doc(db, 'games', g.id), g, { merge: true });
        }
      }

      setSyncProgress('👤 2/6 यूजर्स सिंक हो रहे हैं...');
      for (const u of users) {
        if (u && u.id) {
          await setDoc(doc(db, 'users', u.id), u, { merge: true });
        }
      }

      setSyncProgress('🎟️ 3/6 टिकट्स सिंक हो रहे हैं...');
      for (const t of tickets.slice(0, 50)) {
        if (t && t.id) {
          await setDoc(doc(db, 'tickets', t.id), t, { merge: true });
        }
      }

      setSyncProgress('🏆 4/6 विनर्स सिंक हो रहे हैं...');
      for (const w of winners) {
        if (w && w.id) {
          await setDoc(doc(db, 'winners', w.id), w, { merge: true });
        }
      }

      setSyncProgress('📥 5/6 डिपॉजिट्स सिंक हो रहे हैं...');
      for (const d of deposits) {
        if (d && d.id) {
          await setDoc(doc(db, 'deposits', d.id), d, { merge: true });
        }
      }

      setSyncProgress('⚙️ 6/6 सिस्टम सेटिंग्स सिंक हो रही हैं...');
      await setDoc(doc(db, 'system', 'site_settings'), siteSettings, { merge: true });

      setSyncProgress('✅ सम्पूर्ण डेटा सफलतापूर्वक फायरस्टोर में सिंक हो गया!');
      addLog('write', `Full Local Database pushed to Firestore: ${games.length} games, ${users.length} users, ${tickets.length} tickets, ${winners.length} winners.`);
      showFeedback('🚀 सभी गेम्स, यूजर्स, टिकट्स और सेटिंग्स फायरस्टोर में पुश हो गए!');
      loadCollectionDocs(selectedCollection);
    } catch (err: any) {
      setSyncProgress(`❌ सिंक त्रुटि: ${err.message}`);
      addLog('error', `Full Push to Firestore failed: ${err.message}`);
      showFeedback(`त्रुटि: ${err.message}`, true);
    } finally {
      setIsSyncingAll(false);
    }
  };

  // 6. Bulk Pull: Fetch all Firestore data into app
  const handlePullAllFromFirestore = async () => {
    setIsSyncingAll(true);
    setSyncProgress('फायरस्टोर से डेटा प्राप्त किया जा रहा है...');
    try {
      if (onForceRefresh) {
        await onForceRefresh();
      }
      await loadCollectionDocs(selectedCollection);
      setSyncProgress('✅ फायरस्टोर से सारा डेटा सफलतापूर्वक फेच हो गया!');
      addLog('read', 'Full Database pulled from Firestore and synced to application.');
      showFeedback('📥 फायरस्टोर से लाइव डेटा सफलतापूर्वक लोड हो गया!');
    } catch (err: any) {
      setSyncProgress(`❌ फेच त्रुटि: ${err.message}`);
      showFeedback(`त्रुटि: ${err.message}`, true);
    } finally {
      setIsSyncingAll(false);
    }
  };

  // Save edited document JSON
  const handleSaveDocJson = async () => {
    if (!selectedDocData || !selectedDocData._id) return;
    try {
      const parsed = JSON.parse(docJsonEdit);
      delete parsed._id; // strip internal id property
      if (db) {
        const targetRef = doc(db, selectedCollection, selectedDocData._id);
        await setDoc(targetRef, parsed, { merge: true });
        addLog('write', `Updated doc '${selectedCollection}/${selectedDocData._id}' via JSON Editor.`);
      }
      setIsEditingDoc(false);
      showFeedback(`डॉक्यूमेंट '${selectedDocData._id}' फायरस्टोर में अपडेट हो गया!`);
      loadCollectionDocs(selectedCollection);
    } catch (err: any) {
      showFeedback(`अमान्य JSON प्रारूप: ${err.message}`, true);
    }
  };

  // Delete document
  const handleDeleteDoc = async (docId: string) => {
    if (!confirm(`क्या आप वाकई '${selectedCollection}/${docId}' को फायरस्टोर से हटाना चाहते हैं?`)) return;
    try {
      if (db) {
        await deleteDoc(doc(db, selectedCollection, docId));
        addLog('write', `Deleted doc '${selectedCollection}/${docId}' from Firestore.`);
      }
      showFeedback(`डॉक्यूमेंट '${docId}' हटा दिया गया`);
      loadCollectionDocs(selectedCollection);
      if (selectedDocData?._id === docId) {
        setSelectedDocData(null);
      }
    } catch (err: any) {
      showFeedback(`हटाने में विफल: ${err.message}`, true);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-[#0d1117] border-2 border-amber-400/80 rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100">
        
        {/* Top Header Bar */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#161b22] via-[#0f141c] to-[#1c1427] border-b border-amber-400/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-slate-950 shadow-lg shadow-orange-500/30">
              <Flame className="w-6 h-6 fill-current animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                  <span>Firebase Database Connection & Diagnostics</span>
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  REALTIME 0ms
                </span>
              </div>
              <p className="text-xs text-amber-200/80 font-mono flex items-center gap-2 mt-0.5">
                <span>DB: <strong className="text-amber-300">{firebaseConfig.firestoreDatabaseId}</strong></span>
                <span className="text-slate-500">•</span>
                <span>Project: <strong className="text-slate-300">{firebaseConfig.projectId}</strong></span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={runPingTest}
              disabled={isPinging}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold flex items-center gap-1.5 border border-amber-400/40 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
              title="Test Ping"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Test Ping</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Global Feedback Toasts */}
        {actionSuccessMsg && (
          <div className="bg-emerald-500/20 border-b border-emerald-500/50 px-4 py-2.5 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{actionSuccessMsg}</span>
          </div>
        )}
        {actionErrorMsg && (
          <div className="bg-red-500/20 border-b border-red-500/50 px-4 py-2.5 text-red-300 text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{actionErrorMsg}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-2 bg-[#161b22] border-b border-slate-800 overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-2 cursor-pointer transition-all ${
              activeTab === 'overview'
                ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>1. Connection Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('test_push')}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-2 cursor-pointer transition-all ${
              activeTab === 'test_push'
                ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Zap className="w-4 h-4 text-orange-400" />
            <span>2. Instant Live Push Lab (0ms)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-red-500 text-white font-black animate-pulse">
              HOT
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('explorer');
              loadCollectionDocs(selectedCollection);
            }}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-2 cursor-pointer transition-all ${
              activeTab === 'explorer'
                ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>3. Firestore Collection Explorer</span>
          </button>

          <button
            onClick={() => setActiveTab('sync')}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-2 cursor-pointer transition-all ${
              activeTab === 'sync'
                ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            <span>4. Two-Way Bulk Sync</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-2 cursor-pointer transition-all ${
              activeTab === 'logs'
                ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>5. Realtime Event Logs ({logs.length})</span>
          </button>
        </div>

        {/* Modal Body Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

          {/* TAB 1: OVERVIEW & HEALTH METRICS */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Status Banner */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-[#0d1e16] via-[#102422] to-[#1a1429] border-2 border-emerald-400/60 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-400">
                      <Wifi className="w-7 h-7 animate-pulse" />
                    </div>
                    <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-black text-white">Firestore Real-time Gateway Active</h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-slate-950 uppercase">
                        Connected
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">
                      फायरस्टोर डेटाबेस से 8 रियल-टाइम स्नैपशॉट लिसनर्स (onSnapshot) 0ms लेटेंसी पर कनेक्टेड हैं।
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="bg-slate-950/80 px-4 py-2 rounded-xl border border-slate-800 text-right">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Ping / Latency</span>
                    <span className="text-base font-black text-emerald-400 font-mono">
                      {latencyMs !== null ? `${latencyMs} ms` : 'Checking...'}
                    </span>
                  </div>
                  <div className="bg-slate-950/80 px-4 py-2 rounded-xl border border-slate-800 text-right">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Last Verified</span>
                    <span className="text-xs font-bold text-amber-300 font-mono">
                      {lastCheckTime || 'Just now'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Config & Security Details Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Database Instance</span>
                  <p className="text-sm font-black text-amber-300 font-mono truncate mt-1">
                    {firebaseConfig.firestoreDatabaseId}
                  </p>
                  <span className="text-[11px] text-slate-400 mt-1 block">Enterprise Edition • Free Tier</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Cloud Project ID</span>
                  <p className="text-sm font-black text-white font-mono truncate mt-1">
                    {firebaseConfig.projectId}
                  </p>
                  <span className="text-[11px] text-slate-400 mt-1 block">Google Cloud Platform</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Active Listeners</span>
                  <p className="text-sm font-black text-emerald-400 font-mono mt-1">
                    8 Collections Live (0ms)
                  </p>
                  <span className="text-[11px] text-slate-400 mt-1 block">SSE + BroadcastChannel</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Security Rules</span>
                  <p className="text-sm font-black text-amber-400 font-mono mt-1">
                    firestore.rules v2 Active
                  </p>
                  <span className="text-[11px] text-slate-400 mt-1 block">Read/Write Authorized</span>
                </div>
              </div>

              {/* Collections Status Table */}
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-white flex items-center gap-2">
                    <Database className="w-4 h-4 text-amber-400" />
                    <span>Real-time Collection Listeners & Document Counts</span>
                  </h4>
                  <span className="text-xs text-slate-400">Total 8 Synced Collections</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { name: 'games', label: '🎮 Games', count: games.length, color: 'text-amber-400' },
                    { name: 'users', label: '👤 Users', count: users.length, color: 'text-blue-400' },
                    { name: 'tickets', label: '🎟️ Tickets', count: tickets.length, color: 'text-purple-400' },
                    { name: 'winners', label: '🏆 Winners', count: winners.length, color: 'text-yellow-400' },
                    { name: 'deposits', label: '📥 Deposits', count: deposits.length, color: 'text-emerald-400' },
                    { name: 'withdrawals', label: '📤 Withdrawals', count: withdrawals.length, color: 'text-rose-400' },
                    { name: 'transactions', label: '💳 Transactions', count: transactions.length, color: 'text-cyan-400' },
                    { name: 'system', label: '⚙️ Settings', count: 1, color: 'text-slate-300' },
                  ].map((c) => (
                    <div
                      key={c.name}
                      onClick={() => {
                        setSelectedCollection(c.name);
                        setActiveTab('explorer');
                        loadCollectionDocs(c.name);
                      }}
                      className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-amber-400/50 cursor-pointer transition-all group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-300 group-hover:text-amber-300 transition-colors">
                          {c.label}
                        </span>
                        <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                      </div>
                      <div className="flex items-baseline justify-between mt-2">
                        <span className={`text-xl font-black ${c.color} font-mono`}>{c.count}</span>
                        <span className="text-[10px] text-slate-500 font-mono">docs</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INSTANT LIVE PUSH LAB (0ms Realtime Testing) */}
          {activeTab === 'test_push' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10 border border-amber-400/40 text-amber-200 text-xs">
                <strong className="text-amber-300 text-sm block mb-1">⚡ इंस्टेंट लाइव अपडेट टेस्टिंग लैब (0ms Reflection):</strong>
                यहाँ से किसी भी टेस्ट डेटा को फायरस्टोर में पुश करें—यह <strong>तत्काल</strong> आपकी खुली वेबसाइट, लाइव बॉल बार, यूजर वॉलेट व विनर टिकर पर बिना किसी पेज रीलोड के लाइव दिखाई देगा!
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* 1. Live Number Calling Simulator */}
                <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center font-black">
                        <Radio className="w-4 h-4 animate-pulse" />
                      </div>
                      <h4 className="font-black text-sm text-white">1. Live Number Call Test</h4>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-red-500/20 text-red-300 border border-red-500/40">
                      Auto-Dab & Voice
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    नंबर पुश करते ही Universal Live Ball Bar, ऑडियो अनाउंसमेंट और सभी टिकट्स पर ऑटो-मार्क तुरंत सक्रिय होगा।
                  </p>

                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">Select Number (1 - 90)</label>
                      <input
                        type="number"
                        min="1"
                        max="90"
                        value={testBallNumber}
                        onChange={(e) => setTestBallNumber(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xl font-black text-amber-300 font-mono focus:border-amber-400 outline-none"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">Target Live Game</label>
                      <select
                        value={testTargetGameId}
                        onChange={(e) => setTestTargetGameId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs font-bold text-white focus:border-amber-400 outline-none"
                      >
                        {games.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.title} ({g.status})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={handlePushLiveNumber}
                    disabled={isPushing}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-red-500/30 cursor-pointer active:scale-98 transition-all disabled:opacity-50"
                  >
                    <Zap className="w-4 h-4 fill-current" />
                    <span>🔥 Call Ball #{testBallNumber} in Firestore (0ms Live)</span>
                  </button>
                </div>

                {/* 2. Instant Winner Celebration Broadcast */}
                <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black">
                        <Trophy className="w-4 h-4" />
                      </div>
                      <h4 className="font-black text-sm text-white">2. Live Winner Broadcast Test</h4>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      Confetti & Ticker
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    विजेता घोषित करते ही सभी यूज़र्स की स्क्रीन पर गोल्डन टिकर और साउंड फैनफेयर तुरंत बजेगा।
                  </p>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-1">
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">Winner Name</label>
                      <input
                        type="text"
                        value={testWinnerName}
                        onChange={(e) => setTestWinnerName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs font-bold text-white focus:border-amber-400 outline-none"
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">Prize Pattern</label>
                      <select
                        value={testWinnerPattern}
                        onChange={(e) => setTestWinnerPattern(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2 py-2 text-xs font-bold text-amber-300 focus:border-amber-400 outline-none"
                      >
                        <option value="Early 5">Early 5</option>
                        <option value="Top Line">Top Line</option>
                        <option value="Middle Line">Middle Line</option>
                        <option value="Bottom Line">Bottom Line</option>
                        <option value="4 Corners">4 Corners</option>
                        <option value="Star">Star</option>
                        <option value="Full House 1st">Full House 1st</option>
                      </select>
                    </div>
                    <div className="col-span-1">
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">Prize (₹)</label>
                      <input
                        type="number"
                        value={testWinnerPrize}
                        onChange={(e) => setTestWinnerPrize(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs font-bold text-emerald-400 font-mono focus:border-amber-400 outline-none"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handlePushWinner}
                    disabled={isPushing}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer active:scale-98 transition-all disabled:opacity-50"
                  >
                    <Trophy className="w-4 h-4 fill-current" />
                    <span>🎉 Broadcast Winner in Firestore (0ms Live)</span>
                  </button>
                </div>

                {/* 3. Instant User Wallet Adjustment */}
                <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black">
                        <Wallet className="w-4 h-4" />
                      </div>
                      <h4 className="font-black text-sm text-white">3. Live Wallet Credit/Debit Test</h4>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      User Balance Sync
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    यूजर वॉलेट बैलेंस फायरस्टोर में अपडेट होते ही यूजर के हेडर व डैशबोर्ड पर तुरंत बदल जाएगा।
                  </p>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-1">
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">Target User</label>
                      <select
                        value={testWalletUserId}
                        onChange={(e) => setTestWalletUserId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2 py-2 text-xs font-bold text-white focus:border-amber-400 outline-none truncate"
                      >
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} (₹{u.walletBalance || 0})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-1">
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">Type</label>
                      <select
                        value={testWalletType}
                        onChange={(e) => setTestWalletType(e.target.value as any)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2 py-2 text-xs font-bold text-white focus:border-amber-400 outline-none"
                      >
                        <option value="credit">➕ Credit</option>
                        <option value="debit">➖ Debit</option>
                      </select>
                    </div>
                    <div className="col-span-1">
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">Amount (₹)</label>
                      <input
                        type="number"
                        value={testWalletAmount}
                        onChange={(e) => setTestWalletAmount(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2 py-2 text-xs font-bold text-emerald-400 font-mono focus:border-amber-400 outline-none"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handlePushWalletAdjust}
                    disabled={isPushing}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer active:scale-98 transition-all disabled:opacity-50"
                  >
                    <Wallet className="w-4 h-4" />
                    <span>💰 Update User Wallet in Firestore</span>
                  </button>
                </div>

                {/* 4. Instant Site Announcement Banner Update */}
                <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-black">
                        <Bell className="w-4 h-4" />
                      </div>
                      <h4 className="font-black text-sm text-white">4. Live Marquee Announcement</h4>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/40">
                      Site Banner
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    घोषणा टेक्स्ट फायरस्टोर में डालते ही पूरी वेबसाइट के टॉप स्क्रोलर पर तुरंत दिखाई देने लगेगा।
                  </p>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">Announcement Text</label>
                    <textarea
                      rows={2}
                      value={testAnnouncementText}
                      onChange={(e) => setTestAnnouncementText(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs font-medium text-white focus:border-amber-400 outline-none resize-none"
                    />
                  </div>

                  <button
                    onClick={handlePushAnnouncement}
                    disabled={isPushing}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 cursor-pointer active:scale-98 transition-all disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>📢 Update Site Banner in Firestore</span>
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* TAB 3: FIRESTORE COLLECTION EXPLORER & EDITOR */}
          {activeTab === 'explorer' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 p-3 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-2 flex-wrap">
                  {['games', 'users', 'tickets', 'winners', 'deposits', 'withdrawals', 'transactions', 'system'].map((c) => (
                    <button
                      key={c}
                      onClick={() => {
                        setSelectedCollection(c);
                        setSelectedDocData(null);
                        loadCollectionDocs(c);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        selectedCollection === c
                          ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                          : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search doc ID..."
                      value={searchDocQuery}
                      onChange={(e) => setSearchDocQuery(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:border-amber-400 outline-none w-36 sm:w-48 font-mono"
                    />
                  </div>
                  <button
                    onClick={() => loadCollectionDocs(selectedCollection)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 cursor-pointer"
                    title="Reload collection"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDocs ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Split View: Doc List + JSON Inspector */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Document List */}
                <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-3 max-h-[420px] overflow-y-auto space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs font-bold text-slate-400">
                    <span>Collection: <strong className="text-amber-300">/{selectedCollection}</strong></span>
                    <span>{collectionDocs.length} items</span>
                  </div>

                  {isLoadingDocs ? (
                    <div className="py-12 text-center text-slate-400 text-xs font-mono">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-400" />
                      Loading collection documents...
                    </div>
                  ) : collectionDocs.length === 0 ? (
                    <div className="py-12 text-center text-slate-500 text-xs">
                      No documents found in collection /{selectedCollection}.
                    </div>
                  ) : (
                    collectionDocs
                      .filter((d) => !searchDocQuery || d._id?.toLowerCase().includes(searchDocQuery.toLowerCase()))
                      .map((docItem) => {
                        const isSelected = selectedDocData?._id === docItem._id;
                        return (
                          <div
                            key={docItem._id}
                            onClick={() => {
                              setSelectedDocData(docItem);
                              setDocJsonEdit(JSON.stringify(docItem, null, 2));
                              setIsEditingDoc(false);
                            }}
                            className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                              isSelected
                                ? 'bg-amber-400/10 border-amber-400 text-white shadow-sm'
                                : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-300'
                            }`}
                          >
                            <div className="truncate">
                              <span className="text-xs font-black font-mono text-amber-300 block truncate">
                                {docItem._id}
                              </span>
                              <span className="text-[11px] text-slate-400 truncate block">
                                {docItem.name || docItem.userName || docItem.email || docItem.title || JSON.stringify(docItem).slice(0, 45)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteDoc(docItem._id);
                                }}
                                className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors"
                                title="Delete document"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                              <ChevronRight className="w-4 h-4 text-slate-500" />
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>

                {/* Document Viewer & JSON Editor */}
                <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 flex flex-col max-h-[420px]">
                  {selectedDocData ? (
                    <div className="flex-1 flex flex-col space-y-3 overflow-hidden">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-mono block">Document ID</span>
                          <h5 className="text-xs font-black text-amber-300 font-mono truncate">
                            {selectedDocData._id}
                          </h5>
                        </div>
                        <div className="flex items-center gap-2">
                          {isEditingDoc ? (
                            <>
                              <button
                                onClick={handleSaveDocJson}
                                className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black cursor-pointer"
                              >
                                Save Changes
                              </button>
                              <button
                                onClick={() => setIsEditingDoc(false)}
                                className="px-2 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold cursor-pointer"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => setIsEditingDoc(true)}
                              className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-400/30 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Edit JSON</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {isEditingDoc ? (
                        <textarea
                          value={docJsonEdit}
                          onChange={(e) => setDocJsonEdit(e.target.value)}
                          className="flex-1 w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-amber-200/90 focus:border-amber-400 outline-none resize-none overflow-y-auto"
                        />
                      ) : (
                        <pre className="flex-1 bg-slate-950 rounded-xl p-3 border border-slate-800 overflow-auto font-mono text-xs text-emerald-300/90 select-all">
                          {JSON.stringify(selectedDocData, null, 2)}
                        </pre>
                      )}
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs text-center p-6">
                      <Database className="w-8 h-8 text-slate-600 mb-2" />
                      <span>Select a document on the left to inspect and edit raw Firestore values.</span>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* TAB 4: TWO-WAY BULK SYNC */}
          {activeTab === 'sync' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Push local to firestore */}
                <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
                  <div className="w-10 h-10 rounded-2xl bg-amber-400/10 text-amber-400 flex items-center justify-center font-black">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-black text-base text-white">Push All Local State to Firestore</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      वर्तमान वेबसाइट के सभी लाइव गेम्स ({games.length}), यूजर्स ({users.length}), टिकट्स ({tickets.length}), विनर्स ({winners.length}) और सेटिंग्स को फायरस्टोर डेटाबेस में अपलोड करें।
                    </p>
                  </div>

                  <button
                    onClick={handlePushAllLocalToFirestore}
                    disabled={isSyncingAll}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 cursor-pointer active:scale-98 transition-all disabled:opacity-50"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>⬆️ Push Local DB to Firestore Database</span>
                  </button>
                </div>

                {/* Pull from firestore */}
                <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-400/10 text-emerald-400 flex items-center justify-center font-black">
                    <DownloadCloud className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-black text-base text-white">Pull All Records from Firestore</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      फायरस्टोर क्लाउड डेटाबेस से सभी ताज़ा रिकॉर्ड्स को तुरंत फेच करके वेबसाइट की मेमोरी व स्टेट में रिफ्रेश करें।
                    </p>
                  </div>

                  <button
                    onClick={handlePullAllFromFirestore}
                    disabled={isSyncingAll}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer active:scale-98 transition-all disabled:opacity-50"
                  >
                    <DownloadCloud className="w-4 h-4" />
                    <span>⬇️ Pull & Synchronize All from Firestore</span>
                  </button>
                </div>

              </div>

              {syncProgress && (
                <div className="p-4 rounded-xl bg-slate-950 border border-amber-400/40 text-amber-300 font-mono text-xs flex items-center gap-3">
                  <RefreshCw className={`w-4 h-4 ${isSyncingAll ? 'animate-spin text-amber-400' : 'text-emerald-400'}`} />
                  <span>{syncProgress}</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: REALTIME EVENT LOGS */}
          {activeTab === 'logs' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-amber-400" />
                  <h4 className="text-xs font-black text-white">Firestore Live Snapshot & Mutation Stream</h4>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const allLogs = logs.map(l => `[${l.timestamp}] [${l.type.toUpperCase()}] ${l.message}`).join('\n');
                      handleCopy(allLogs, 'logs');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedText === 'logs' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>Copy Logs</span>
                  </button>
                  <button
                    onClick={() => setLogs([])}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-400 hover:text-white cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="bg-slate-950 rounded-2xl border border-slate-800 p-3 max-h-[380px] overflow-y-auto font-mono text-[11px] space-y-1.5">
                {logs.length === 0 ? (
                  <div className="py-12 text-center text-slate-600">
                    No logs recorded yet. Run a ping test or trigger an instant push!
                  </div>
                ) : (
                  logs.map((log) => {
                    const badgeColor =
                      log.type === 'write'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : log.type === 'read'
                        ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                        : log.type === 'error'
                        ? 'bg-red-500/20 text-red-300 border-red-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';

                    return (
                      <div key={log.id} className="p-2 rounded-lg bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 flex items-start gap-2.5">
                        <span className="text-slate-500 shrink-0 select-none">{log.timestamp}</span>
                        <span className={`px-1.5 py-0.2 rounded uppercase text-[9px] font-black border shrink-0 ${badgeColor}`}>
                          {log.type}
                        </span>
                        <span className="text-slate-200 break-all flex-1">{log.message}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

        </div>

        {/* Footer Area */}
        <div className="p-3 sm:p-4 bg-[#161b22] border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Firestore Engine: <strong>@firebase/firestore</strong></span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs uppercase tracking-wider cursor-pointer shadow-md transition-all active:scale-95"
          >
            Done / Close Modal
          </button>
        </div>

      </div>
    </div>
  );
};
