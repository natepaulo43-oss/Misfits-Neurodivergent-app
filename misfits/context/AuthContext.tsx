import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { MultiFactorResolver } from 'firebase/auth';

import { User, UserRole } from '../types';
import * as authApi from '../services/auth';
import { auth } from '../services/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isLoading: boolean;
  isAuthenticated: boolean;
  emailVerified: boolean;
  mfaResolver: MultiFactorResolver | null;
  mfaRequired: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  setUserRole: (role: UserRole) => Promise<void>;
  requestMentorAccess: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  verifyMfaCode: (verificationId: string, code: string) => Promise<void>;
  clearMfaResolver: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [emailVerified, setEmailVerified] = useState(false);
  const [mfaResolver, setMfaResolver] = useState<MultiFactorResolver | null>(null);

  useEffect(() => {
    const unsubscribe = authApi.subscribeToAuthChanges(authUser => {
      setUser(authUser);
      setEmailVerified(auth.currentUser?.emailVerified ?? false);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const withLoading = async <T,>(action: () => Promise<T>): Promise<T> => {
    setIsLoading(true);
    try {
      return await action();
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithEmail = async (email: string, password: string) => {
    await withLoading(async () => {
      try {
        const loggedInUser = await authApi.login({ email, password });
        setUser(loggedInUser);
      } catch (error: any) {
        if (error?.code === 'auth/multi-factor-auth-required' && error?.resolver) {
          setMfaResolver(error.resolver);
          throw new Error('MFA verification required');
        }
        throw error;
      }
    });
  };

  const login = loginWithEmail;

  const loginWithGoogle = async () => {
    await withLoading(async () => {
      try {
        const loggedInUser = await authApi.loginWithGoogleAccount();
        setUser(loggedInUser);
      } catch (error: any) {
        if (error?.code === 'auth/multi-factor-auth-required' && error?.resolver) {
          setMfaResolver(error.resolver);
          throw new Error('MFA verification required');
        }
        throw error;
      }
    });
  };

  const signUp = async (name: string, email: string, password: string) => {
    await withLoading(async () => {
      const newUser = await authApi.signUp({ name, email, password });
      setUser(newUser);
    });
  };

  const sendPasswordReset = async (email: string) => {
    await withLoading(async () => {
      await authApi.sendPasswordReset(email);
    });
  };

  const logout = async () => {
    await withLoading(async () => {
      await authApi.logout();
      setUser(null);
    });
  };

  const setUserRole = async (role: UserRole) => {
    if (!user) return;
    await authApi.updateUserRole(user.id, role);
    setUser({
      ...user,
      role,
      pendingRole: null,
      mentorApplicationStatus: role === 'mentor' ? 'approved' : user.mentorApplicationStatus,
    });
  };

  const requestMentorAccess = async () => {
    if (!user) return;
    const updatedUser = await authApi.updateUserProfile(user.id, {
      pendingRole: 'mentor',
      mentorApplicationStatus: 'draft',
    });
    setUser(updatedUser);
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) return;
    const updatedUser = await authApi.updateUserProfile(user.id, updates);
    setUser(updatedUser);
  };

  const verifyMfaCode = async (verificationId: string, code: string) => {
    if (!mfaResolver) {
      throw new Error('No MFA resolver available');
    }
    await authApi.completeMfaSignIn(mfaResolver, verificationId, code);
    setMfaResolver(null);
  };

  const clearMfaResolver = () => {
    setMfaResolver(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading: isLoading,
        isLoading,
        isAuthenticated: !!user,
        emailVerified,
        mfaResolver,
        mfaRequired: !!mfaResolver,
        login,
        loginWithEmail,
        loginWithGoogle,
        signUp,
        sendPasswordReset,
        logout,
        setUserRole,
        requestMentorAccess,
        updateProfile,
        verifyMfaCode,
        clearMfaResolver,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
