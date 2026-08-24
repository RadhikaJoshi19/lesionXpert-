/**
 * LesionXpert AI - Client Authentication API Client
 * Connects React UI to the full backend authentication endpoints:
 * - POST /api/auth/login
 * - POST /api/auth/register
 * - POST /api/auth/logout
 * - GET  /api/auth/me
 * - POST /api/auth/forgot-password
 * - POST /api/auth/verify-reset-token
 * - POST /api/auth/reset-password
 * - POST /api/auth/change-password
 * - PUT  /api/auth/profile
 */

import { UserProfile, UserRole } from '../types';

export interface AuthResponse {
  success: boolean;
  user?: UserProfile;
  error?: string;
  message?: string;
  devResetUrl?: string;
  token?: string;
}

const SESSION_TOKEN_KEY = 'lesionxpert_session_token';

class AuthClient {
  private getToken(): string | null {
    try {
      return localStorage.getItem(SESSION_TOKEN_KEY);
    } catch {
      return null;
    }
  }

  private setToken(token: string | null) {
    try {
      if (token) {
        localStorage.setItem(SESSION_TOKEN_KEY, token);
      } else {
        localStorage.removeItem(SESSION_TOKEN_KEY);
      }
    } catch {
      // Ignored
    }
  }

  private getAuthHeaders(): HeadersInit {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  /**
   * Check authenticated session on app boot
   */
  public async getSession(): Promise<{ authenticated: boolean; user?: UserProfile }> {
    try {
      const res = await fetch('/api/auth/me', {
        headers: this.getAuthHeaders()
      });

      if (!res.ok) {
        return { authenticated: false };
      }

      const data = await res.json();
      if (data.success && data.user) {
        return { authenticated: true, user: data.user };
      }

      return { authenticated: false };
    } catch (err) {
      console.warn('[AUTH CLIENT] Could not verify session with backend:', err);
      return { authenticated: false };
    }
  }

  /**
   * Real Login
   */
  public async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (data.success && data.token) {
        this.setToken(data.token);
      }
      return data;
    } catch (err: any) {
      return {
        success: false,
        error: 'Unable to connect to authentication server. Please check your network connection.'
      };
    }
  }

  /**
   * Real Registration
   */
  public async register(payload: {
    fullName: string;
    email: string;
    password: string;
    confirmPassword: string;
    role: 'doctor' | 'student';
    institution?: string;
    professionalId?: string;
    specialty?: string;
    university?: string;
    program?: string;
    yearOfStudy?: string;
  }): Promise<AuthResponse> {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success && data.token) {
        this.setToken(data.token);
      }
      return data;
    } catch (err: any) {
      return {
        success: false,
        error: 'Unable to register account. Please check your network connection.'
      };
    }
  }

  /**
   * Logout
   */
  public async logout(): Promise<boolean> {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: this.getAuthHeaders()
      });
    } catch {
      // Ignored
    } finally {
      this.setToken(null);
    }
    return true;
  }

  /**
   * Forgot Password request
   */
  public async forgotPassword(email: string): Promise<AuthResponse> {
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      return await res.json();
    } catch {
      return {
        success: false,
        error: 'Unable to process password reset request. Please try again later.'
      };
    }
  }

  /**
   * Verify Reset Token
   */
  public async verifyResetToken(token: string): Promise<{ valid: boolean; error?: string; email?: string }> {
    try {
      const res = await fetch('/api/auth/verify-reset-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      return await res.json();
    } catch {
      return { valid: false, error: 'Could not connect to authentication service.' };
    }
  }

  /**
   * Reset Password
   */
  public async resetPassword(token: string, newPassword: string, confirmPassword: string): Promise<AuthResponse> {
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword, confirmPassword })
      });
      return await res.json();
    } catch {
      return {
        success: false,
        error: 'Unable to reset password. Please try again.'
      };
    }
  }

  /**
   * Change Password (for logged in user)
   */
  public async changePassword(currentPassword: string, newPassword: string, confirmPassword: string): Promise<AuthResponse> {
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword })
      });
      return await res.json();
    } catch {
      return {
        success: false,
        error: 'Unable to update password.'
      };
    }
  }

  /**
   * Update Profile
   */
  public async updateProfile(profileUpdates: Partial<UserProfile>): Promise<AuthResponse> {
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(profileUpdates)
      });
      return await res.json();
    } catch {
      return {
        success: false,
        error: 'Unable to save profile changes.'
      };
    }
  }
}

export const authClient = new AuthClient();
