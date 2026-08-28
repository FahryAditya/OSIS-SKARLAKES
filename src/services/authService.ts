import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
];

const googleProvider = new GoogleAuthProvider();
SCOPES.forEach(scope => googleProvider.addScope(scope));
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

let isSigningIn = false;
let cachedAccessToken: string | null = null;

const STORAGE_KEYS = {
  ADMIN_ACCOUNTS: 'org_app_admin_accounts_v1',
};

export interface AdminAccount {
  id: string;
  email: string;
  password: string;
  displayName: string;
  role: string;
  sekbidId?: number;
  createdAt: string;
}

export interface UserCustomProfile {
  role?: string;
  division?: string;
  phone?: string;
}

const DEFAULT_ADMIN_ACCOUNTS: AdminAccount[] = [
  {
    id: 'acc-admin-01',
    email: 'admin@osis.sch.id',
    password: 'admin.osis1',
    displayName: 'Administrator OSIS',
    role: 'Administrator (Ketua Umum OSIS)',
    createdAt: '2026-01-01',
  },
  {
    id: 'acc-bendahara-01',
    email: 'bendahara@osis.sch.id',
    password: 'bendahara123',
    displayName: 'Bendahara Umum OSIS',
    role: 'Bendahara Umum',
    createdAt: '2026-01-01',
  },
  {
    id: 'acc-sekretaris-01',
    email: 'sekretaris@osis.sch.id',
    password: 'sekretaris123',
    displayName: 'Sekretaris Umum OSIS',
    role: 'Sekretaris Umum',
    createdAt: '2026-01-01',
  },
  {
    id: 'acc-admin-02',
    email: 'administrator@osis.sch.id',
    password: 'administrator112',
    displayName: 'Fahry Aditya Setiawan',
    role: 'Administrator (Ketua Umum OSIS)',
    createdAt: '2026-01-01',
  }
];

export function getAdminAccounts(): AdminAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ADMIN_ACCOUNTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure default accounts exist if missing
        const hasFahry = parsed.some(a => a.email.toLowerCase() === 'administrator@osis.sch.id');
        if (!hasFahry) {
          const merged = [...parsed, DEFAULT_ADMIN_ACCOUNTS[3]];
          localStorage.setItem(STORAGE_KEYS.ADMIN_ACCOUNTS, JSON.stringify(merged));
          saveAdminAccounts(merged);
          return merged;
        }
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to parse admin accounts:', e);
  }
  // Initialize default
  localStorage.setItem(STORAGE_KEYS.ADMIN_ACCOUNTS, JSON.stringify(DEFAULT_ADMIN_ACCOUNTS));
  saveAdminAccounts(DEFAULT_ADMIN_ACCOUNTS);
  return DEFAULT_ADMIN_ACCOUNTS;
}

export function saveAdminAccounts(accounts: AdminAccount[]): void {
  localStorage.setItem(STORAGE_KEYS.ADMIN_ACCOUNTS, JSON.stringify(accounts));

  // Auto-sync accounts to NeonDB serverless backend
  fetch('/api/db/admin-accounts/bulk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accounts }),
  }).catch(err => console.warn('Sync admin accounts to NeonDB failed:', err));
}

export function addAdminAccount(account: Omit<AdminAccount, 'id' | 'createdAt'>): AdminAccount {
  const accounts = getAdminAccounts();
  const newAccount: AdminAccount = {
    ...account,
    id: `acc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    createdAt: new Date().toISOString().split('T')[0],
  };
  const updated = [...accounts, newAccount];
  saveAdminAccounts(updated);
  return newAccount;
}

export function updateAdminAccount(id: string, updatedFields: Partial<AdminAccount>): void {
  const accounts = getAdminAccounts();
  const updated = accounts.map(a => a.id === id ? { ...a, ...updatedFields } : a);
  saveAdminAccounts(updated);
}

export function deleteAdminAccount(id: string): void {
  const accounts = getAdminAccounts();
  const updated = accounts.filter(a => a.id !== id);
  saveAdminAccounts(updated);
}

export function getCurrentStoredSession(): User | null {
  // Sessions are intentionally memory-only.
  return null;
}

export function setStoredSession(user: User | null): void {
  // Do not persist authentication sessions in browser storage.
}

function createSyntheticUser(account: AdminAccount): User {
  const syntheticUser = {
    uid: account.id,
    email: account.email,
    displayName: account.displayName,
    photoURL: null,
    emailVerified: true,
    isAnonymous: false,
    metadata: {},
    providerData: [],
    refreshToken: '',
    tenantId: null,
    delete: async () => {},
    getIdToken: async () => 'mock-token',
    getIdTokenResult: async () => ({} as any),
    reload: async () => {},
    toJSON: () => ({}),
    phoneNumber: null,
    providerId: 'password',
    role: account.role,
  } as unknown as User;

  return syntheticUser;
}

function createApiUser(data: any): User {
  return {
    uid: data.uid,
    email: data.email,
    displayName: data.displayName,
    role: data.role,
    photoURL: null,
    emailVerified: true,
    isAnonymous: false,
    metadata: {},
    providerData: [],
    refreshToken: '',
    tenantId: null,
    delete: async () => {},
    getIdToken: async () => 'neondb-session',
    getIdTokenResult: async () => ({} as any),
    reload: async () => {},
    toJSON: () => ({}),
    phoneNumber: null,
    providerId: 'password',
  } as unknown as User;
}

export const initAuth = (
  onAuthSuccess?: (user: User, token: string | null) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      setStoredSession(user);
      if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Sign in with Email and Password
 * Supports both custom Administrator-created accounts and Firebase Auth
 */
export const signInWithEmail = async (email: string, password: string): Promise<User> => {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPassword = password.trim();

  // Administrator accounts are checked centrally in NeonDB so every device uses the same accounts.
  try {
    const response = await fetch('/api/db/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, password: cleanPassword }),
    });
    if (response.ok) {
      const data = await response.json();
      return createApiUser(data.user);
    }
  } catch (error) {
    console.warn('NeonDB login unavailable, trying Firebase:', error);
  }

  // Try Firebase Authentication for Google/Firebase-managed users.
  try {
    const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
    setStoredSession(userCredential.user);
    return userCredential.user;
  } catch (error: any) {
    console.error('Email sign in error:', error);
    throw new Error(getFriendlyAuthErrorMessage(error));
  }
};

/**
 * Register with Email and Password
 */
export const registerWithEmail = async (
  email: string, 
  password: string, 
  displayName: string,
  role: string = 'Pengurus OSIS'
): Promise<User> => {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPassword = password.trim();

  // Check duplicate
  const adminAccounts = getAdminAccounts();
  if (adminAccounts.some(a => a.email.trim().toLowerCase() === cleanEmail)) {
    throw new Error('Alamat email ini sudah terdaftar sebagai akun Administrator/Pengurus.');
  }

  // Try Firebase first
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPassword);
    const user = userCredential.user;

    await updateProfile(user, {
      displayName: displayName.trim(),
    });

    // Also add to Admin accounts list so Administrator can manage it
    addAdminAccount({
      email: cleanEmail,
      password: cleanPassword,
      displayName: displayName.trim(),
      role,
    });

    setStoredSession(user);
    return user;
  } catch (error: any) {
    // If Firebase fails (e.g. offline or unauthorized), create in Admin Accounts store
    const newAdminAcc = addAdminAccount({
      email: cleanEmail,
      password: cleanPassword,
      displayName: displayName.trim(),
      role,
    });

    const user = createSyntheticUser(newAdminAcc);
    setStoredSession(user);
    return user;
  }
};

/**
 * Reset password via email
 */
export const resetPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email.trim());
  } catch (error: any) {
    // If Firebase fails, check if in local accounts
    const cleanEmail = email.trim().toLowerCase();
    const adminAccounts = getAdminAccounts();
    const acc = adminAccounts.find(a => a.email.trim().toLowerCase() === cleanEmail);
    if (acc) {
      // In local mode, return success note
      return;
    }
    console.error('Password reset error:', error);
    throw new Error(getFriendlyAuthErrorMessage(error));
  }
};

/**
 * Google Sign In Popup
 */
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Gagal mendapatkan token akses dari Google Auth');
    }

    cachedAccessToken = credential.accessToken;
    setStoredSession(result.user);
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign in error:', error);
    throw new Error(getFriendlyAuthErrorMessage(error));
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const setCachedAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

export const logoutUser = async () => {
  setStoredSession(null);
  cachedAccessToken = null;
  try {
    await signOut(auth);
  } catch (e) {
    console.warn('Sign out error:', e);
  }
};

export const logoutGoogle = logoutUser;

/**
 * Translate Firebase Auth error codes to user-friendly Indonesian messages
 */
export function getFriendlyAuthErrorMessage(error: any): string {
  const code = error?.code || '';
  switch (code) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Email atau kata sandi tidak cocok. Silakan periksa kembali.';
    case 'auth/email-already-in-use':
      return 'Email ini sudah terdaftar. Silakan gunakan tab Masuk atau gunakan email lain.';
    case 'auth/invalid-email':
      return 'Format alamat email tidak valid.';
    case 'auth/weak-password':
      return 'Kata sandi terlalu lemah. Gunakan minimal 6 karakter kombinasi huruf dan angka.';
    case 'auth/too-many-requests':
      return 'Terlalu banyak percobaan gagal. Silakan tunggu beberapa saat atau reset kata sandi.';
    case 'auth/popup-closed-by-user':
      return 'Jendela login Google ditutup sebelum proses selesai.';
    case 'auth/network-request-failed':
      return 'Koneksi internet bermasalah. Periksa jaringan Anda dan coba lagi.';
    default:
      return error?.message || 'Terjadi kesalahan saat autentikasi. Silakan coba lagi.';
  }
}
