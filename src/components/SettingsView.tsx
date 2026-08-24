import React, { useState } from 'react';
import { UserProfile } from '../types';
import { 
  User, 
  ShieldCheck, 
  Bell, 
  KeyRound, 
  CheckCircle2, 
  Upload, 
  Building, 
  Award,
  Lock,
  Smartphone,
  LogOut
} from 'lucide-react';

interface SettingsViewProps {
  currentUser: UserProfile;
  onUpdateProfile: (updatedProfile: UserProfile) => void;
  onSignOut?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ currentUser, onUpdateProfile, onSignOut }) => {
  const [profile, setProfile] = useState<UserProfile>(currentUser);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [passwordSaved, setPasswordSaved] = useState<boolean>(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile(profile);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSaved(true);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setPasswordSaved(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-700">
          <span className="w-2 h-2 rounded-full bg-teal-600"></span>
          User Management
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-hanken">
          Account & Clinical Settings
        </h1>
        <p className="text-sm text-slate-500">
          Manage your credentials, clinical licensing identifiers, and tele-pathology alerts.
        </p>
      </div>

      {/* Profile Form */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <User className="w-5 h-5 text-teal-600" />
            <h2 className="text-lg font-bold text-slate-900 font-hanken">Profile Information</h2>
          </div>
          <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-full capitalize">
            {profile.role === 'doctor' ? 'Oral Pathologist' : 'Resident Student'}
          </span>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-5 text-xs">
          
          {/* Avatar Section */}
          <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
            <img
              src={profile.avatarUrl}
              alt={profile.name}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-teal-500/40"
              referrerPolicy="no-referrer"
            />
            <div className="space-y-1">
              <div className="font-bold text-slate-900 text-sm">{profile.name}</div>
              <p className="text-slate-500 text-[11px]">Authorized Clinical Operator ID: {profile.id}</p>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => alert("Avatar image upload is active. Select any photo to update your clinical badge.")}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-[11px] transition-colors"
                >
                  Change Photo
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">Full Name & Salutation</label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">Email Address</label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-slate-900"
              />
            </div>

            {profile.role === 'doctor' ? (
              <>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">Clinical Role / Specialty</label>
                  <input
                    type="text"
                    value={profile.clinicalRole || ''}
                    onChange={(e) => setProfile({ ...profile, clinicalRole: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">Medical Institution / Hospital</label>
                  <input
                    type="text"
                    value={profile.institution || ''}
                    onChange={(e) => setProfile({ ...profile, institution: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-slate-900"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1.5">Professional License ID / Registration</label>
                  <input
                    type="text"
                    value={profile.professionalId || ''}
                    onChange={(e) => setProfile({ ...profile, professionalId: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-slate-900 font-mono"
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">University / Academic Institution</label>
                  <input
                    type="text"
                    value={profile.university || ''}
                    onChange={(e) => setProfile({ ...profile, university: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">Degree Program</label>
                  <input
                    type="text"
                    value={profile.program || ''}
                    onChange={(e) => setProfile({ ...profile, program: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-slate-900"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1.5">Year of Study / Residency Status</label>
                  <input
                    type="text"
                    value={profile.yearOfStudy || ''}
                    onChange={(e) => setProfile({ ...profile, yearOfStudy: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-slate-900"
                  />
                </div>
              </>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            {isSaved ? (
              <span className="text-emerald-700 font-semibold flex items-center gap-1.5 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Profile changes saved successfully!
              </span>
            ) : <span></span>}

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-700/20 transition-all hover:scale-[1.01]"
            >
              Save Profile Changes
            </button>
          </div>
        </form>
      </div>

      {/* Security & Authentication */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <Lock className="w-5 h-5 text-teal-600" />
            <h2 className="text-lg font-bold text-slate-900 font-hanken">Security & 2FA</h2>
          </div>
        </div>

        <div className="space-y-5 text-xs">
          {/* 2FA Toggle */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-slate-900 text-sm">Two-Factor Authentication (2FA)</div>
                <div className="text-slate-500 text-[11px]">Enforce hardware token or authenticator app for clinical sign-offs.</div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setProfile({ ...profile, twoFactorEnabled: !profile.twoFactorEnabled })}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                profile.twoFactorEnabled
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {profile.twoFactorEnabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          {/* Password Change */}
          <form onSubmit={handleSavePassword} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Current Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-slate-900"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">New Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-slate-900"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Confirm New Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-slate-900"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              {passwordSaved ? (
                <span className="text-emerald-700 font-semibold flex items-center gap-1.5 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Password updated securely!
                </span>
              ) : <span></span>}

              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
              >
                Update Password
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-4 text-xs">
        <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
          <Bell className="w-5 h-5 text-teal-600" />
          <h2 className="text-lg font-bold text-slate-900 font-hanken">Notification Preferences</h2>
        </div>

        <div className="space-y-3">
          <label className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 cursor-pointer">
            <div>
              <div className="font-bold text-slate-900">New Clinical Case Assignments</div>
              <div className="text-slate-500 text-[11px]">Receive push notification when high-risk lesion requires review.</div>
            </div>
            <input
              type="checkbox"
              checked={profile.notifications.newCaseAssignments}
              onChange={(e) => setProfile({
                ...profile,
                notifications: { ...profile.notifications, newCaseAssignments: e.target.checked }
              })}
              className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 cursor-pointer">
            <div>
              <div className="font-bold text-slate-900">AI Analysis Completed Alerts</div>
              <div className="text-slate-500 text-[11px]">Real-time alert upon neural network Grad-CAM completion.</div>
            </div>
            <input
              type="checkbox"
              checked={profile.notifications.aiAnalysisComplete}
              onChange={(e) => setProfile({
                ...profile,
                notifications: { ...profile.notifications, aiAnalysisComplete: e.target.checked }
              })}
              className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
            />
          </label>
        </div>
      </div>

      {/* Session Management & Sign Out */}
      {onSignOut && (
        <div className="bg-white rounded-3xl border border-rose-200/70 shadow-sm p-6 sm:p-8 space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-rose-100 pb-4">
            <div className="flex items-center gap-2.5">
              <LogOut className="w-5 h-5 text-rose-600" />
              <h2 className="text-lg font-bold text-slate-900 font-hanken">Active Clinical Session</h2>
            </div>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Session Active
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-1">
            <div>
              <div className="font-bold text-slate-900">Logged in as {currentUser.name}</div>
              <div className="text-slate-500 text-[11px] mt-0.5">
                Role: <span className="capitalize font-semibold text-slate-700">{currentUser.role === 'doctor' ? 'Doctor / Specialist' : 'Dental Resident / Student'}</span> • Email: {currentUser.email}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Signing out securely clears active authentication tokens and returns you to the portal home.
              </p>
            </div>

            <button
              type="button"
              onClick={onSignOut}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-md shadow-rose-600/20 flex items-center gap-2 transition-all cursor-pointer shrink-0"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out / Log Out</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
