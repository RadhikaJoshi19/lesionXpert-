import React, { useState } from 'react';
import { UserProfile, UserRole } from '../types';
import { 
  Activity, 
  PlusCircle, 
  History, 
  FileSpreadsheet, 
  BookOpen, 
  ClipboardCheck, 
  Settings, 
  Bell, 
  LogOut, 
  Sparkles, 
  UserCheck, 
  GraduationCap, 
  Stethoscope,
  Menu,
  X
} from 'lucide-react';

interface NavigationProps {
  currentView: string;
  onNavigate: (view: string) => void;
  currentUser: UserProfile;
  onSwitchRole: (role: UserRole) => void;
  onSignOut: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentView,
  onNavigate,
  currentUser,
  onSwitchRole,
  onSignOut
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const navItems = currentUser.role === 'doctor' ? [
    { id: 'dashboard', label: 'Dashboard', icon: 'grid_view' },
    { id: 'new_analysis', label: 'New Analysis', icon: 'add_photo_alternate', highlight: true },
    { id: 'case_history', label: 'Case History', icon: 'history' },
    { id: 'reports', label: 'Reports', icon: 'description' },
    { id: 'clinical_reviews', label: 'Clinical Reviews', icon: 'fact_check', badge: '3' },
    { id: 'model_training', label: 'Model Hub & Training', icon: 'model_training', badge: 'ResNet' },
    { id: 'study_resources', label: 'Study Resources', icon: 'menu_book' },
    { id: 'settings', label: 'Settings', icon: 'settings' },
  ] : [
    { id: 'dashboard', label: 'Dashboard', icon: 'grid_view' },
    { id: 'new_analysis', label: 'New Analysis', icon: 'add_photo_alternate', highlight: true },
    { id: 'case_history', label: 'Case History', icon: 'history' },
    { id: 'study_resources', label: 'Study Material & Quiz', icon: 'school', badge: 'Quiz' },
    { id: 'reports', label: 'Reports', icon: 'description' },
    { id: 'model_training', label: 'Model Hub', icon: 'model_training' },
    { id: 'settings', label: 'Settings', icon: 'settings' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      {/* Top Banner / Role Switcher Strip */}
      <div className="bg-slate-900 text-slate-300 text-xs px-4 sm:px-6 py-1.5 flex justify-between items-center border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 mr-1 animate-pulse"></span>
            WHO 2024 Criteria Live
          </span>
          <span className="hidden sm:inline text-slate-400 text-[11px]">
            AI-Assisted Diagnostic Triage & Training Platform
          </span>
        </div>

        {/* Quick Role Switcher */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400 hidden md:inline">Current Mode:</span>
          <div className="bg-slate-800 p-0.5 rounded-full border border-slate-700 flex items-center">
            <button
              onClick={() => onSwitchRole('doctor')}
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-all flex items-center gap-1 ${
                currentUser.role === 'doctor'
                  ? 'bg-teal-600 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Stethoscope className="w-3 h-3" />
              <span>Doctor / Specialist</span>
            </button>
            <button
              onClick={() => onSwitchRole('student')}
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-all flex items-center gap-1 ${
                currentUser.role === 'student'
                  ? 'bg-teal-600 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <GraduationCap className="w-3 h-3" />
              <span>Student / Resident</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-8">
            <button 
              onClick={() => onNavigate('dashboard')}
              className="flex items-center gap-2.5 text-left focus:outline-none group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-white shadow-md shadow-teal-700/20 group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-2xl">science</span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xl font-extrabold tracking-tight text-slate-900 font-hanken">LesionXpert AI</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded border border-teal-200">
                    {currentUser.role === 'doctor' ? 'Clinical' : 'Academic'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 -mt-0.5 font-medium">
                  {currentUser.role === 'doctor' ? 'Diagnostic Intelligence' : 'Learning Pathway'}
                </div>
              </div>
            </button>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center space-x-1">
              {navItems.map((item) => {
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all flex items-center gap-1.5 relative ${
                      isActive
                        ? 'bg-teal-50 text-teal-800 font-bold border-b-2 border-teal-600'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <span className={`material-symbols-outlined text-lg ${isActive ? 'text-teal-600' : 'text-slate-400'}`}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right Action Items */}
          <div className="flex items-center gap-3">
            {/* New Analysis Primary Button */}
            <button
              onClick={() => onNavigate('new_analysis')}
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-semibold text-xs shadow-md shadow-teal-700/15 transition-all hover:scale-[1.02]"
            >
              <span className="material-symbols-outlined text-base">add_a_photo</span>
              <span>New Analysis</span>
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors relative"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white"></span>
              </button>

              {/* Notification Popover */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 text-xs z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="font-bold text-slate-900 text-sm font-hanken">Notifications</span>
                    <span className="text-[10px] bg-teal-100 text-teal-800 font-semibold px-2 py-0.5 rounded-full">2 New</span>
                  </div>
                  <div className="space-y-3 mt-3">
                    <div className="p-2.5 bg-teal-50/70 rounded-xl border border-teal-100">
                      <div className="font-semibold text-teal-900">Case #8942 Review Complete</div>
                      <p className="text-slate-600 text-[11px] mt-0.5">High confidence (94.2%) Oral Leukoplakia verified.</p>
                      <span className="text-[10px] text-teal-700 font-mono mt-1 block">10 mins ago</span>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="font-semibold text-slate-800">New Module Available</div>
                      <p className="text-slate-600 text-[11px] mt-0.5">Understanding Lichen Planus added to Study Resources.</p>
                      <span className="text-[10px] text-slate-400 font-mono mt-1 block">2 hours ago</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Direct Quick Sign Out Button */}
            <button
              onClick={onSignOut}
              title="Sign Out / Log Out"
              aria-label="Sign Out"
              className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors hidden sm:flex items-center gap-1.5 text-xs font-semibold"
            >
              <LogOut className="w-4 h-4 text-slate-400 group-hover:text-rose-600" />
              <span className="hidden xl:inline">Sign Out</span>
            </button>

            {/* User Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors focus:outline-none"
              >
                <div className="relative">
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.name}
                    className="w-8 h-8 rounded-full object-cover border border-teal-400/50"
                    referrerPolicy="no-referrer"
                  />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-teal-500 rounded-full ring-2 ring-white"></span>
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-xs font-bold text-slate-900 leading-tight">{currentUser.name}</div>
                  <div className="text-[10px] text-slate-500 font-medium capitalize">
                    {currentUser.role === 'doctor' ? 'Oral Pathologist' : 'Resident Student'}
                  </div>
                </div>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 text-xs z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="font-bold text-slate-900">{currentUser.name}</p>
                    <p className="text-slate-500 text-[11px] truncate">{currentUser.email}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] rounded-full font-medium">
                      {currentUser.institution || currentUser.university}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => { onNavigate('settings'); setUserMenuOpen(false); }}
                    className="w-full px-4 py-2.5 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 font-medium"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    <span>Account Settings</span>
                  </button>
                  <button
                    onClick={() => { onNavigate('study_resources'); setUserMenuOpen(false); }}
                    className="w-full px-4 py-2.5 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 font-medium"
                  >
                    <BookOpen className="w-4 h-4 text-slate-400" />
                    <span>Educational Hub</span>
                  </button>
                  <button
                    onClick={() => { onNavigate('landing'); setUserMenuOpen(false); }}
                    className="w-full px-4 py-2.5 text-left text-teal-700 hover:bg-teal-50 flex items-center gap-2.5 font-medium"
                  >
                    <span className="material-symbols-outlined text-base text-teal-600">home</span>
                    <span>Landing / Overview</span>
                  </button>

                  <div className="border-t border-slate-100 my-1"></div>

                  <div className="px-2 pt-1">
                    <button
                      onClick={() => { onSignOut(); setUserMenuOpen(false); }}
                      className="w-full px-3 py-2 rounded-xl text-left bg-rose-50 hover:bg-rose-100 text-rose-700 flex items-center gap-2 font-bold transition-colors"
                    >
                      <LogOut className="w-4 h-4 text-rose-600" />
                      <span>Sign Out / Log Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-4 space-y-2 shadow-lg">
          <div className="space-y-1">
            {navItems.map((item) => {
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide flex items-center justify-between ${
                    isActive
                      ? 'bg-teal-50 text-teal-800 font-bold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`material-symbols-outlined text-lg ${isActive ? 'text-teal-600' : 'text-slate-400'}`}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Mobile Drawer Sign Out */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name}
                className="w-7 h-7 rounded-full object-cover border border-teal-400/50"
                referrerPolicy="no-referrer"
              />
              <div className="text-left">
                <div className="text-xs font-bold text-slate-900 leading-tight">{currentUser.name}</div>
                <div className="text-[10px] text-slate-500">{currentUser.email}</div>
              </div>
            </div>

            <button
              onClick={() => {
                onSignOut();
                setMobileMenuOpen(false);
              }}
              className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-600" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
