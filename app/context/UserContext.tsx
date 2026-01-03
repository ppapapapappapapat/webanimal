'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define the User type
export type User = {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'user' | 'admin';
  profileImage?: string;
  createdAt: Date;
  updatedAt: Date;
  preferences?: {
    theme?: 'light' | 'dark';
    notifications?: boolean;
    language?: string;
  };
  otp_enabled?: boolean; // NEW: OTP status
};

interface UserContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  updateUserProfile: (updatedUser: User) => Promise<boolean>;
  setUser: (user: User | null) => void;
  clearError: () => void;
  checkOtpStatus: (userId: string) => Promise<{ otp_enabled: boolean }>;
  enableOtp: (userId: string, password: string) => Promise<boolean>;
  disableOtp: (userId: string, password: string) => Promise<boolean>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Function to get the correct backend URL based on device
const getBackendUrl = () => {
  if (typeof window === 'undefined') {
    return 'http://localhost:3001';
  }

  const isLocalhost = window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';

  if (isLocalhost) {
    return 'http://localhost:3001';
  } else {
    // Use your computer's IP - make sure this matches your actual IP
    //return 'http://10.82.64.38:3001';
    return 'http://192.168.100.77:3001';
  }
};

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuthStatus = () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        localStorage.removeItem('user');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const backendUrl = getBackendUrl();
      console.log('🔄 Attempting login to:', backendUrl);
      console.log('📧 Email:', email);

      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(`${backendUrl}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: email,
          password: password
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      console.log('📡 Login response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Login successful:', result);

        // Check if OTP is required
        if (result.requires_otp) {
          // For OTP flow, we'll handle it in the Login component
          // Return false to indicate login not complete yet
          setError('OTP verification required');
          return false;
        }

        const userData = {
          id: result.user.id.toString(),
          name: result.user.username,
          email: result.user.email,
          role: result.user.role as 'user' | 'admin',
          createdAt: new Date(result.user.created_at),
          updatedAt: new Date(),
          otp_enabled: result.user.otp_enabled || false
        };

        setUser(userData);
        setIsAuthenticated(true);
        localStorage.setItem('user', JSON.stringify(userData));

        return true;
      } else {
        const errorText = await response.text();
        console.log('❌ Login failed - response text:', errorText);

        try {
          const errorData = JSON.parse(errorText);
          setError(errorData.error || 'Login failed');
        } catch {
          setError(`Login failed: ${response.status} ${response.statusText}`);
        }
        return false;
      }
    } catch (error: any) {
      console.error('💥 Login network error:', error);

      if (error.name === 'AbortError') {
        setError('Request timeout - server is not responding. Check if Flask is running.');
      } else if (error.message?.includes('Failed to fetch')) {
        setError(`Cannot connect to server. Please check:
• Flask server is running on 192.168.100.77
• Both devices are on the same WiFi network
• Windows Firewall allows Python connections`);
      } else {
        setError(`Network error: ${error.message}`);
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
    console.log('✅ User logged out');
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const backendUrl = getBackendUrl();
      console.log('🔄 Connecting to backend for registration:', backendUrl);

      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${backendUrl}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: name,
          email: email,
          password: password,
          enable_otp: false // Default to false, user can enable later
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      console.log('📡 Registration response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Registration successful:', result);

        const userData = {
          id: result.user.id.toString(),
          name: result.user.username,
          email: result.user.email,
          role: result.user.role as 'user' | 'admin',
          createdAt: new Date(result.user.created_at),
          updatedAt: new Date(),
          otp_enabled: result.user.otp_enabled || false
        };

        // setUser(userData);
        // setIsAuthenticated(true);
        // localStorage.setItem('user', JSON.stringify(userData));
        return true;
      } else {
        const errorText = await response.text();
        console.log('❌ Registration failed - response text:', errorText);

        try {
          const errorData = JSON.parse(errorText);
          setError(errorData.error || 'Registration failed');
        } catch {
          setError(`Registration failed: ${response.status} ${response.statusText}`);
        }
        return false;
      }
    } catch (error: any) {
      console.error('💥 Registration network error:', error);

      if (error.name === 'AbortError') {
        setError('Request timeout - server is not responding');
      } else if (error.message?.includes('Failed to fetch')) {
        setError(`Cannot connect to server. Please check:
• Flask server is running on 192.168.100.77
• Both devices are on the same WiFi network
• Windows Firewall allows Python connections`);
      } else {
        setError(`Network error: ${error.message}`);
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserProfile = async (updatedUser: User): Promise<boolean> => {
    try {
      setIsLoading(true);

      // In a real app, we would make an API call to update the user profile
      // For now, we'll just update our state
      setUser(updatedUser);

      // Update user in localStorage
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return true;
    } catch (error) {
      console.error('Profile update error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  // NEW: Check OTP status for a user
  const checkOtpStatus = async (userId: string): Promise<{ otp_enabled: boolean }> => {
    try {
      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/api/otp/status?user_id=${userId}`);

      if (response.ok) {
        const result = await response.json();
        return { otp_enabled: result.otp_enabled || false };
      }
      return { otp_enabled: false };
    } catch (error) {
      console.error('Error checking OTP status:', error);
      return { otp_enabled: false };
    }
  };

  // NEW: Enable OTP for user
  const enableOtp = async (userId: string, password: string): Promise<boolean> => {
    try {
      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/api/otp/enable`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          password: password
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && user) {
          // Update user in state
          const updatedUser = { ...user, otp_enabled: true };
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
        return result.success || false;
      }
      return false;
    } catch (error) {
      console.error('Error enabling OTP:', error);
      return false;
    }
  };

  // NEW: Disable OTP for user
  const disableOtp = async (userId: string, password: string): Promise<boolean> => {
    try {
      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/api/otp/disable`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          password: password
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && user) {
          // Update user in state
          const updatedUser = { ...user, otp_enabled: false };
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
        return result.success || false;
      }
      return false;
    } catch (error) {
      console.error('Error disabling OTP:', error);
      return false;
    }
  };

  return (
    <UserContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        error,
        login,
        logout,
        register,
        updateUserProfile,
        setUser,
        clearError,
        checkOtpStatus,
        enableOtp,
        disableOtp
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};