import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { UserProfile, UserRole } from '../../types/index.ts';
import {
  initializePrototypeStore,
  prototypeSignIn,
  prototypeRegisterCustomer,
  prototypeRegisterUser,
  prototypeSignOut,
  getPrototypeSessionUser,
  prototypeAssignRole,
  StoredUser,
} from '../../services/storage/prototypeStorage.ts';
import {
  RoleVerificationStatus,
  resolveUserRoles,
} from './roleResolution.ts';

export interface AuthUser {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
  };
  created_at?: string;
}

export interface AuthContextValue {
  user: AuthUser | null;
  session: { token: string } | null;
  profile: UserProfile | null;
  role: UserRole | null;
  roleVerificationStatus: RoleVerificationStatus;
  roleError: string | null;
  isLoading: boolean;
  isConfigured: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string; role?: UserRole | null }>;
  signUpCustomer: (email: string, password: string, fullName?: string) => Promise<{ success: boolean; error?: string; confirmationRequired?: boolean }>;
  signUpUser: (
    email: string,
    password: string,
    accountType: 'customer' | 'vendor',
    fullName?: string,
    shopName?: string,
    shopDetails?: {
      description?: string;
      categoryId?: string;
      addressText?: string;
      landmark?: string;
      initialProducts?: Array<{
        name: string;
        description?: string;
        categoryId?: string;
        price: number;
        unit?: string;
        quantity?: number;
      }>;
    }
  ) => Promise<{ success: boolean; error?: string; isPendingVendor?: boolean }>;
  signOut: () => Promise<void>;
  retryRoleResolution: () => Promise<void>;
  grantRole: (targetUserId: string, roleToGrant: UserRole) => Promise<{ success: boolean; error?: string }>;
  isDemoSession: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [roleVerificationStatus, setRoleVerificationStatus] = useState<RoleVerificationStatus>('idle');
  const [roleError, setRoleError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Self-contained prototype is fully configured by default
  const isConfigured = true;
  // Strict Security Requirement: No demo bypasses or automatic demo sessions
  const isDemoSession = false;

  const syncUserFromStore = useCallback((storedUser: StoredUser | null) => {
    if (!storedUser) {
      setUser(null);
      setProfile(null);
      setRole(null);
      setRoleVerificationStatus('idle');
      setRoleError(null);
      return;
    }

    const authUser: AuthUser = {
      id: storedUser.id,
      email: storedUser.email,
      user_metadata: {
        full_name: storedUser.displayName,
      },
      created_at: storedUser.createdAt,
    };

    // Authoritative role resolution from store record
    const resolution = resolveUserRoles({
      dbRoles: storedUser.roles.map((r) => ({ role: r })),
      dbError: null,
      userMetadata: authUser.user_metadata,
    });

    const userProfile: UserProfile = {
      id: storedUser.id,
      email: storedUser.email,
      displayName: storedUser.displayName,
      preferredLanguage: storedUser.preferredLanguage,
      roles: resolution.roles,
      createdAt: storedUser.createdAt,
      updatedAt: storedUser.updatedAt,
    };

    setUser(authUser);
    setProfile(userProfile);
    setRole(resolution.activeRole);
    setRoleVerificationStatus(resolution.status);
    setRoleError(resolution.error);
  }, []);
  // Restore session from local storage on mount
  useEffect(() => {
    let mounted = true;

    const restoreSession = async () => {
      try {
        await initializePrototypeStore();
        if (mounted) {
          const sessionUser = getPrototypeSessionUser();
          syncUserFromStore(sessionUser);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('[AuthContext] Failed to restore session from local storage:', err);
        if (mounted) setIsLoading(false);
      }
    };

    restoreSession();

    return () => {
      mounted = false;
    };
  }, [syncUserFromStore]);

  const signIn = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string; role?: UserRole | null }> => {
    try {
      const result = await prototypeSignIn(email, password);
      if (!result.success || !result.user) {
        return { success: false, error: result.error || 'Invalid email or password.' };
      }

      syncUserFromStore(result.user);
      const activeRole = result.user.roles.includes('admin')
        ? 'admin'
        : result.user.roles.includes('vendor')
        ? 'vendor'
        : 'customer';

      return { success: true, role: activeRole };
    } catch (err: unknown) {
      const msg = (err as Error)?.message || 'Authentication error occurred.';
      return { success: false, error: msg };
    }
  };

  const signUpUser = async (
    email: string,
    password: string,
    accountType: 'customer' | 'vendor',
    fullName?: string,
    shopName?: string,
    shopDetails?: {
      description?: string;
      categoryId?: string;
      addressText?: string;
      landmark?: string;
      initialProducts?: Array<{
        name: string;
        description?: string;
        categoryId?: string;
        price: number;
        unit?: string;
        quantity?: number;
      }>;
    }
  ): Promise<{ success: boolean; error?: string; isPendingVendor?: boolean }> => {
    try {
      const result = await prototypeRegisterUser(
        email,
        password,
        accountType,
        fullName,
        shopName,
        shopDetails
      );
      if (!result.success || !result.user) {
        return { success: false, error: result.error || 'Failed to register account.' };
      }

      syncUserFromStore(result.user);
      return { success: true, isPendingVendor: result.isPendingVendor };
    } catch (err: unknown) {
      const msg = (err as Error)?.message || 'Registration error occurred.';
      return { success: false, error: msg };
    }
  };

  const signUpCustomer = async (
    email: string,
    password: string,
    fullName?: string
  ): Promise<{ success: boolean; error?: string; confirmationRequired?: boolean }> => {
    const res = await signUpUser(email, password, 'customer', fullName);
    return { success: res.success, error: res.error, confirmationRequired: false };
  };

  const signOut = async (): Promise<void> => {
    prototypeSignOut();
    setUser(null);
    setProfile(null);
    setRole(null);
    setRoleVerificationStatus('idle');
    setRoleError(null);
  };

  const retryRoleResolution = async (): Promise<void> => {
    const sessionUser = getPrototypeSessionUser();
    syncUserFromStore(sessionUser);
  };

  const grantRole = async (
    targetUserId: string,
    roleToGrant: UserRole
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Not authenticated.' };
    const res = prototypeAssignRole(user.id, targetUserId, roleToGrant);
    if (res.success && targetUserId === user.id) {
      const refreshed = getPrototypeSessionUser();
      syncUserFromStore(refreshed);
    }
    return res;
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session: user ? { token: 'proto_session_token' } : null,
      profile,
      role,
      roleVerificationStatus,
      roleError,
      isLoading,
      isConfigured,
      signIn,
      signUpCustomer,
      signUpUser,
      signOut,
      retryRoleResolution,
      grantRole,
      isDemoSession,
    }),
    [
      user,
      profile,
      role,
      roleVerificationStatus,
      roleError,
      isLoading,
      isConfigured,
      isDemoSession,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
