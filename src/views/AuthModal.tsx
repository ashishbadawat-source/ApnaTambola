import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  Mail,
  User as UserIcon,
  Phone,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Gift,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  RotateCcw,
  Smartphone,
  Eye,
  EyeOff,
  UserPlus,
  LogIn,
  LogOut,
} from 'lucide-react';
import { User, ReferralCommission } from '../types';
import { playWinningFanfare, playNumberCallSound } from '../utils/audio';
import { auth, googleProvider, signInWithPopup, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { extractReferralCode, findReferrerInList } from '../utils/referralMatcher';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: User) => void;
  onRegisterUser?: (user: User) => void;
  allUsers: User[];
  currentUser?: User | null;
  onLogout?: () => void;
  initialMode?: 'login' | 'register';
  loginPromptReason?: string;
}

const AVATAR_OPTIONS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=160&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=160&q=80',
];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLogin,
  onRegisterUser,
  allUsers,
  currentUser,
  onLogout,
  initialMode = 'login',
  loginPromptReason,
}) => {
  const [isRegister, setIsRegister] = useState(initialMode === 'register');
  const [lang, setLang] = useState<'hi' | 'en'>('hi');
  const [loginMethod, setLoginMethod] = useState<'password' | 'otp'>('password');

  // Login Form fields
  const [loginIdentifier, setLoginIdentifier] = useState(''); // Mobile number or email
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register Form fields
  const [registerName, setRegisterName] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [referralCodeInput, setReferralCodeInput] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_OPTIONS[0]);
  const [agreedTerms, setAgreedTerms] = useState(true);

  // OTP State for registered mobile OTP login
  const [otpPhone, setOtpPhone] = useState('');
  const [otpStep, setOtpStep] = useState(false);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '']);
  const [mockGeneratedOtp, setMockGeneratedOtp] = useState<string>('');
  const [otpTimer, setOtpTimer] = useState(30);

  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [existingUserFound, setExistingUserFound] = useState<User | null>(null);
  const [isResetPasswordMode, setIsResetPasswordMode] = useState(false);
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [isSigningInGoogle, setIsSigningInGoogle] = useState(false);
  const [asyncReferrer, setAsyncReferrer] = useState<User | null>(null);
  const [isCheckingReferral, setIsCheckingReferral] = useState(false);

  // Pre-fill referral code from URL query parameters (?ref=... or ?referral=...) or localStorage or hash
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      let refFound = '';
      const urlParams = new URLSearchParams(window.location.search);
      refFound = urlParams.get('ref') || urlParams.get('referral') || urlParams.get('r') || '';

      if (!refFound && window.location.hash) {
        const hashStr = window.location.hash;
        const match = hashStr.match(/[?&#](ref|referral|r)=([^&#]+)/i) || hashStr.match(/#ref=([^&#]+)/i);
        if (match && match[2]) refFound = decodeURIComponent(match[2]);
        else if (match && match[1] && !hashStr.includes('=')) refFound = decodeURIComponent(match[1]);
      }

      if (refFound && refFound.trim()) {
        const cleanRef = refFound.trim().toUpperCase();
        setReferralCodeInput(cleanRef);
        localStorage.setItem('apna_tambola_pending_referral', cleanRef);
      } else {
        const storedRef = localStorage.getItem('apna_tambola_pending_referral');
        if (storedRef && !referralCodeInput) {
          setReferralCodeInput(storedRef.trim().toUpperCase());
        }
      }
    } catch (e) {
      console.warn('Could not read URL referral params:', e);
    }
  }, [isOpen]);

  // Real-time matched referrer lookup from loaded users
  const localMatchedReferrer = React.useMemo(() => {
    if (!referralCodeInput || referralCodeInput.trim().length < 2) return null;
    const cleanRaw = referralCodeInput.trim().toUpperCase();
    const cleanRef = cleanRaw.includes('REF=') ? cleanRaw.split('REF=')[1]?.split('&')[0] || cleanRaw : cleanRaw;
    const digitsOnly = cleanRaw.replace(/\D/g, '');
    const cleanNoPrefix = cleanRef.replace(/^REF-?/, '');

    return (
      allUsers.find((u) => {
        const uCode = (u.referralCode || '').trim().toUpperCase();
        const uCodeNoPrefix = uCode.replace(/^REF-?/, '');
        const uId = (u.id || '').trim().toUpperCase();
        const uPhone = (u.phone || '').replace(/\D/g, '');
        const uName = (u.name || '').trim().toUpperCase();

        // 1. Direct referral code or user id match (with and without REF- prefix)
        if (uCode && (uCode === cleanRef || uCodeNoPrefix === cleanNoPrefix || cleanRef.includes(uCode) || uCode.includes(cleanRef))) return true;
        if (uId && (uId === cleanRef || cleanRef.includes(uId) || uId.includes(cleanRef))) return true;

        // 2. Phone match (exact, suffix, or contains)
        if (digitsOnly.length >= 6 && uPhone) {
          if (uPhone === digitsOnly || uPhone.endsWith(digitsOnly) || digitsOnly.endsWith(uPhone)) return true;
        }

        // 3. Name match
        if (uName && (cleanRef === uName || cleanNoPrefix === uName)) return true;

        return false;
      }) || null
    );
  }, [referralCodeInput, allUsers]);

  // If not found in local state, fetch from Firestore in real-time
  useEffect(() => {
    let isCancelled = false;
    const cleanRaw = referralCodeInput.trim().toUpperCase();
    const cleanRef = cleanRaw.includes('REF=') ? cleanRaw.split('REF=')[1]?.split('&')[0] || cleanRaw : cleanRaw;
    const cleanNoPrefix = cleanRef.replace(/^REF-?/, '');
    const digitsOnly = cleanRaw.replace(/\D/g, '');

    if (localMatchedReferrer || !cleanRef || cleanRef.length < 2) {
      setAsyncReferrer(null);
      setIsCheckingReferral(false);
      return;
    }

    setIsCheckingReferral(true);
    const searchFirestore = async () => {
      try {
        // 1. Search by exact referralCode
        const qCode = query(collection(db, 'users'), where('referralCode', '==', cleanRef));
        const snapCode = await getDocs(qCode);
        if (!isCancelled && !snapCode.empty) {
          const uDoc = snapCode.docs[0];
          setAsyncReferrer({ ...(uDoc.data() as User), id: uDoc.id });
          setIsCheckingReferral(false);
          return;
        }

        // 2. Search by REF- prefix variation
        if (!cleanRef.startsWith('REF-')) {
          const qRefPrefix = query(collection(db, 'users'), where('referralCode', '==', `REF-${cleanRef}`));
          const snapPrefix = await getDocs(qRefPrefix);
          if (!isCancelled && !snapPrefix.empty) {
            const uDoc = snapPrefix.docs[0];
            setAsyncReferrer({ ...(uDoc.data() as User), id: uDoc.id });
            setIsCheckingReferral(false);
            return;
          }
        }

        // 3. Search by ID
        const docRef = doc(db, 'users', cleanRef.toLowerCase());
        const docSnap = await getDoc(docRef);
        if (!isCancelled && docSnap.exists()) {
          setAsyncReferrer({ ...(docSnap.data() as User), id: docSnap.id });
          setIsCheckingReferral(false);
          return;
        }

        // 4. Proactively check all users in Firestore if query missed case or phone
        const allUsersSnap = await getDocs(collection(db, 'users'));
        if (!isCancelled && !allUsersSnap.empty) {
          let foundUser: User | null = null;
          allUsersSnap.forEach((d) => {
            if (foundUser) return;
            const data = d.data() as User;
            const u = { ...data, id: d.id };
            const uCode = (u.referralCode || '').trim().toUpperCase();
            const uCodeNoPrefix = uCode.replace(/^REF-?/, '');
            const uId = (u.id || '').trim().toUpperCase();
            const uPhone = (u.phone || '').replace(/\D/g, '');
            const uName = (u.name || '').trim().toUpperCase();

            if (uCode && (uCode === cleanRef || uCodeNoPrefix === cleanNoPrefix || cleanRef.includes(uCode) || uCode.includes(cleanRef))) {
              foundUser = u;
            } else if (uId && (uId === cleanRef || cleanRef.includes(uId) || uId.includes(cleanRef))) {
              foundUser = u;
            } else if (digitsOnly.length >= 6 && uPhone && (uPhone === digitsOnly || uPhone.endsWith(digitsOnly) || digitsOnly.endsWith(uPhone))) {
              foundUser = u;
            } else if (uName && (cleanRef === uName || cleanNoPrefix === uName)) {
              foundUser = u;
            }
          });

          if (foundUser) {
            setAsyncReferrer(foundUser);
            setIsCheckingReferral(false);
            return;
          }
        }

        if (!isCancelled) {
          setAsyncReferrer(null);
          setIsCheckingReferral(false);
        }
      } catch (err) {
        if (!isCancelled) setIsCheckingReferral(false);
      }
    };

    const timer = setTimeout(searchFirestore, 300);
    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [referralCodeInput, localMatchedReferrer]);

  const matchedReferrer = localMatchedReferrer || asyncReferrer;

  // Sync mode when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsRegister(initialMode === 'register');
      setOtpStep(false);
      setOtpDigits(['', '', '', '']);
      setStatusMessage(null);
    }
  }, [isOpen, initialMode]);

  // Countdown timer for OTP
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (otpStep && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpStep, otpTimer]);

  if (!isOpen) return null;

  // Language Dictionary
  const t = {
    hi: {
      loginTab: 'लॉगिन करें (User Login)',
      registerTab: 'नया खाता बनाएं (Register)',
      titleLogin: 'यूजर आईडी व पासवर्ड लॉगिन',
      subtitleLogin: 'केवल रजिस्टर्ड यूजर्स ही अपना आईडी और पासवर्ड डालकर लॉगिन कर सकते हैं।',
      titleRegister: 'नया यूजर रजिस्ट्रेशन (रजिस्टर करें)',
      subtitleRegister: '🎁 ₹10 का रजिस्ट्रेशन बोनस आपके पहले डिपॉजिट पर सीधे टिकट वॉलेट में जुड़ेगा (एक बार)!',
      loginIdLabel: 'रजिस्टर्ड मोबाइल नंबर या ईमेल आईडी',
      loginIdPlaceholder: 'उदा. 9876543210 या player@gmail.com',
      passwordLabel: 'पासवर्ड (Password)',
      passwordPlaceholder: 'अपना पासवर्ड दर्ज करें',
      phoneLabel: '10-अंकों का मोबाइल नंबर',
      phonePlaceholder: 'उदा. 9876543210',
      nameLabel: 'आपका पूरा नाम (Full Name)',
      namePlaceholder: 'उदा. राहुल शर्मा',
      emailLabel: 'ईमेल पता (वैकल्पिक)',
      emailPlaceholder: 'उदा. rahul@gmail.com',
      regPasswordLabel: 'नया पासवर्ड बनाएं (कम से कम 4 अक्षर)',
      confirmPasswordLabel: 'पासवर्ड की दोबारा पुष्टि करें',
      refLabel: 'रेफरल कोड (यदि कोई हो - Optional)',
      refPlaceholder: 'उदा. REF-ASH772',
      refBonusText: '✓ 8-लेवल लाइफटाइम कमीशन नेटवर्क से जुड़ें',
      loginBtn: 'आईडी व पासवर्ड से लॉगिन करें',
      registerBtn: 'खाता बनाएं (रजिस्टर करें)',
      useOtpLogin: '📱 ओटीपी से लॉगिन करें',
      usePasswordLogin: '🔑 पासवर्ड से लॉगिन करें',
      haveAccount: 'पहले से रजिस्टर हैं? यहाँ लॉगिन करें',
      noAccount: 'नया यूजर? यहाँ क्लिक करके पहले रजिस्टर करें',
      welcomeBonusPill: '🎁 पहले डिपॉजिट पर पाएँ ₹10 का अतिरिक्त रजिस्ट्रेशन बोनस!',
      agreeTerms: 'मैं नियम, निष्पक्ष खेल व 18+ नीति से सहमत हूँ',
      chooseAvatar: 'अपना गेमिंग अवतार चुनें:',
      sendOtp: 'वेरिफिकेशन ओटीपी प्राप्त करें',
      verifyOtpBtn: 'ओटीपी सत्यापित कर लॉगिन करें',
      otpSentTo: 'रजिस्टर्ड मोबाइल पर भेजा गया कोड:',
      autoFillOtp: 'ऑटो-फिल',
      resendOtp: 'दोबारा भेजें',
      resendIn: 'दोबारा भेजें',
    },
    en: {
      loginTab: 'Sign In (User Login)',
      registerTab: 'Create Account (Register)',
      titleLogin: 'Registered User Sign In',
      subtitleLogin: 'Only registered players with valid ID & Password can sign in.',
      titleRegister: 'Create Player Account',
      subtitleRegister: '🎁 ₹10 Registration Bonus will be added automatically to your ticket wallet on your 1st deposit (One time only)!',
      loginIdLabel: 'Registered Mobile Number or Email',
      loginIdPlaceholder: 'e.g. 9876543210 or player@gmail.com',
      passwordLabel: 'Password',
      passwordPlaceholder: 'Enter your password',
      phoneLabel: '10-digit Mobile Number',
      phonePlaceholder: 'e.g. 9876543210',
      nameLabel: 'Full Name',
      namePlaceholder: 'e.g. Rahul Sharma',
      emailLabel: 'Email Address (Optional)',
      emailPlaceholder: 'e.g. rahul@gmail.com',
      regPasswordLabel: 'Create Password (min 4 chars)',
      confirmPasswordLabel: 'Confirm Password',
      refLabel: 'Referral Code (Optional)',
      refPlaceholder: 'e.g. REF-ASH772',
      refBonusText: '✓ Connect to 8-level commission network',
      loginBtn: 'Sign In with ID & Password',
      registerBtn: 'Create Account (Register)',
      useOtpLogin: '📱 Sign in with OTP',
      usePasswordLogin: '🔑 Sign in with Password',
      haveAccount: 'Already registered? Sign In',
      noAccount: "Don't have an account? Register Now",
      welcomeBonusPill: '🎁 Get ₹10 Registration Bonus on your first deposit!',
      agreeTerms: 'I agree to Terms, Fairplay & 18+ policy',
      chooseAvatar: 'Choose your avatar:',
      sendOtp: 'Get Verification OTP',
      verifyOtpBtn: 'Verify OTP & Sign In',
      otpSentTo: 'Code sent to registered mobile:',
      autoFillOtp: 'Auto-Fill',
      resendOtp: 'Resend',
      resendIn: 'Resend in',
    },
  }[lang];

  // Helper to normalize phone input
  const cleanPhone = (val: string) => val.replace(/\D/g, '').slice(-10);

  // Helper to find user by login identifier (mobile number, email, or username)
  const findUserByIdentifier = (identifier: string): User | undefined => {
    const raw = identifier.trim().toLowerCase();
    const phoneDigits = raw.replace(/\D/g, '').slice(-10);

    return allUsers.find((u) => {
      // Match phone
      if (phoneDigits.length === 10) {
        const uPhoneDigits = u.phone.replace(/\D/g, '').slice(-10);
        if (uPhoneDigits === phoneDigits) return true;
      }
      // Match email
      if (u.email && u.email.toLowerCase() === raw) return true;
      // Match username or id
      if (u.username && u.username.toLowerCase() === raw) return true;
      if (u.id.toLowerCase() === raw) return true;
      return false;
    });
  };

  // ==================== STRICT PASSWORD LOGIN HANDLER ====================
  const handlePasswordLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    const identifier = loginIdentifier.trim();
    const enteredPassword = loginPassword;

    if (!identifier) {
      setStatusMessage({
        type: 'error',
        text: lang === 'hi' ? 'कृपया अपना रजिस्टर्ड मोबाइल नंबर या ईमेल दर्ज करें।' : 'Please enter your registered mobile or email.',
      });
      return;
    }

    if (!enteredPassword) {
      setStatusMessage({
        type: 'error',
        text: lang === 'hi' ? 'कृपया अपना पासवर्ड दर्ज करें।' : 'Please enter your password.',
      });
      return;
    }

    // Strict registration check: user MUST exist in registered users
    const matchedUser = findUserByIdentifier(identifier);

    if (!matchedUser) {
      setStatusMessage({
        type: 'error',
        text:
          lang === 'hi'
            ? '❌ खाता नहीं मिला! यह यूजर रजिस्टर नहीं है। कृपया पहले नीचे "नया खाता बनाएं (रजिस्टर)" पर क्लिक करके रजिस्टर करें।'
            : '❌ Account not found! This user is not registered. Please register first to create an account.',
      });
      return;
    }

    // Check password match (default seed password is 'password123' or whatever was registered)
    const storedPassword = matchedUser.password || 'password123';
    if (enteredPassword !== storedPassword) {
      setStatusMessage({
        type: 'error',
        text:
          lang === 'hi'
            ? '❌ गलत पासवर्ड! कृपया सही पासवर्ड दर्ज करें।'
            : '❌ Incorrect password! Please enter the correct password.',
      });
      return;
    }

    // Login Success
    playWinningFanfare();
    onLogin(matchedUser);
    onClose();
  };

  // ==================== STRICT OTP LOGIN FOR REGISTERED NUMBERS ====================
  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    const digits = cleanPhone(otpPhone);
    if (digits.length !== 10) {
      setStatusMessage({
        type: 'error',
        text: lang === 'hi' ? 'कृपया सही 10-अंकों का मोबाइल नंबर दर्ज करें।' : 'Please enter a valid 10-digit mobile number.',
      });
      return;
    }

    // STRICT CHECK: Is this phone number registered?
    const matchedUser = allUsers.find((u) => u.phone.replace(/\D/g, '').endsWith(digits));
    if (!matchedUser) {
      setStatusMessage({
        type: 'error',
        text:
          lang === 'hi'
            ? '❌ यह मोबाइल नंबर रजिस्टर नहीं है! बिना रजिस्ट्रेशन के लॉगिन नहीं हो सकता। कृपया पहले रजिस्टर करें।'
            : '❌ This mobile number is not registered. You cannot login without registering first. Please click Register.',
      });
      return;
    }

    const generated = Math.floor(1000 + Math.random() * 9000).toString();
    setMockGeneratedOtp(generated);
    setOtpStep(true);
    setOtpTimer(30);
    playNumberCallSound();
    setStatusMessage({
      type: 'success',
      text: lang === 'hi' ? `रजिस्टर्ड नंबर पर ओटीपी कोड ${generated} भेजा गया!` : `OTP code ${generated} sent to registered number!`,
    });
  };

  const handleAutoFillOtp = () => {
    if (mockGeneratedOtp) {
      setOtpDigits(mockGeneratedOtp.split(''));
    }
  };

  const handleVerifyOtpAndLogin = () => {
    const entered = otpDigits.join('');
    if (entered.length < 4) {
      setStatusMessage({
        type: 'error',
        text: lang === 'hi' ? 'कृपया पूरा 4-अंकीय ओटीपी दर्ज करें।' : 'Please enter the complete 4-digit OTP.',
      });
      return;
    }

    const digits = cleanPhone(otpPhone);
    const matchedUser = allUsers.find((u) => u.phone.replace(/\D/g, '').endsWith(digits));

    if (!matchedUser) {
      setStatusMessage({
        type: 'error',
        text: lang === 'hi' ? '❌ यूजर खाता नहीं मिला। कृपया पहले रजिस्टर करें।' : '❌ User account not found. Please register first.',
      });
      return;
    }

    playWinningFanfare();
    onLogin(matchedUser);
    onClose();
  };

  // ==================== INSTANT DIRECT REFERRAL LINK & LOGIN ====================
  const handleLinkReferralAndLogin = async (targetUser: User) => {
    const cleanRefCode = referralCodeInput ? referralCodeInput.trim().toUpperCase() : '';
    const sponsor = matchedReferrer || null;
    const finalReferredByCode = sponsor ? (sponsor.referralCode || sponsor.id || cleanRefCode) : cleanRefCode;
    const finalReferredByUserId = sponsor ? sponsor.id : '';

    const updatedUser: User = {
      ...targetUser,
      referredBy: finalReferredByCode || targetUser.referredBy || '',
      referredByUserId: finalReferredByUserId || targetUser.referredByUserId || '',
      status: 'active',
      isBlocked: false,
    };

    // Save to Firestore
    try {
      const sanitizedUser = JSON.parse(JSON.stringify(updatedUser));
      setDoc(doc(db, 'users', updatedUser.id), sanitizedUser, { merge: true }).catch(() => {});
    } catch (e) {}

    // Save to server backend
    try {
      fetch('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: updatedUser,
          id: updatedUser.id,
          name: updatedUser.name,
          phone: updatedUser.phone,
          email: updatedUser.email,
          referralCode: updatedUser.referralCode,
          referredBy: updatedUser.referredBy,
          referredByUserId: updatedUser.referredByUserId,
          referralCodeInput: cleanRefCode || (sponsor ? sponsor.referralCode : ''),
          selectedAvatar: updatedUser.avatar,
        }),
      }).catch((e) => console.warn('Server registration update notice:', e));
    } catch (e) {}

    // Award direct referral join bonus to sponsor
    if (sponsor) {
      try {
        const joinCommission: ReferralCommission = {
          id: `comm_join_${Date.now()}_${updatedUser.id}`,
          userId: sponsor.id,
          userName: sponsor.name,
          sourceUserId: updatedUser.id,
          sourceUserName: updatedUser.name,
          gameId: 'signup_bonus',
          gameTitle: '🎁 New Direct Referral Join Bonus (Level 1)',
          ticketId: 'REG-DIRECT',
          level: 1,
          percentage: 10,
          baseAmount: 10,
          commissionAmount: 10,
          transactionId: `TXN-REF-${Date.now()}`,
          timestamp: new Date().toISOString(),
          status: 'approved',
        };
        const sanitizedComm = JSON.parse(JSON.stringify(joinCommission));
        setDoc(doc(db, 'commissions', joinCommission.id), sanitizedComm).catch(() => {});
        fetch('/api/commissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sanitizedComm),
        }).catch(() => {});
      } catch (e) {}
    }

    // Broadcast registration event across tabs
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel('apna_tambola_sync');
        bc.postMessage({ type: 'NEW_USER_REGISTERED', user: updatedUser });
        bc.close();
      }
    } catch (e) {}

    if (onRegisterUser) {
      onRegisterUser(updatedUser);
    }
    playWinningFanfare();
    onLogin(updatedUser);
    onClose();
  };

  // ==================== USER REGISTRATION HANDLER ====================
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    const name = registerName.trim();
    const phoneDigits = cleanPhone(registerPhone);
    const email = registerEmail.trim();
    const pwd = registerPassword;
    const confirmPwd = registerConfirmPassword;

    if (!name) {
      setStatusMessage({
        type: 'error',
        text: lang === 'hi' ? 'कृपया अपना पूरा नाम दर्ज करें।' : 'Please enter your full name.',
      });
      return;
    }

    if (phoneDigits.length !== 10) {
      setStatusMessage({
        type: 'error',
        text: lang === 'hi' ? 'कृपया सही 10-अंकों का मोबाइल नंबर दर्ज करें।' : 'Please enter a valid 10-digit mobile number.',
      });
      return;
    }

    if (!pwd || pwd.length < 4) {
      setStatusMessage({
        type: 'error',
        text: lang === 'hi' ? 'पासवर्ड कम से कम 4 अक्षरों का होना चाहिए।' : 'Password must be at least 4 characters long.',
      });
      return;
    }

    if (pwd !== confirmPwd) {
      setStatusMessage({
        type: 'error',
        text: lang === 'hi' ? 'पासवर्ड और कन्फर्म पासवर्ड एक समान नहीं हैं।' : 'Passwords do not match.',
      });
      return;
    }

    // Resolve referredBy code and exact referrer profile first
    const rawRefInput = referralCodeInput || pendingReferralCode || localStorage.getItem('apna_tambola_pending_referral') || '';
    const cleanRefCode = extractReferralCode(rawRefInput);
    let finalReferrer: User | null = matchedReferrer || null;

    if (!finalReferrer && cleanRefCode) {
      // 1. Check local loaded users using robust matcher
      finalReferrer = findReferrerInList(cleanRefCode, allUsers);

      // 2. Proactively search Firestore directly if not yet in local allUsers memory
      if (!finalReferrer) {
        try {
          const qRef = query(collection(db, 'users'), where('referralCode', '==', cleanRefCode));
          const snapRef = await getDocs(qRef);
          if (!snapRef.empty) {
            finalReferrer = { ...(snapRef.docs[0].data() as User), id: snapRef.docs[0].id };
          } else {
            const allUsersSnap = await getDocs(collection(db, 'users'));
            if (!allUsersSnap.empty) {
              const fsList: User[] = [];
              allUsersSnap.forEach((d) => fsList.push({ ...(d.data() as User), id: d.id }));
              finalReferrer = findReferrerInList(cleanRefCode, fsList);
            }
          }
        } catch (err) {
          console.warn('Direct referrer search in Firestore notice:', err);
        }
      }
    }

    const finalReferredByCode = finalReferrer ? (finalReferrer.referralCode || finalReferrer.id || cleanRefCode) : cleanRefCode;
    const finalReferredByUserId = finalReferrer ? finalReferrer.id : '';

    // Check if phone or email already registered
    const existingPhone = allUsers.find((u) => u.phone && u.phone.replace(/\D/g, '').endsWith(phoneDigits));
    const existingEmail = email ? allUsers.find((u) => u.email && u.email.toLowerCase() === email.toLowerCase()) : null;
    const existingUser = existingPhone || existingEmail;

    if (existingUser) {
      // If user is registering with details & referral code, seamlessly update and connect under the sponsor!
      const updatedUser: User = {
        ...existingUser,
        name: name || existingUser.name,
        password: pwd || existingUser.password,
        avatar: selectedAvatar || existingUser.avatar,
        referredBy: finalReferredByCode || existingUser.referredBy || '',
        referredByUserId: finalReferredByUserId || existingUser.referredByUserId || '',
        status: 'active',
        isBlocked: false,
      };

      // Save to server backend
      try {
        await fetch('/api/users/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user: updatedUser,
            id: updatedUser.id,
            name: updatedUser.name,
            phone: updatedUser.phone,
            email: updatedUser.email,
            password: updatedUser.password,
            referralCode: updatedUser.referralCode,
            referredBy: updatedUser.referredBy,
            referredByUserId: updatedUser.referredByUserId,
            referralCodeInput: cleanRefCode || (finalReferrer ? finalReferrer.referralCode : ''),
            selectedAvatar: updatedUser.avatar,
          }),
        }).catch((e) => console.warn('Server registration update notice:', e));
      } catch (e) {}

      // Save to Firestore
      try {
        const sanitizedUser = JSON.parse(JSON.stringify(updatedUser));
        await setDoc(doc(db, 'users', updatedUser.id), sanitizedUser, { merge: true }).catch(() => {});
      } catch (err) {}

      // Credit direct sponsor if new referral
      if (finalReferrer) {
        try {
          const joinCommission: ReferralCommission = {
            id: `comm_join_${Date.now()}_${updatedUser.id}`,
            userId: finalReferrer.id,
            userName: finalReferrer.name,
            sourceUserId: updatedUser.id,
            sourceUserName: updatedUser.name,
            gameId: 'signup_bonus',
            gameTitle: '🎁 New Direct Referral Join Bonus (Level 1)',
            ticketId: 'REG-DIRECT',
            level: 1,
            percentage: 10,
            baseAmount: 10,
            commissionAmount: 10,
            transactionId: `TXN-REF-${Date.now()}`,
            timestamp: new Date().toISOString(),
            status: 'approved',
          };
          const sanitizedComm = JSON.parse(JSON.stringify(joinCommission));
          setDoc(doc(db, 'commissions', joinCommission.id), sanitizedComm).catch(() => {});
          fetch('/api/commissions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(sanitizedComm),
          }).catch(() => {});
        } catch (err) {}
      }

      // Broadcast registration event across tabs
      try {
        if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
          const bc = new BroadcastChannel('apna_tambola_sync');
          bc.postMessage({ type: 'NEW_USER_REGISTERED', user: updatedUser });
          bc.close();
        }
      } catch (e) {}

      if (onRegisterUser) {
        onRegisterUser(updatedUser);
      }
      playWinningFanfare();
      onLogin(updatedUser);
      onClose();
      return;
    }

    // Create New Registered User (₹10 Bonus will be added on their 1st deposit)
    const resolvedReferralCode = `REF-${name.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase() || 'PLY'}${Math.floor(100 + Math.random() * 900)}`;
    const formattedPhone = `+91 ${phoneDigits}`;
    let newUser: User = {
      id: `usr_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`,
      name: name.trim(),
      email: email ? email.trim() : `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}${phoneDigits.slice(-4)}@tambolalive.com`,
      phone: formattedPhone,
      password: pwd,
      role: 'user',
      status: 'active',
      isBlocked: false,
      walletBalance: 0,
      depositBalance: 0,
      winningBalance: 0,
      referralBalance: 0,
      bonusRewardBalance: 0,
      firstDepositBonusClaimed: false,
      hasDeposited: false,
      referralCode: resolvedReferralCode,
      referredBy: finalReferredByCode || '',
      referredByUserId: finalReferredByUserId || '',
      kycStatus: 'verified',
      avatar: selectedAvatar || AVATAR_OPTIONS[0],
      createdAt: new Date().toISOString(),
      bankDetails: {
        accountName: name.trim(),
        accountNumber: 'XXXXXX' + Math.floor(1000 + Math.random() * 9000),
        ifsc: 'SBIN0001234',
        bankName: 'State Bank of India',
        upiId: `${phoneDigits}@upi`,
      },
    };

    // Save to server backend via REST API for instant cross-device and cross-browser sync
    try {
      const serverRes = await fetch('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: newUser,
          id: newUser.id,
          name: newUser.name,
          phone: newUser.phone,
          email: newUser.email,
          password: newUser.password,
          referralCode: newUser.referralCode,
          referredBy: newUser.referredBy,
          referredByUserId: newUser.referredByUserId,
          referralCodeInput: cleanRefCode || (finalReferrer ? finalReferrer.referralCode : ''),
          selectedAvatar: newUser.avatar,
        }),
      });
      if (serverRes.ok) {
        const serverData = await serverRes.json();
        if (serverData.user) {
          newUser = { ...newUser, ...serverData.user };
        }
        if (serverData.referrer && !finalReferrer) {
          finalReferrer = serverData.referrer;
        }
      }
    } catch (e) {
      console.warn('Server registration call notice:', e);
    }

    // Save to Firestore users collection so all other devices receive this new user in real-time
    try {
      const sanitizedUser = JSON.parse(JSON.stringify(newUser));
      const firestoreSavePromise = setDoc(doc(db, 'users', newUser.id), sanitizedUser);
      const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 1500));
      await Promise.race([firestoreSavePromise, timeoutPromise]).catch((e) =>
        console.warn('Firestore user save notice:', e)
      );
    } catch (err) {
      console.error('Firestore user save error:', err);
    }

    // If referred by another user, update the referrer in Firestore and award direct referral bonus & commission doc
    if (finalReferrer) {
      try {
        const updatedReferrer: User = {
          ...finalReferrer,
          referralBalance: (finalReferrer.referralBalance || 0) + 10,
          walletBalance: (finalReferrer.walletBalance || 0) + 10,
        };
        const sanitizedReferrer = JSON.parse(JSON.stringify(updatedReferrer));
        setDoc(doc(db, 'users', finalReferrer.id), sanitizedReferrer, { merge: true }).catch(() => {});

        // Create direct commission record
        const joinCommission: ReferralCommission = {
          id: `comm_join_${Date.now()}_${newUser.id}`,
          userId: finalReferrer.id,
          userName: finalReferrer.name,
          sourceUserId: newUser.id,
          sourceUserName: newUser.name,
          gameId: 'signup_bonus',
          gameTitle: '🎁 New Direct Referral Join Bonus (Level 1)',
          ticketId: 'REG-DIRECT',
          level: 1,
          percentage: 10,
          baseAmount: 10,
          commissionAmount: 10,
          transactionId: `TXN-REF-${Date.now()}`,
          timestamp: new Date().toISOString(),
          status: 'approved',
        };
        const sanitizedComm = JSON.parse(JSON.stringify(joinCommission));
        setDoc(doc(db, 'commissions', joinCommission.id), sanitizedComm).catch(() => {});

        // Also post commission to server
        fetch('/api/commissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sanitizedComm),
        }).catch(() => {});
      } catch (err) {
        console.warn('Could not update referrer notice:', err);
      }
    }

    // Broadcast registration event across local tabs and windows
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel('apna_tambola_sync');
        bc.postMessage({ type: 'NEW_USER_REGISTERED', user: newUser });
        bc.close();
      }
    } catch (e) {}

    if (onRegisterUser) {
      onRegisterUser(newUser);
    }
    playWinningFanfare();
    onLogin(newUser);
    onClose();
  };

  // ==================== PASSWORD RESET HANDLER ====================
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    const entered = otpDigits.join('');
    if (entered.length < 4) {
      setStatusMessage({
        type: 'error',
        text: lang === 'hi' ? 'कृपया पूरा 4-अंकीय ओटीपी दर्ज करें।' : 'Please enter the complete 4-digit OTP.',
      });
      return;
    }

    if (!resetNewPassword || resetNewPassword.length < 4) {
      setStatusMessage({
        type: 'error',
        text: lang === 'hi' ? 'नया पासवर्ड कम से कम 4 अक्षरों का होना चाहिए।' : 'New password must be at least 4 chars long.',
      });
      return;
    }

    if (resetNewPassword !== resetConfirmPassword) {
      setStatusMessage({
        type: 'error',
        text: lang === 'hi' ? 'दोनों पासवर्ड एक समान नहीं हैं।' : 'Passwords do not match.',
      });
      return;
    }

    const digits = cleanPhone(otpPhone);
    const targetUser = allUsers.find((u) => u.phone && u.phone.replace(/\D/g, '').endsWith(digits));

    if (!targetUser) {
      setStatusMessage({
        type: 'error',
        text: lang === 'hi' ? '❌ यूजर खाता नहीं मिला।' : '❌ User account not found.',
      });
      return;
    }

    const updatedUser: User = {
      ...targetUser,
      password: resetNewPassword,
    };

    try {
      await setDoc(doc(db, 'users', updatedUser.id), updatedUser, { merge: true });
    } catch (e) {
      console.warn('Firestore password reset save notice:', e);
    }

    if (onRegisterUser) {
      onRegisterUser(updatedUser);
    }

    playWinningFanfare();
    setStatusMessage({
      type: 'success',
      text: lang === 'hi' ? '✓ नया पासवर्ड सफलतापूर्वक सेट हो गया! लॉगिन हो रहे हैं...' : '✓ Password reset successfully! Logging in...',
    });

    setTimeout(() => {
      onLogin(updatedUser);
      onClose();
    }, 600);
  };

  // ==================== GOOGLE SIGN-IN ====================
  const handleGoogleSignIn = async () => {
    setIsSigningInGoogle(true);
    setStatusMessage(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      if (!fbUser) throw new Error('No user returned from Google sign in');

      const userDocRef = doc(db, 'users', fbUser.uid);
      let userDoc;
      try {
        userDoc = await getDoc(userDocRef);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `users/${fbUser.uid}`);
      }

      let appUser: User;
      if (userDoc && userDoc.exists()) {
        appUser = userDoc.data() as User;
      } else {
        const isAdmin = fbUser.email === 'ashishbadawat@gmail.com';
        const cleanGRef = referralCodeInput ? referralCodeInput.trim().toUpperCase() : '';
        let googleReferrer = matchedReferrer || null;
        if (!googleReferrer && cleanGRef) {
          googleReferrer = allUsers.find((u) => {
            const uCode = (u.referralCode || '').trim().toUpperCase();
            const uId = (u.id || '').trim().toUpperCase();
            return uCode === cleanGRef || uId === cleanGRef;
          }) || null;
        }

        appUser = {
          id: fbUser.uid,
          name: fbUser.displayName || 'Google Player',
          email: fbUser.email || '',
          phone: fbUser.phoneNumber || '+91 9876543210',
          password: 'google_oauth_user',
          avatar: fbUser.photoURL || AVATAR_OPTIONS[0],
          role: isAdmin ? 'admin' : 'user',
          walletBalance: 10, // ₹10 signup bonus
          depositBalance: 0,
          winningBalance: 10, // ₹10 Free Withdrawal Bonus!
          referralBalance: 0,
          bonusRewardBalance: 0,
          referralCode: `REF-${(fbUser.displayName || 'GOOG').slice(0, 3).toUpperCase()}${Math.floor(100 + Math.random() * 900)}`,
          referredBy: googleReferrer ? (googleReferrer.referralCode || googleReferrer.id || cleanGRef) : (cleanGRef || ''),
          referredByUserId: googleReferrer ? googleReferrer.id : '',
          kycStatus: 'verified',
          createdAt: new Date().toISOString(),
          bankDetails: {
            accountName: fbUser.displayName || 'Google Player',
            accountNumber: 'XXXXXX' + Math.floor(1000 + Math.random() * 9000),
            ifsc: 'HDFC0001234',
            bankName: 'HDFC Bank',
            upiId: `${(fbUser.email || 'player').split('@')[0]}@upi`,
          },
        };

        try {
          const sanitizedGoogleUser = JSON.parse(JSON.stringify(appUser));
          await setDoc(userDocRef, sanitizedGoogleUser);
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `users/${fbUser.uid}`);
        }
      }

      if (onRegisterUser) onRegisterUser(appUser);
      playWinningFanfare();
      onLogin(appUser);
      onClose();
    } catch (error: any) {
      console.error('Google Sign In Error:', error);
      const isUnauthorizedDomain =
        error?.code === 'auth/unauthorized-domain' ||
        error?.message?.includes('unauthorized-domain') ||
        error?.message?.includes('auth/unauthorized-domain');

      if (isUnauthorizedDomain) {
        setStatusMessage({
          type: 'error',
          text:
            lang === 'hi'
              ? 'Google Sign-In: वर्तमान क्लाउड डोमेन Firebase Authorized Domains में नहीं है। कृपया ऊपर दिए गए "मोबाइल नंबर/ईमेल और पासवर्ड" द्वारा लॉगिन या रजिस्टर करें।'
              : 'Google Sign-In: Current domain is not in Firebase Authorized Domains. Please sign in or register using your Mobile Number & Password above.',
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: error?.message || 'Google Sign-In failed. Please try with Mobile Number & Password.',
        });
      }
    } finally {
      setIsSigningInGoogle(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-3xl bg-gradient-to-b from-[#17112c] via-[#0e1428] to-[#120f24] border-2 border-amber-400/50 shadow-2xl shadow-purple-950/80 p-5 sm:p-7 space-y-5 my-auto animate-in zoom-in-95">
        {/* Glow Effects */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Top Controls: Language Switcher + Close */}
        <div className="flex items-center justify-between relative z-10">
          {/* Bilingual Toggle (हिंदी / English) */}
          <div className="flex items-center bg-slate-950/90 rounded-full p-1 border border-purple-500/40">
            <button
              type="button"
              onClick={() => setLang('hi')}
              className={`px-3 py-1 rounded-full text-xs font-black transition-all flex items-center gap-1 cursor-pointer ${
                lang === 'hi'
                  ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🇮🇳 हिंदी</span>
            </button>
            <button
              type="button"
              onClick={() => setLang('en')}
              className={`px-3 py-1 rounded-full text-xs font-black transition-all flex items-center gap-1 cursor-pointer ${
                lang === 'en'
                  ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>English</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-900/90 text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Optional Prompt Reason Banner (e.g. When user clicks protected button) */}
        {loginPromptReason && (
          <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-400/50 text-amber-200 text-xs font-bold flex items-center gap-2 relative z-10 animate-pulse">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{loginPromptReason}</span>
          </div>
        )}

        {/* Brand Logo & Header */}
        <div className="text-center space-y-2 relative z-10">
          <div className="inline-flex items-center justify-center">
            <img
              src="/logo.png"
              alt="Apna Tambola"
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover shadow-2xl shadow-amber-500/40 border-2 border-amber-400/80 animate-pulse"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide">
              {isRegister ? t.titleRegister : t.titleLogin}
            </h2>
            <p className="text-xs text-slate-300 max-w-sm mx-auto mt-0.5">
              {isRegister ? t.subtitleRegister : t.subtitleLogin}
            </p>
          </div>

          {/* Value proposition pill */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 via-purple-500/20 to-pink-500/20 border border-amber-400/40 text-[11px] font-bold text-amber-300 shadow">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
            <span>{t.welcomeBonusPill}</span>
          </div>
        </div>

        {/* Tab Selector: Login vs Register */}
        <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-slate-950/90 border border-slate-800 relative z-10">
          <button
            type="button"
            onClick={() => {
              setIsRegister(false);
              setStatusMessage(null);
            }}
            className={`py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              !isRegister
                ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-md shadow-amber-500/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>{t.loginTab}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegister(true);
              setStatusMessage(null);
            }}
            className={`py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              isRegister
                ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-md shadow-purple-500/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>{t.registerTab}</span>
          </button>
        </div>

        {/* Notification / Error / Success Message */}
        {statusMessage && (
          <div
            className={`p-3 rounded-2xl text-xs font-bold flex flex-col gap-2 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/90 border border-emerald-500/50 text-emerald-300'
                : 'bg-red-950/90 border border-red-500/50 text-red-200 leading-relaxed'
            }`}
          >
            <div className="flex items-start gap-2.5">
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              )}
              <span className="flex-1">{statusMessage.text}</span>
            </div>

            {/* Quick Action Options when already registered */}
            {existingUserFound && (
              <div className="mt-2 pt-2 border-t border-red-800/60 flex flex-col gap-2">
                {(matchedReferrer || referralCodeInput) && (
                  <button
                    type="button"
                    onClick={() => handleLinkReferralAndLogin(existingUserFound)}
                    className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4 text-slate-950" />
                    <span>
                      {lang === 'hi'
                        ? `✓ इस रेफरल (${matchedReferrer?.name || referralCodeInput}) से आईडी जोड़ें और शुरू करें`
                        : `✓ Connect ID to Sponsor (${matchedReferrer?.name || referralCodeInput}) & Login`}
                    </span>
                  </button>
                )}

                <div className="flex flex-col sm:flex-row items-stretch gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegister(false);
                      setIsResetPasswordMode(false);
                      setLoginMethod('password');
                      setLoginIdentifier(existingUserFound.phone.replace(/\D/g, '') || existingUserFound.email);
                      setStatusMessage(null);
                      setExistingUserFound(null);
                    }}
                    className="flex-1 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>{lang === 'hi' ? 'सीधे लॉगिन करें' : 'Sign In Now'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const digits = cleanPhone(existingUserFound.phone);
                      setIsRegister(false);
                      setIsResetPasswordMode(false);
                      setLoginMethod('otp');
                      setOtpPhone(digits);
                      const generated = Math.floor(1000 + Math.random() * 9000).toString();
                      setMockGeneratedOtp(generated);
                      setOtpStep(true);
                      setOtpTimer(30);
                      playNumberCallSound();
                      setStatusMessage({
                        type: 'success',
                        text:
                          lang === 'hi'
                            ? `रजिस्टर्ड मोबाइल नंबर पर OTP ${generated} भेजा गया!`
                            : `OTP ${generated} sent to registered mobile!`,
                      });
                      setExistingUserFound(null);
                    }}
                    className="flex-1 py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>{lang === 'hi' ? 'OTP से लॉगिन' : 'OTP Login'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const digits = cleanPhone(existingUserFound.phone);
                      setIsResetPasswordMode(true);
                      setIsRegister(false);
                      setOtpPhone(digits);
                      const generated = Math.floor(1000 + Math.random() * 9000).toString();
                      setMockGeneratedOtp(generated);
                      setOtpStep(true);
                      setOtpTimer(30);
                      playNumberCallSound();
                      setStatusMessage({
                        type: 'success',
                        text:
                          lang === 'hi'
                            ? `पासवर्ड रीसेट हेतु OTP ${generated} भेजा गया!`
                            : `OTP ${generated} sent for password reset!`,
                      });
                      setExistingUserFound(null);
                    }}
                    className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 font-bold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{lang === 'hi' ? 'पासवर्ड बदलें' : 'Reset Pwd'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================= RESET PASSWORD SCREEN ======================= */}
        {isResetPasswordMode ? (
          <form onSubmit={handleResetPasswordSubmit} className="space-y-3.5 relative z-10 animate-in fade-in">
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-400/40 text-xs text-amber-200 flex items-center justify-between">
              <div>
                <p className="font-bold">{lang === 'hi' ? '🔑 नया पासवर्ड सेट करें' : '🔑 Set New Password'}</p>
                <p className="text-[11px] text-slate-300 font-mono">+91 {otpPhone}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsResetPasswordMode(false);
                  setStatusMessage(null);
                }}
                className="text-xs text-slate-400 hover:text-white underline"
              >
                {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
              </button>
            </div>

            {/* OTP Code Display & Auto-fill */}
            <div className="p-3 rounded-2xl bg-purple-950/60 border border-purple-500/40 text-center space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-950 rounded-xl border border-amber-400/40 text-xs">
                <span className="text-slate-400">OTP Code:</span>
                <strong className="text-amber-400 font-mono font-black text-sm tracking-widest">
                  {mockGeneratedOtp}
                </strong>
                <button
                  type="button"
                  onClick={handleAutoFillOtp}
                  className="ml-1 text-[10px] bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                >
                  {t.autoFillOtp}
                </button>
              </div>

              <div className="flex items-center justify-center gap-2 pt-1">
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`otp-reset-box-${idx}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      const newDigits = [...otpDigits];
                      newDigits[idx] = val;
                      setOtpDigits(newDigits);
                      if (val && idx < 3) {
                        const nextInput = document.getElementById(`otp-reset-box-${idx + 1}`);
                        nextInput?.focus();
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' && !otpDigits[idx] && idx > 0) {
                        const prevInput = document.getElementById(`otp-reset-box-${idx - 1}`);
                        prevInput?.focus();
                      }
                    }}
                    className="w-10 h-12 rounded-xl bg-slate-950 border-2 border-amber-400/50 text-center text-xl font-black text-amber-300 focus:outline-none focus:border-amber-400 font-mono"
                  />
                ))}
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-200">
                {lang === 'hi' ? 'नया पासवर्ड (New Password)' : 'New Password'}
              </label>
              <input
                type="password"
                value={resetNewPassword}
                onChange={(e) => setResetNewPassword(e.target.value)}
                placeholder="New Password (min 4 chars)"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/90 border border-slate-700 text-sm font-bold text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                required
                minLength={4}
              />
            </div>

            {/* Confirm New Password */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-200">
                {lang === 'hi' ? 'कन्फर्म नया पासवर्ड (Confirm Password)' : 'Confirm Password'}
              </label>
              <input
                type="password"
                value={resetConfirmPassword}
                onChange={(e) => setResetConfirmPassword(e.target.value)}
                placeholder="Confirm New Password"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/90 border border-slate-700 text-sm font-bold text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                required
                minLength={4}
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-black text-sm shadow-xl shadow-emerald-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{lang === 'hi' ? 'पासवर्ड अपडेट करें और लॉगिन करें' : 'Update Password & Sign In'}</span>
            </button>
          </form>
        ) : null}

        {/* ======================= LOGIN FORM ======================= */}
        {!isRegister && !isResetPasswordMode && (
          <div className="space-y-4 relative z-10">
            {/* Login Method Toggle: Password vs OTP */}
            <div className="flex items-center justify-center gap-4 text-xs font-bold text-slate-400 pb-1">
              <button
                type="button"
                onClick={() => {
                  setLoginMethod('password');
                  setOtpStep(false);
                  setStatusMessage(null);
                }}
                className={`pb-1 border-b-2 transition-all cursor-pointer ${
                  loginMethod === 'password'
                    ? 'border-amber-400 text-amber-300 font-black'
                    : 'border-transparent hover:text-slate-200'
                }`}
              >
                {t.usePasswordLogin}
              </button>
              <span className="text-slate-600">|</span>
              <button
                type="button"
                onClick={() => {
                  setLoginMethod('otp');
                  setStatusMessage(null);
                }}
                className={`pb-1 border-b-2 transition-all cursor-pointer ${
                  loginMethod === 'otp'
                    ? 'border-amber-400 text-amber-300 font-black'
                    : 'border-transparent hover:text-slate-200'
                }`}
              >
                {t.useOtpLogin}
              </button>
            </div>

            {/* PASSWORD LOGIN FORM */}
            {loginMethod === 'password' && (
              <form onSubmit={handlePasswordLogin} className="space-y-3.5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <UserIcon className="w-3.5 h-3.5 text-amber-400" />
                    <span>{t.loginIdLabel}</span>
                  </label>
                  <input
                    type="text"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder={t.loginIdPlaceholder}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-950/90 border border-slate-700 text-sm font-bold text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      <span>{t.passwordLabel}</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="text-xs text-slate-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                    >
                      {showLoginPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showLoginPassword ? 'Hide' : 'Show'}</span>
                    </button>
                  </div>
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder={t.passwordPlaceholder}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-950/90 border border-slate-700 text-sm font-bold text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    required
                  />
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        const digits = cleanPhone(loginIdentifier);
                        if (digits.length === 10) {
                          setOtpPhone(digits);
                          const generated = Math.floor(1000 + Math.random() * 9000).toString();
                          setMockGeneratedOtp(generated);
                          setOtpStep(true);
                          setOtpTimer(30);
                          playNumberCallSound();
                          setStatusMessage({
                            type: 'success',
                            text:
                              lang === 'hi'
                                ? `पासवर्ड रीसेट हेतु OTP ${generated} भेजा गया!`
                                : `OTP ${generated} sent for password reset!`,
                          });
                        }
                        setIsResetPasswordMode(true);
                      }}
                      className="text-xs text-amber-400 hover:text-amber-300 font-bold hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <span>{lang === 'hi' ? '🔑 पासवर्ड भूल गए? (Reset Password)' : '🔑 Forgot Password?'}</span>
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-98"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{t.loginBtn}</span>
                </button>
              </form>
            )}

            {/* OTP LOGIN FORM (For registered numbers only) */}
            {loginMethod === 'otp' && (
              <div className="space-y-4">
                {!otpStep ? (
                  <form onSubmit={handleSendOtp} className="space-y-3.5">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-200 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-amber-400" />
                        <span>{t.phoneLabel}</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-amber-400 font-mono">
                          +91
                        </span>
                        <input
                          type="tel"
                          maxLength={10}
                          value={otpPhone}
                          onChange={(e) => setOtpPhone(e.target.value.replace(/\D/g, ''))}
                          placeholder={t.phonePlaceholder}
                          className="w-full pl-14 pr-4 py-3 rounded-2xl bg-slate-950/90 border border-slate-700 text-sm font-bold text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono tracking-wider"
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Smartphone className="w-4 h-4" />
                      <span>{t.sendOtp}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="p-3.5 rounded-2xl bg-purple-950/50 border border-purple-500/40 text-center space-y-2">
                      <p className="text-xs text-purple-200">
                        {t.otpSentTo} <strong className="text-amber-400 font-mono">+91 {otpPhone}</strong>
                      </p>
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-950 rounded-xl border border-amber-400/40 text-xs">
                        <span className="text-slate-400">OTP Code:</span>
                        <strong className="text-amber-400 font-mono font-black text-sm tracking-widest">
                          {mockGeneratedOtp}
                        </strong>
                        <button
                          type="button"
                          onClick={handleAutoFillOtp}
                          className="ml-1 text-[10px] bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                        >
                          {t.autoFillOtp}
                        </button>
                      </div>
                    </div>

                    {/* 4-Box OTP Input */}
                    <div className="space-y-1.5 text-center">
                      <div className="flex items-center justify-center gap-3">
                        {otpDigits.map((digit, idx) => (
                          <input
                            key={idx}
                            id={`otp-box-${idx}`}
                            type="text"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '');
                              const newDigits = [...otpDigits];
                              newDigits[idx] = val;
                              setOtpDigits(newDigits);
                              if (val && idx < 3) {
                                const nextInput = document.getElementById(`otp-box-${idx + 1}`);
                                nextInput?.focus();
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Backspace' && !otpDigits[idx] && idx > 0) {
                                const prevInput = document.getElementById(`otp-box-${idx - 1}`);
                                prevInput?.focus();
                              }
                            }}
                            className="w-12 h-14 rounded-2xl bg-slate-950 border-2 border-amber-400/50 text-center text-2xl font-black text-amber-300 focus:outline-none focus:border-amber-400 font-mono shadow-inner"
                          />
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <button
                        type="button"
                        onClick={() => setOtpStep(false)}
                        className="text-slate-400 hover:text-slate-200 underline font-medium cursor-pointer"
                      >
                        Change Number
                      </button>

                      {otpTimer > 0 ? (
                        <span className="text-slate-400 font-mono">
                          {t.resendIn} <strong className="text-amber-400">{otpTimer}s</strong>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            const generated = Math.floor(1000 + Math.random() * 9000).toString();
                            setMockGeneratedOtp(generated);
                            setOtpTimer(30);
                          }}
                          className="text-amber-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>{t.resendOtp}</span>
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleVerifyOtpAndLogin}
                      className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-black text-sm shadow-xl shadow-emerald-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{t.verifyOtpBtn}</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Google Sign-In button */}
            <div className="pt-2">
              <div className="flex items-center my-2 gap-2">
                <div className="flex-1 h-px bg-slate-800" />
                <span className="text-[10px] uppercase font-bold text-slate-500">
                  {lang === 'hi' ? 'या गूगल द्वारा' : 'or with google'}
                </span>
                <div className="flex-1 h-px bg-slate-800" />
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isSigningInGoogle}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-sm disabled:opacity-50"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>
                  {isSigningInGoogle
                    ? 'Connecting...'
                    : lang === 'hi'
                    ? 'Google से सुरक्षित लॉगिन / रजिस्टर करें'
                    : 'Continue with Google'}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* ======================= REGISTER FORM ======================= */}
        {isRegister && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3 relative z-10">
            {/* Avatar Selector */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300 block">{t.chooseAvatar}</label>
              <div className="flex items-center justify-center gap-2 overflow-x-auto py-1">
                {AVATAR_OPTIONS.map((av, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedAvatar(av)}
                    className={`relative rounded-2xl p-0.5 transition-all cursor-pointer ${
                      selectedAvatar === av
                        ? 'ring-2 ring-amber-400 scale-110 shadow-lg shadow-amber-500/30'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={av} alt="Avatar" className="w-9 h-9 rounded-2xl object-cover" />
                    {selectedAvatar === av && (
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-400 text-slate-950 rounded-full flex items-center justify-center text-[9px] font-black">
                        ✓
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Name */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1">
                <UserIcon className="w-3.5 h-3.5 text-amber-400" />
                <span>{t.nameLabel}</span>
              </label>
              <input
                type="text"
                value={registerName}
                onChange={(e) => setRegisterName(e.target.value)}
                placeholder={t.namePlaceholder}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950/90 border border-slate-700 text-xs font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                required
              />
            </div>

            {/* Phone */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-amber-400" />
                <span>{t.phoneLabel}</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-amber-400 font-mono">
                  +91
                </span>
                <input
                  type="tel"
                  maxLength={10}
                  value={registerPhone}
                  onChange={(e) => setRegisterPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder={t.phonePlaceholder}
                  className="w-full pl-14 pr-3.5 py-2 rounded-xl bg-slate-950/90 border border-slate-700 text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
                  required
                />
              </div>
            </div>

            {/* Email (Optional) */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-purple-400" />
                <span>{t.emailLabel}</span>
              </label>
              <input
                type="email"
                value={registerEmail}
                onChange={(e) => setRegisterEmail(e.target.value)}
                placeholder={t.emailPlaceholder}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950/90 border border-slate-700 text-xs font-medium text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>{t.regPasswordLabel}</span>
                </label>
                <input
                  type={showRegisterPassword ? 'text' : 'password'}
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950/90 border border-slate-700 text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  required
                  minLength={4}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{t.confirmPasswordLabel}</span>
                </label>
                <input
                  type={showRegisterPassword ? 'text' : 'password'}
                  value={registerConfirmPassword}
                  onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                  placeholder="Confirm Password"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950/90 border border-slate-700 text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  required
                />
              </div>
            </div>

            {/* Referral Code */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1">
                  <Gift className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{t.refLabel}</span>
                </label>
                <span className="text-[10px] text-emerald-400 font-bold">{t.refBonusText}</span>
              </div>
              <input
                type="text"
                value={referralCodeInput}
                onChange={(e) => setReferralCodeInput(e.target.value.toUpperCase())}
                placeholder={t.refPlaceholder}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/90 border border-slate-700 text-xs font-mono font-black text-amber-300 placeholder-slate-500 focus:outline-none focus:border-emerald-400 uppercase tracking-wider"
              />

              {/* UPLINE / SPONSOR NAME IN PROMINENT GREEN COLOR */}
              {matchedReferrer ? (
                <div className="p-3 rounded-2xl bg-emerald-950/80 border-2 border-emerald-500 text-emerald-300 shadow-xl shadow-emerald-950/60 mt-2 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between pb-2 border-b border-emerald-800/60">
                    <div className="flex items-center gap-1.5 text-xs font-black text-emerald-400">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>✓ मान्य रेफरल कोड (Verified Sponsor)</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black uppercase">
                      Level 1 Upline
                    </span>
                  </div>

                  <div className="pt-2.5 flex items-center gap-3">
                    <img
                      src={matchedReferrer.avatar || AVATAR_OPTIONS[0]}
                      alt={matchedReferrer.name}
                      className="w-11 h-11 rounded-xl object-cover border-2 border-emerald-400 shadow-md shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-bold text-emerald-300/80">
                        अपलाइन का नाम (Sponsor / Upline Name):
                      </div>
                      {/* Upline name highlighted in vivid green color */}
                      <div className="text-base sm:text-lg font-black text-emerald-400 tracking-wide drop-shadow truncate">
                        {matchedReferrer.name}
                      </div>
                      <div className="text-[10px] sm:text-[11px] text-emerald-300 font-mono font-bold flex items-center gap-2 flex-wrap mt-0.5">
                        <span>रेफरल कोड: <strong className="text-white font-mono">{matchedReferrer.referralCode || matchedReferrer.id}</strong></span>
                        {matchedReferrer.phone && (
                          <span>मोबाइल: <strong className="text-white font-mono">{matchedReferrer.phone}</strong></span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-emerald-800/50 text-[11px] font-bold text-emerald-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>
                      आप सीधे <strong className="text-emerald-400 underline font-black">{matchedReferrer.name}</strong> के डायरेक्ट नेटवर्क (Level 1) में शामिल हो रहे हैं!
                    </span>
                  </div>
                </div>
              ) : isCheckingReferral ? (
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-2 mt-1">
                  <div className="w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                  <span>अपलाइन स्पॉन्सर खोजा जा रहा है...</span>
                </div>
              ) : referralCodeInput.trim().length >= 3 ? (
                <div className="p-2.5 rounded-xl bg-slate-900/90 border border-amber-500/40 text-amber-300 text-xs font-semibold flex items-center justify-between mt-1">
                  <div className="flex items-center gap-2">
                    <Gift className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>रेफरल कोड दर्ज: <strong className="font-mono text-white">{referralCodeInput}</strong></span>
                  </div>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-mono font-bold">Direct L1</span>
                </div>
              ) : null}
            </div>

            {/* Terms checkbox */}
            <label className="flex items-center gap-2 text-[11px] text-slate-300 cursor-pointer pt-0.5">
              <input
                type="checkbox"
                checked={agreedTerms}
                onChange={(e) => setAgreedTerms(e.target.checked)}
                className="rounded accent-amber-500 w-4 h-4 cursor-pointer"
                required
              />
              <span>{t.agreeTerms}</span>
            </label>

            {/* Submit Register Button */}
            <button
              type="submit"
              disabled={!agreedTerms}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 hover:scale-[1.02]"
            >
              <Gift className="w-4 h-4" />
              <span>{t.registerBtn}</span>
            </button>
          </form>
        )}

        {/* Footer Toggle / Logout Option */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs relative z-10">
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setOtpStep(false);
              setStatusMessage(null);
            }}
            className="text-amber-400 hover:text-amber-300 font-bold hover:underline cursor-pointer"
          >
            {isRegister ? t.haveAccount : t.noAccount}
          </button>

          {currentUser && onLogout && (
            <button
              type="button"
              onClick={() => {
                onLogout();
                setStatusMessage({
                  type: 'success',
                  text: lang === 'hi' ? 'सफलतापूर्वक लॉगआउट किया गया' : 'Logged out successfully',
                });
              }}
              className="text-red-400 hover:text-red-300 font-bold flex items-center gap-1 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>लॉगआउट</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
export default AuthModal;
