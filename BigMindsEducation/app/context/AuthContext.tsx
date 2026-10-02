import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useRef,
  ReactNode,
} from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import {
  authService,
  User,
  AuthState,
  LoginCredentials,
  RegisterData,
} from '../services/authService';

// ─────────────────────────────────────────────
// Action Types
// ─────────────────────────────────────────────

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'CLEAR_ERROR' };

// ─────────────────────────────────────────────
// Initial State
// ─────────────────────────────────────────────

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,   // true taake splash/loading screen dikhaye app start pe
  error: null,
};

// ─────────────────────────────────────────────
// Reducer
// ─────────────────────────────────────────────

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_START':
      return { ...state, isLoading: true, error: null };

    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        // BUG FIX: Sirf actual error message set karo, empty string nahi
        error: action.payload || null,
      };

    case 'AUTH_LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };

    case 'UPDATE_USER':
      return { ...state, user: action.payload };

    case 'CLEAR_ERROR':
      return { ...state, error: null };

    default:
      return state;
  }
}

// ─────────────────────────────────────────────
// Context Interface
// ─────────────────────────────────────────────

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  clearError: () => void;
  refreshUser: () => Promise<void>;
  getUserRole: () => 'student' | 'teacher' | 'admin' | null;
  isStudent: () => boolean;
  isTeacher: () => boolean;
  isAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // BUG FIX: Track whether component is still mounted
  // Prevents "Can't perform state update on unmounted component"
  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // App start pe auth check
  useEffect(() => {
    initializeAuth();
  }, []);

  // ── Navigation Helper ──────────────────────
  // BUG FIX: '/auth' route exist nahi karta — '/auth/login' sahi hai
  // BUG FIX: 'institute' role ko handle karna add kiya
  const navigateToRoleDashboard = (
    role: 'student' | 'teacher' | 'admin' | 'institute'
  ) => {
    try {
      switch (role) {
        case 'student':
          router.replace('/(tabs)');
          break;
        case 'teacher':
          // BUG FIX: push ki jagah replace — back button se login screen na dikhe
          router.replace('/teacher-dashboard' as any);
          break;
        case 'admin':
        case 'institute':
          router.replace('/admin-panel' as any);
          break;
        default:
          router.replace('/(tabs)');
      }
    } catch (error) {
      console.error('[Auth] Navigation error:', error);
      router.replace('/(tabs)');
    }
  };

  // ── Initialize Auth ────────────────────────
  const initializeAuth = async () => {
    try {
      // Token aur user AsyncStorage se load karo
      const token = await authService.getToken();

      // BUG FIX: Agar token nahi hai toh AUTH_FAILURE (with error) dispatch mat karo
      // Yeh normal "not logged in" case hai — sirf AUTH_LOGOUT karo
      if (!token) {
        dispatch({ type: 'AUTH_LOGOUT' });
        return;
      }

      // Token hai toh server se fresh user data fetch karo
      const user = await authService.getCurrentUser();

      if (!user) {
        // Token expire ho gaya ya invalid hai
        await authService.logout(); // token clear karo
        dispatch({ type: 'AUTH_LOGOUT' });
        return;
      }

      if (isMounted.current) {
        dispatch({ type: 'AUTH_SUCCESS', payload: { user, token } });

        // BUG FIX: Navigation tab mount hone ke baad ho — delay zaruri hai
        // Pehle state settle ho, phir navigate karo
        setTimeout(() => {
          navigateToRoleDashboard(user.role);
        }, 300);
      }
    } catch (error) {
      console.error('[Auth] Init error:', error);
      if (isMounted.current) {
        // BUG FIX: Init failure pe error message user ko mat dikhao
        // Sirf silently logout karo
        dispatch({ type: 'AUTH_LOGOUT' });
      }
    }
  };

  // ── Login ──────────────────────────────────
  const login = async (credentials: LoginCredentials) => {
    try {
      dispatch({ type: 'AUTH_START' });

      const response = await authService.login(credentials);

      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user: response.user, token: response.token },
      });

      // BUG FIX: Double setTimeout hata diya — ek hi navigate call karo
      // Success alert ke baad navigate karo
      /* Alert.alert('Welcome Back!', response.message || 'Login successful', [
        {
          text: 'Continue',
          onPress: () => navigateToRoleDashboard(response.user.role),
        },
      ]); */
      navigateToRoleDashboard(response.user.role);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Login failed. Please try again.';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      Alert.alert('Login Failed', errorMessage);
    }
  };

  // ── Register ───────────────────────────────
  const register = async (userData: RegisterData) => {
    try {
      dispatch({ type: 'AUTH_START' });

      const response = await authService.register(userData);

      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user: response.user, token: response.token },
      });

      /* Alert.alert(
        'Account Created!',
        response.message || 'Registration successful',
        [
          {
            text: 'Get Started',
            onPress: () => navigateToRoleDashboard(response.user.role),
          },
        ]
      ); */
      navigateToRoleDashboard(response.user.role);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Registration failed. Please try again.';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      Alert.alert('Registration Failed', errorMessage);
    }
  };

  // ── Logout ─────────────────────────────────
  const logout = async () => {
    try {
      await authService.logout();
      dispatch({ type: 'AUTH_LOGOUT' });

      // BUG FIX: '/auth' exist nahi karta — '/auth/login' correct route hai
      router.replace('/auth/login');
    } catch (error) {
      console.error('[Auth] Logout error:', error);
      // BUG FIX: Server error pe bhi local logout karo
      dispatch({ type: 'AUTH_LOGOUT' });
      router.replace('/auth/login');
    }
  };

  // ── Update Profile ─────────────────────────
  const updateProfile = async (updates: Partial<User>) => {
    try {
      const updatedUser = await authService.updateProfile(updates);
      if (updatedUser) {
        dispatch({ type: 'UPDATE_USER', payload: updatedUser });
        Alert.alert('Success', 'Profile updated successfully!');
      } else {
        Alert.alert('Error', 'Failed to update profile. Please try again.');
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Update failed';
      console.error('[Auth] Update profile error:', error);
      Alert.alert('Error', msg);
    }
  };

  // ── Refresh User ───────────────────────────
  const refreshUser = async () => {
    try {
      const user = await authService.refreshUserData();
      if (user && isMounted.current) {
        dispatch({ type: 'UPDATE_USER', payload: user });
      }
    } catch (error) {
      console.error('[Auth] Refresh user error:', error);
      // Silent fail — user ko disturb mat karo
    }
  };

  // ── Helpers ────────────────────────────────
  const clearError = () => dispatch({ type: 'CLEAR_ERROR' });

  // BUG FIX: 'institute' removed from getUserRole return type — components mein mismatch tha
  const getUserRole = (): 'student' | 'teacher' | 'admin' | null => {
    return (state.user?.role as 'student' | 'teacher' | 'admin') ?? null;
  };

  const isStudent = () => state.user?.role === 'student';
  const isTeacher = () => state.user?.role === 'teacher';
  const isAdmin = () => state.user?.role === 'admin';

  // ── Context Value ──────────────────────────
  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    updateProfile,
    clearError,
    refreshUser,
    getUserRole,
    isStudent,
    isTeacher,
    isAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export type { AuthContextType };
