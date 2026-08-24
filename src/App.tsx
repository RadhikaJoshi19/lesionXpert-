import React, { useState, useEffect } from 'react';
import { UserProfile, UserRole, AnalysisCase, StudyModule, DatasetSample, TrainedModel } from './types';
import { 
  initialDoctorProfile, 
  initialStudentProfile, 
  sampleCases, 
  sampleStudyModules 
} from './data/mockData';
import { initialDatasetSamples, initialTrainedModels } from './data/datasetSamples';
import { authClient } from './services/authClient';
import { Navigation } from './components/Navigation';
import { Footer } from './components/Footer';
import { LandingView } from './components/LandingView';
import { AuthView } from './components/AuthView';
import { DoctorDashboard } from './components/DoctorDashboard';
import { StudentDashboard } from './components/StudentDashboard';
import { NewAnalysisFlow } from './components/NewAnalysisFlow';
import { ModelTrainingStudio } from './components/ModelTrainingStudio';
import { CaseHistoryView } from './components/CaseHistoryView';
import { ReportsView } from './components/ReportsView';
import { ClinicalReviewsView } from './components/ClinicalReviewsView';
import { StudyResourcesView } from './components/StudyResourcesView';
import { SettingsView } from './components/SettingsView';
import { ReportModal } from './components/ReportModal';

export function App() {
  // Navigation & Authentication State
  const [currentView, setCurrentView] = useState<string>('landing');
  const [currentUser, setCurrentUser] = useState<UserProfile>(initialDoctorProfile);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [urlResetToken, setUrlResetToken] = useState<string | null>(null);
  
  // Data State
  const [cases, setCases] = useState<AnalysisCase[]>(sampleCases);
  const [modules, setModules] = useState<StudyModule[]>(sampleStudyModules);
  const [activeStudyModule, setActiveStudyModule] = useState<StudyModule | null>(null);
  const [activeReportModalCase, setActiveReportModalCase] = useState<AnalysisCase | null>(null);

  // Model & Custom Dataset State
  const [dataset, setDataset] = useState<DatasetSample[]>(initialDatasetSamples);
  const [trainedModels, setTrainedModels] = useState<TrainedModel[]>(initialTrainedModels);
  const [activeModel, setActiveModel] = useState<TrainedModel>(initialTrainedModels[0]);

  // Check URL params and existing session on mount
  useEffect(() => {
    // 1. Check for password reset token in URL hash or search params
    const hash = window.location.hash;
    if (hash && hash.includes('reset-password')) {
      const match = hash.match(/token=([^&]+)/);
      if (match && match[1]) {
        setUrlResetToken(decodeURIComponent(match[1]));
        setCurrentView('signin');
      }
    }

    // 2. Validate current session from backend / cookie
    const checkSession = async () => {
      try {
        const sessionRes = await authClient.getSession();
        if (sessionRes.authenticated && sessionRes.user) {
          setCurrentUser(sessionRes.user);
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.warn('Session verification fallback to offline state:', err);
      }
    };
    checkSession();
  }, []);

  // Switch role handler (Doctor <-> Student ONLY)
  const handleSwitchRole = (newRole: UserRole) => {
    if (newRole === 'doctor') {
      setCurrentUser(prev => ({
        ...initialDoctorProfile,
        email: prev.role === 'doctor' ? prev.email : initialDoctorProfile.email,
        name: prev.role === 'doctor' ? prev.name : initialDoctorProfile.name
      }));
    } else {
      setCurrentUser(prev => ({
        ...initialStudentProfile,
        email: prev.role === 'student' ? prev.email : initialStudentProfile.email,
        name: prev.role === 'student' ? prev.name : initialStudentProfile.name
      }));
    }
  };

  // When a new analysis completes in the 6-step flow
  const handleAnalysisComplete = (newCase: AnalysisCase) => {
    setCases(prev => [newCase, ...prev]);
  };

  // When a review is signed off
  const handleSignOffCase = (updatedCase: AnalysisCase) => {
    setCases(prev => prev.map(c => c.id === updatedCase.id ? updatedCase : c));
  };

  // Dataset Sample Handlers
  const handleAddSample = (sample: DatasetSample) => {
    setDataset(prev => [sample, ...prev]);
  };

  const handleRemoveSample = (id: string) => {
    setDataset(prev => prev.filter(s => s.id !== id));
  };

  const handleAddTrainedModel = (model: TrainedModel) => {
    setTrainedModels(prev => [model, ...prev.map(m => ({ ...m, isActive: false }))]);
  };

  const handleSetActiveModel = (model: TrainedModel) => {
    setActiveModel(model);
    setTrainedModels(prev => prev.map(m => ({ ...m, isActive: m.id === model.id })));
  };

  // Toggle study module completion
  const handleToggleModuleCompletion = (moduleId: string) => {
    setModules(prev => prev.map(m => {
      if (m.id === moduleId) {
        return {
          ...m,
          completed: !m.completed,
          progress: !m.completed ? 100 : 0
        };
      }
      return m;
    }));
  };

  // Authenticate from Auth Screen
  const handleAuthenticate = (user: UserProfile) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    setCurrentView('dashboard');
  };

  // Sign out (Clears session cookie and resets view)
  const handleSignOut = async () => {
    try {
      await authClient.logout();
    } catch {
      // Graceful offline fallback
    }
    setIsAuthenticated(false);
    setCurrentView('landing');
  };

  // Landing page quick entry actions
  const handleSelectRoleAndStart = (role: UserRole) => {
    handleSwitchRole(role);
    setCurrentView('dashboard');
  };

  // Update profile from settings
  const handleUpdateProfile = async (updated: UserProfile) => {
    setCurrentUser(updated);
    try {
      await authClient.updateProfile({
        name: updated.name,
        institution: updated.institution,
        professionalId: updated.professionalId,
        specialty: updated.specialty,
        university: updated.university,
        program: updated.program,
        yearOfStudy: updated.yearOfStudy
      });
    } catch (err) {
      console.warn('Profile sync fallback:', err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900 font-['Manrope']">
      
      {/* Show Navigation on all authenticated / app screens */}
      {currentView !== 'landing' && currentView !== 'signin' && currentView !== 'signup' && (
        <Navigation
          currentView={currentView}
          onNavigate={(view) => setCurrentView(view)}
          currentUser={currentUser}
          onSwitchRole={handleSwitchRole}
          onSignOut={handleSignOut}
        />
      )}

      {/* Main Viewport Container */}
      <div className="flex-1">
        
        {/* LANDING SCREEN */}
        {currentView === 'landing' && (
          <LandingView
            onGetStarted={() => { setAuthMode('signup'); setCurrentView('signup'); }}
            onSignIn={() => { setAuthMode('signin'); setCurrentView('signin'); }}
            onSelectRoleAndStart={handleSelectRoleAndStart}
          />
        )}

        {/* AUTHENTICATION SCREEN */}
        {(currentView === 'signin' || currentView === 'signup') && (
          <AuthView
            mode={currentView as 'signin' | 'signup'}
            onToggleMode={() => setCurrentView(currentView === 'signin' ? 'signup' : 'signin')}
            onAuthenticate={handleAuthenticate}
            onBackToLanding={() => setCurrentView('landing')}
            initialRole={currentUser.role}
            resetTokenParam={urlResetToken}
          />
        )}

        {/* DASHBOARD: DOCTOR MODE */}
        {currentView === 'dashboard' && currentUser.role === 'doctor' && (
          <DoctorDashboard
            currentUser={currentUser}
            cases={cases}
            onNavigate={(view) => setCurrentView(view)}
            onViewReport={(c) => setActiveReportModalCase(c)}
          />
        )}

        {/* DASHBOARD: STUDENT MODE */}
        {currentView === 'dashboard' && currentUser.role === 'student' && (
          <StudentDashboard
            currentUser={currentUser}
            modules={modules}
            cases={cases}
            onNavigate={(view) => setCurrentView(view)}
            onOpenModule={(m) => setActiveStudyModule(m)}
            onViewReport={(c) => setActiveReportModalCase(c)}
          />
        )}

        {/* 6-STEP NEW ANALYSIS FLOW */}
        {currentView === 'new_analysis' && (
          <NewAnalysisFlow
            currentUser={currentUser}
            onAnalysisComplete={handleAnalysisComplete}
            onNavigate={(view) => setCurrentView(view)}
            onViewReport={(c) => setActiveReportModalCase(c)}
            activeModel={activeModel}
          />
        )}

        {/* MODEL TRAINING & CUSTOM DATASET HUB */}
        {currentView === 'model_training' && (
          <ModelTrainingStudio
            dataset={dataset}
            onAddSample={handleAddSample}
            onRemoveSample={handleRemoveSample}
            trainedModels={trainedModels}
            activeModel={activeModel}
            onSetActiveModel={handleSetActiveModel}
            onAddTrainedModel={handleAddTrainedModel}
            onNavigateToAnalysis={() => setCurrentView('new_analysis')}
          />
        )}

        {/* CLINICAL REVIEWS QUEUE */}
        {currentView === 'clinical_reviews' && (
          <ClinicalReviewsView
            currentUser={currentUser}
            cases={cases}
            onSignOffCase={handleSignOffCase}
            onViewReport={(c) => setActiveReportModalCase(c)}
          />
        )}

        {/* STUDY RESOURCES & QUIZ */}
        {currentView === 'study_resources' && (
          <StudyResourcesView
            modules={modules}
            activeModule={activeStudyModule}
            onSelectModule={(m) => setActiveStudyModule(m)}
            onToggleModuleCompletion={handleToggleModuleCompletion}
          />
        )}

        {/* CASE HISTORY VIEW */}
        {currentView === 'case_history' && (
          <CaseHistoryView
            cases={cases}
            onViewReport={(c) => setActiveReportModalCase(c)}
            onNewAnalysis={() => setCurrentView('new_analysis')}
          />
        )}

        {/* REPORTS VIEW */}
        {currentView === 'reports' && (
          <ReportsView
            cases={cases}
            onViewReport={(c) => setActiveReportModalCase(c)}
          />
        )}

        {/* SETTINGS VIEW */}
        {currentView === 'settings' && (
          <SettingsView
            currentUser={currentUser}
            onUpdateProfile={handleUpdateProfile}
            onSignOut={handleSignOut}
          />
        )}

      </div>

      {/* Report Modal */}
      {activeReportModalCase && (
        <ReportModal
          reportCase={activeReportModalCase}
          currentUser={currentUser}
          onClose={() => setActiveReportModalCase(null)}
        />
      )}

      {/* Standard Footer */}
      {currentView !== 'signin' && currentView !== 'signup' && (
        <Footer />
      )}

    </div>
  );
}
export default App;
