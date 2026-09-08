import React, { useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { authClient } from '../services/authClient';
import { 
  Stethoscope, 
  GraduationCap, 
  Lock, 
  Mail, 
  User, 
  ArrowRight, 
  CheckCircle2, 
  Building, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  ChevronLeft, 
  KeyRound, 
  Sparkles, 
  Zap, 
  Check, 
  AlertCircle, 
  Activity,
  Award,
  Clock,
  RefreshCw,
  HelpCircle
} from 'lucide-react';

export type AuthScreenMode = 'signin' | 'signup' | 'forgot_password' | 'reset_password';

interface AuthViewProps {
  mode: 'signin' | 'signup';
  onToggleMode: () => void;
  onAuthenticate: (user: UserProfile) => void;
  onBackToLanding: () => void;
  initialRole?: UserRole;
  resetTokenParam?: string | null;
}

export const AuthView: React.FC<AuthViewProps> = ({
  mode: initialMode,
  onToggleMode,
  onAuthenticate,
  onBackToLanding,
  initialRole = 'doctor',
  resetTokenParam = null
}) => {
  // Screen sub-modes: signin | signup | forgot_password | reset_password
  const [authViewMode, setAuthViewMode] = useState<AuthScreenMode>(
    resetTokenParam ? 'reset_password' : (initialMode === 'signup' ? 'signup' : 'signin')
  );

  useEffect(() => {
    if (!resetTokenParam) {
      setAuthViewMode(initialMode === 'signup' ? 'signup' : 'signin');
    }
  }, [initialMode, resetTokenParam]);

  // Selected Role (Doctor vs Student ONLY - strictly NO patient role)
  const [selectedRole, setSelectedRole] = useState<UserRole>(initialRole);

  // Common Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Doctor Specific Fields
  const [institution, setInstitution] = useState('');
  const [professionalId, setProfessionalId] = useState('');
  const [specialty, setSpecialty] = useState('Oral & Maxillofacial Pathology');

  // Student Specific Fields
  const [university, setUniversity] = useState('');
  const [program, setProgram] = useState('BDS / Oral Oncology Resident');
  const [yearOfStudy, setYearOfStudy] = useState('Year 2 Resident');

  // Password Reset Specific States
  const [resetToken, setResetToken] = useState(resetTokenParam || '');
  const [tokenVerifiedEmail, setTokenVerifiedEmail] = useState<string | null>(null);
  const [tokenValidationError, setTokenValidationError] = useState<string | null>(null);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);

  // Feedback & Loading States
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Check URL hash for reset token on mount
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('reset-password')) {
      const match = hash.match(/token=([^&]+)/);
      if (match && match[1]) {
        const tokenVal = decodeURIComponent(match[1]);
        setResetToken(tokenVal);
        setAuthViewMode('reset_password');
        verifyTokenOnBackend(tokenVal);
      }
    }
  }, []);

  const verifyTokenOnBackend = async (tokenToVerify: string) => {
    setTokenValidationError(null);
    const res = await authClient.verifyResetToken(tokenToVerify);
    if (res.valid && res.email) {
      setTokenVerifiedEmail(res.email);
    } else {
      setTokenValidationError(res.error || 'This password reset link is invalid or has expired.');
    }
  };

  // Password strength calculator
  const calculatePasswordStrength = (pass: string): { score: number; label: string; color: string } => {
    if (!pass) return { score: 0, label: 'None', color: 'bg-slate-200' };
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 2) return { score: 1, label: 'Weak', color: 'bg-rose-500' };
    if (score === 3 || score === 4) return { score: 2, label: 'Fair', color: 'bg-amber-500' };
    return { score: 3, label: 'Strong', color: 'bg-emerald-500' };
  };

  const passwordStrength = calculatePasswordStrength(password);

  // Quick 1-Click Demo Evaluation Sign In
  const handleQuickDemoLogin = async (role: UserRole) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    const demoEmail = role === 'doctor' ? 'ananya.rao@opmd-clinic.com' : 'alex.chen@meduniv.edu';
    const demoPass = role === 'doctor' ? 'Doctor@2026!' : 'Student@2026!';

    setEmail(demoEmail);
    setPassword(demoPass);
    setSelectedRole(role);

    try {
      const res = await authClient.login(demoEmail, demoPass);
      if (res.success && res.user) {
        setSuccessMessage(`Signed in successfully as ${res.user.name}.`);
        setTimeout(() => {
          onAuthenticate(res.user!);
        }, 300);
      } else {
        setErrorMessage(res.error || 'Demo authentication failed.');
      }
    } catch {
      setErrorMessage('Could not connect to authentication server.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Login Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Please provide both email address and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await authClient.login(email.trim(), password);
      if (res.success && res.user) {
        setSuccessMessage(`Welcome back, ${res.user.name}!`);
        setTimeout(() => {
          onAuthenticate(res.user!);
        }, 400);
      } else {
        const err = res.error || 'Unable to sign in. Please check your email and password.';
        setErrorMessage(err);
      }
    } catch {
      setErrorMessage('Connection error during authentication. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Register Submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!fullName.trim()) {
      setErrorMessage('Full Name is required.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please provide a valid institutional email address.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await authClient.register({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        confirmPassword,
        role: selectedRole,
        institution: selectedRole === 'doctor' ? institution : undefined,
        professionalId: selectedRole === 'doctor' ? professionalId : undefined,
        specialty: selectedRole === 'doctor' ? specialty : undefined,
        university: selectedRole === 'student' ? university : undefined,
        program: selectedRole === 'student' ? program : undefined,
        yearOfStudy: selectedRole === 'student' ? yearOfStudy : undefined
      });

      if (res.success && res.user) {
        setSuccessMessage('Account registered successfully! Redirecting to clinical workspace...');
        setTimeout(() => {
          onAuthenticate(res.user!);
        }, 500);
      } else {
        setErrorMessage(res.error || 'Registration failed.');
      }
    } catch {
      setErrorMessage('Connection error during account registration. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Forgot Password Submit
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setDevResetUrl(null);

    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await authClient.forgotPassword(email.trim());
      setSuccessMessage(res.message || 'If an account exists for this email, password reset instructions have been sent.');
      if (res.devResetUrl) {
        setDevResetUrl(res.devResetUrl);
      }
    } catch {
      setErrorMessage('Unable to process password reset request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Reset Password Submit
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!resetToken) {
      setErrorMessage('Reset token is missing or invalid.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('New password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await authClient.resetPassword(resetToken, password, confirmPassword);
      if (res.success) {
        setSuccessMessage(res.message || 'Your password has been successfully reset. Please sign in with your new credentials.');
        setPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          setAuthViewMode('signin');
          window.location.hash = '';
        }, 2000);
      } else {
        setErrorMessage(res.error || 'Password reset failed.');
      }
    } catch {
      setErrorMessage('Unable to reset password due to connection error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8">
      
      {/* Top Header / Back Link */}
      <div className="w-full max-w-5xl mx-auto mb-6 flex items-center justify-between">
        <button
          onClick={onBackToLanding}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors group px-3 py-1.5 rounded-lg hover:bg-slate-200/60"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Home</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          <span className="hidden sm:inline">256-Bit SSL Encrypted • Medical-Grade Triage</span>
        </div>
      </div>

      {/* Main Container Card (Dual Column on Desktop) */}
      <div className="w-full max-w-5xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        
        {/* LEFT COLUMN: LesionXpert AI Brand & Clinical Highlights */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 p-8 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden">
          
          {/* Subtle Background Glow */}
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-teal-400/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 space-y-6">
            
            {/* Brand Logo & Title */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-teal-700/30">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-white font-hanken">
                  LesionXpert AI
                </h1>
                <p className="text-[11px] font-bold text-teal-300 uppercase tracking-wider">
                  AI-Assisted Oral Lesion Screening
                </p>
              </div>
            </div>

            {/* Description */}
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-body">
              LesionXpert AI is an AI-assisted clinical decision-support platform designed for Oral Pathologists, Maxillofacial Surgeons, and Dental Residents to detect Oral Potentially Malignant Disorders (OPMD) with explainable visual saliency.
            </p>

            {/* Clinical Highlights */}
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
                <Stethoscope className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-white">Clinical Biopsy Triage</div>
                  <div className="text-[11px] text-slate-300 mt-0.5">
                    Real-time risk scoring for Leukoplakia, Lichen Planus, Submucous Fibrosis, and Normal Mucosa.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
                <Sparkles className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-white">Grad-CAM Thermal Saliency</div>
                  <div className="text-[11px] text-slate-300 mt-0.5">
                    Pixel-level attention mapping highlights abnormal keratinization with zero black-box obscurity.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
                <GraduationCap className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-white">Residency Training Curriculum</div>
                  <div className="text-[11px] text-slate-300 mt-0.5">
                    Integrated WHO 2024 educational modules, interactive quizzes, and dataset exploration.
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Role Boundary Guarantee */}
          <div className="relative z-10 pt-6 mt-6 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-teal-400" />
              Doctor & Dental Student Portal
            </span>
            <span className="text-[10px] text-teal-400 font-mono">v2.4 Live</span>
          </div>

        </div>

        {/* RIGHT COLUMN: Authentication Forms */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center">
          
          {/* Quick Demo Credentials Bar (Always Available for Instant Testing) */}
          <div className="mb-6 bg-teal-50/90 border border-teal-200/80 p-3.5 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal-900 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-teal-600 fill-teal-600" />
                1-Click Test Credentials (Instant Evaluation):
              </span>
              <span className="text-[10px] font-semibold bg-teal-200/60 text-teal-800 px-2 py-0.5 rounded-full">
                Pre-configured
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleQuickDemoLogin('doctor')}
                className="px-3 py-2 rounded-xl bg-white hover:bg-teal-50 text-slate-800 border border-teal-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs hover:border-teal-400 disabled:opacity-50"
              >
                <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
                <span>Dr. Ananya Rao (Doctor)</span>
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleQuickDemoLogin('student')}
                className="px-3 py-2 rounded-xl bg-white hover:bg-teal-50 text-slate-800 border border-teal-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs hover:border-teal-400 disabled:opacity-50"
              >
                <GraduationCap className="w-3.5 h-3.5 text-teal-600" />
                <span>Alex Chen (Student)</span>
              </button>
            </div>
          </div>

          {/* Feedback Messages */}
          {errorMessage && (
            <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs space-y-1.5">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="font-semibold">{errorMessage}</div>
              </div>
              <p className="text-[11px] text-rose-700 pl-6.5">
                If you haven't created your account yet, click{' '}
                <button
                  type="button"
                  onClick={() => {
                    setAuthViewMode('signup');
                    setErrorMessage(null);
                  }}
                  className="font-bold underline underline-offset-2 hover:text-rose-900"
                >
                  Create Account
                </button>{' '}
                to register, or use the 1-click test credentials above.
              </p>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="font-medium">{successMessage}</div>
            </div>
          )}

          {/* Dev Mode Reset Link Notice (For seamless offline password reset testing) */}
          {devResetUrl && (
            <div className="mb-4 p-3.5 bg-amber-50 border border-amber-300 text-amber-900 rounded-2xl text-xs space-y-2">
              <div className="font-bold flex items-center gap-1.5 text-amber-800">
                <KeyRound className="w-4 h-4 text-amber-600" />
                <span>Dev Reset Link (Preview Assistant):</span>
              </div>
              <p className="text-[11px] text-amber-700">
                In this preview environment, click below to open the secure password reset form directly:
              </p>
              <a
                href={devResetUrl}
                onClick={(e) => {
                  e.preventDefault();
                  const match = devResetUrl.match(/token=([^&]+)/);
                  if (match && match[1]) {
                    const tokenVal = decodeURIComponent(match[1]);
                    setResetToken(tokenVal);
                    setAuthViewMode('reset_password');
                    verifyTokenOnBackend(tokenVal);
                  }
                }}
                className="inline-block px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[11px] shadow-xs"
              >
                Proceed to Reset Password →
              </a>
            </div>
          )}

          {/* ========================================================
              MODE 1: SIGN IN (LOGIN)
              ======================================================== */}
          {authViewMode === 'signin' && (
            <div className="space-y-6">
              
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight font-hanken">
                  Welcome back
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Enter your clinical credentials to access your diagnostic workspace.
                </p>
              </div>

              {/* Role Indicator (Doctor or Student ONLY) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Account Clinical Role:
                </label>
                <div className="bg-slate-100 p-1 rounded-2xl flex items-center">
                  <button
                    type="button"
                    onClick={() => setSelectedRole('doctor')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      selectedRole === 'doctor'
                        ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <Stethoscope className="w-4 h-4 text-teal-600" />
                    <span>Doctor / Specialist</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedRole('student')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      selectedRole === 'student'
                        ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <GraduationCap className="w-4 h-4 text-teal-600" />
                    <span>Dental Student</span>
                  </button>
                </div>
              </div>

              {/* Login Form */}
              <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    {selectedRole === 'doctor' ? 'Clinical / Hospital Email' : 'University Academic Email'}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={selectedRole === 'doctor' ? 'doctor@hospital.org' : 'student@univ.edu'}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-slate-900 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-bold text-slate-700">Password</label>
                    <button
                      type="button"
                      onClick={() => setAuthViewMode('forgot_password')}
                      className="text-teal-700 hover:text-teal-800 font-bold text-xs"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-slate-900 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                    />
                    <span className="text-slate-600 text-xs">Keep me signed in on this workstation</span>
                  </label>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-lg shadow-teal-700/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Verifying Credentials...</span>
                      </>
                    ) : (
                      <>
                        <span>LOGIN TO LESIONXPERT AI</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Bottom Switch to Registration */}
              <div className="text-center pt-4 border-t border-slate-100">
                <span className="text-xs text-slate-500">Don't have an account?</span>
                <button
                  type="button"
                  onClick={() => {
                    setAuthViewMode('signup');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="text-xs font-bold text-teal-700 hover:text-teal-800 underline underline-offset-2 ml-1"
                >
                  Create Account
                </button>
              </div>

            </div>
          )}

          {/* ========================================================
              MODE 2: CREATE ACCOUNT (REGISTRATION)
              ======================================================== */}
          {authViewMode === 'signup' && (
            <div className="space-y-5">
              
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight font-hanken">
                  Create Clinical Account
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Register for accredited access to LesionXpert AI decision support.
                </p>
              </div>

              {/* Role Selector: Doctor or Student ONLY (NO Patient role!) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Select Role:
                </label>
                <div className="bg-slate-100 p-1 rounded-2xl flex items-center">
                  <button
                    type="button"
                    onClick={() => setSelectedRole('doctor')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      selectedRole === 'doctor'
                        ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <Stethoscope className="w-4 h-4 text-teal-600" />
                    <span>Doctor / Specialist</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedRole('student')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      selectedRole === 'student'
                        ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <GraduationCap className="w-4 h-4 text-teal-600" />
                    <span>Dental Student</span>
                  </button>
                </div>
              </div>

              <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-xs">
                
                {/* Full Name */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Full Name & Title
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={selectedRole === 'doctor' ? 'e.g. Dr. Jane Smith, MD, BDS' : 'e.g. Alex Chen'}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-slate-900 outline-none"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {selectedRole === 'doctor' ? 'Hospital / Clinical Email' : 'University / Academic Email'}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={selectedRole === 'doctor' ? 'name@hospital.org' : 'name@dental.edu'}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-slate-900 outline-none"
                    />
                  </div>
                </div>

                {/* Doctor-Specific Fields */}
                {selectedRole === 'doctor' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Medical Institution / Hospital</label>
                      <input
                        type="text"
                        value={institution}
                        onChange={(e) => setInstitution(e.target.value)}
                        placeholder="City Oral Pathology Center"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-900 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Professional License ID</label>
                      <input
                        type="text"
                        value={professionalId}
                        onChange={(e) => setProfessionalId(e.target.value)}
                        placeholder="DENT-PATH-84920"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-900 font-mono outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Student-Specific Fields */}
                {selectedRole === 'student' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">University / Dental College</label>
                      <input
                        type="text"
                        value={university}
                        onChange={(e) => setUniversity(e.target.value)}
                        placeholder="University of Dental Sciences"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-900 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Residency / Year</label>
                      <select
                        value={yearOfStudy}
                        onChange={(e) => setYearOfStudy(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-900 bg-white outline-none"
                      >
                        <option value="BDS Final Year">BDS Final Year</option>
                        <option value="Year 1 Resident">Year 1 Resident (PGY-1)</option>
                        <option value="Year 2 Resident">Year 2 Resident (PGY-2)</option>
                        <option value="Year 3 Senior Resident">Year 3 Senior Resident</option>
                        <option value="Oral Oncology Fellow">Oral Oncology Fellow</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Password & Strength Meter */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 8 characters (Upper, Lower, Number, Special)"
                      className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-slate-900 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Password Strength Indicator */}
                  {password && (
                    <div className="mt-1.5 space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-500">Password Strength:</span>
                        <span className={`font-bold ${
                          passwordStrength.label === 'Strong' ? 'text-emerald-600' :
                          passwordStrength.label === 'Fair' ? 'text-amber-600' : 'text-rose-600'
                        }`}>
                          {passwordStrength.label}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden flex gap-1">
                        <div className={`h-full flex-1 rounded-full ${passwordStrength.score >= 1 ? passwordStrength.color : 'bg-slate-200'}`} />
                        <div className={`h-full flex-1 rounded-full ${passwordStrength.score >= 2 ? passwordStrength.color : 'bg-slate-200'}`} />
                        <div className={`h-full flex-1 rounded-full ${passwordStrength.score >= 3 ? passwordStrength.color : 'bg-slate-200'}`} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Confirm Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                      className={`w-full pl-9 pr-10 py-2.5 rounded-xl border focus:ring-2 focus:ring-teal-500 text-slate-900 outline-none ${
                        confirmPassword && password !== confirmPassword ? 'border-rose-300' : 'border-slate-300'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-[11px] text-rose-600 mt-1">Passwords do not match.</p>
                  )}
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-lg shadow-teal-700/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Creating Clinical Account...</span>
                      </>
                    ) : (
                      <>
                        <span>COMPLETE REGISTRATION</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>

              </form>

              {/* Bottom Switch to Sign In */}
              <div className="text-center pt-3 border-t border-slate-100">
                <span className="text-xs text-slate-500">Already registered?</span>
                <button
                  type="button"
                  onClick={() => {
                    setAuthViewMode('signin');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="text-xs font-bold text-teal-700 hover:text-teal-800 underline underline-offset-2 ml-1"
                >
                  Sign In
                </button>
              </div>

            </div>
          )}

          {/* ========================================================
              MODE 3: FORGOT PASSWORD
              ======================================================== */}
          {authViewMode === 'forgot_password' && (
            <div className="space-y-6">
              
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setAuthViewMode('signin');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="inline-flex items-center gap-1 text-xs text-teal-700 hover:text-teal-800 font-bold mb-2"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </button>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight font-hanken">
                  Reset Password
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Enter the email associated with your account and we will generate secure password reset instructions.
                </p>
              </div>

              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Registered Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. ananya.rao@opmd-clinic.com"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-slate-900 outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-lg shadow-teal-700/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Sending Instructions...</span>
                    </>
                  ) : (
                    <>
                      <span>SEND RESET INSTRUCTIONS</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1.5">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-teal-600" />
                  <span>Security & Account Protection</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Reset tokens are cryptographically generated, expire in 30 minutes, and can only be used once to prevent unauthorized account access.
                </p>
              </div>

            </div>
          )}

          {/* ========================================================
              MODE 4: RESET PASSWORD (WITH TOKEN)
              ======================================================== */}
          {authViewMode === 'reset_password' && (
            <div className="space-y-6">
              
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setAuthViewMode('signin');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                    window.location.hash = '';
                  }}
                  className="inline-flex items-center gap-1 text-xs text-teal-700 hover:text-teal-800 font-bold mb-2"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </button>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight font-hanken">
                  Set New Password
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  {tokenVerifiedEmail 
                    ? `Create a strong new password for ${tokenVerifiedEmail}`
                    : 'Enter your new clinical credentials.'}
                </p>
              </div>

              {tokenValidationError ? (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-3 text-xs">
                  <div className="font-bold text-rose-800 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <span>Reset Token Invalid or Expired</span>
                  </div>
                  <p className="text-rose-700 text-[11px]">
                    {tokenValidationError}
                  </p>
                  <button
                    type="button"
                    onClick={() => setAuthViewMode('forgot_password')}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs"
                  >
                    Request New Reset Link
                  </button>
                </div>
              ) : (
                <form onSubmit={handleResetPasswordSubmit} className="space-y-4 text-xs">
                  
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">New Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="At least 8 characters"
                        className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-slate-900 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Password Strength */}
                    {password && (
                      <div className="mt-1.5 space-y-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-slate-500">Password Strength:</span>
                          <span className={`font-bold ${
                            passwordStrength.label === 'Strong' ? 'text-emerald-600' :
                            passwordStrength.label === 'Fair' ? 'text-amber-600' : 'text-rose-600'
                          }`}>
                            {passwordStrength.label}
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden flex gap-1">
                          <div className={`h-full flex-1 rounded-full ${passwordStrength.score >= 1 ? passwordStrength.color : 'bg-slate-200'}`} />
                          <div className={`h-full flex-1 rounded-full ${passwordStrength.score >= 2 ? passwordStrength.color : 'bg-slate-200'}`} />
                          <div className={`h-full flex-1 rounded-full ${passwordStrength.score >= 3 ? passwordStrength.color : 'bg-slate-200'}`} />
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Confirm New Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repeat new password"
                        className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-slate-900 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-lg shadow-teal-700/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <>
                        <span>UPDATE PASSWORD & SIGN IN</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                </form>
              )}

            </div>
          )}

        </div>

      </div>

      {/* ISO / HIPAA Footer */}
      <div className="mt-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
        <ShieldCheck className="w-4 h-4 text-teal-600" />
        <span>LesionXpert AI Clinical Station • ISO 27001 & WHO 2024 Criteria Compliant</span>
      </div>

    </div>
  );
};
