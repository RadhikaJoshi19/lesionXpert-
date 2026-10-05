import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from '../components/Navbar';
import { Hero } from '../components/Hero';
import { ImageUpload } from '../components/ImageUpload';
import { CaptionResult } from '../components/CaptionResult';
import { HowItWorks } from '../components/HowItWorks';
import { SessionHistory } from '../components/SessionHistory';
import { Footer } from '../components/Footer';
import { checkBackendHealth, generateImageCaption } from '../services/api';
import { CaptionResponse, HealthStatus, HistoryItem } from '../types';

const STORAGE_KEY = 'visioncaption_history_v1';

export const Home: React.FC = () => {
  // Application State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CaptionResponse | null>(null);

  // Health Status
  const [health, setHealth] = useState<HealthStatus>({
    status: 'offline',
    model: 'Salesforce/blip-image-captioning-base',
    device: 'cpu',
    model_loaded: false,
  });

  // History Drawer & Storage
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Save history on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (e) {
      console.warn('Could not persist history to localStorage', e);
    }
  }, [history]);

  // Check backend health periodically
  const verifyHealth = useCallback(async () => {
    const status = await checkBackendHealth();
    setHealth(status);
  }, []);

  useEffect(() => {
    verifyHealth();
    const interval = setInterval(verifyHealth, 15000);
    return () => clearInterval(interval);
  }, [verifyHealth]);

  // Clean up object URL when component unmounts or image changes
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Handle file selection
  const handleImageSelected = (file: File) => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    const url = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(url);
    setError(null);
    setResult(null);
  };

  // Reset image selection
  const handleReset = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
    setResult(null);
  };

  // Generate caption via Deep Learning model
  const handleGenerate = async () => {
    if (!selectedFile) {
      setError('Please select an image first.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await generateImageCaption(selectedFile);
      setResult(response);

      // Add to session history
      const reader = new FileReader();
      reader.onloadend = () => {
        const thumbnail = (reader.result as string) || (previewUrl || '');
        const newItem: HistoryItem = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          thumbnail,
          caption: response.caption,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          model: response.model,
          inference_time: response.inference_time,
          fileName: selectedFile.name,
          fileSize: selectedFile.size,
        };

        setHistory((prev) => [newItem, ...prev.slice(0, 19)]);
      };
      reader.readAsDataURL(selectedFile);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred during caption generation.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // History operations
  const handleDeleteHistoryItem = (id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const handleSelectHistoryItem = (item: HistoryItem) => {
    setPreviewUrl(item.thumbnail);
    setSelectedFile(null);
    setResult({
      success: true,
      caption: item.caption,
      inference_time: item.inference_time,
      model: item.model,
    });
    setIsHistoryOpen(false);
    window.scrollTo({ top: 180, behavior: 'smooth' });
  };

  const scrollToHowItWorks = () => {
    const el = document.getElementById('how-it-works');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Top Navigation */}
      <Navbar
        health={health}
        historyCount={history.length}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onScrollToHowItWorks={scrollToHowItWorks}
      />

      {/* Main Body */}
      <main className="flex-1">
        {/* Hero Banner */}
        <Hero />

        {/* Upload & Workspace Area */}
        <div className="py-4">
          <ImageUpload
            onImageSelected={handleImageSelected}
            selectedFile={selectedFile}
            previewUrl={previewUrl}
            onReset={handleReset}
            onGenerate={handleGenerate}
            isLoading={isLoading}
            error={error}
            backendReady={health.status !== 'offline'}
          />

          {/* Result Card when generation completes */}
          {result && previewUrl && (
            <CaptionResult
              previewUrl={previewUrl}
              result={result}
              fileName={selectedFile?.name || 'Uploaded Image'}
              onRegenerate={handleGenerate}
              onNewImage={handleReset}
              isLoading={isLoading}
            />
          )}
        </div>

        {/* How It Works Architecture Section */}
        <HowItWorks />
      </main>

      {/* History Slide-over Drawer */}
      <SessionHistory
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onDeleteItem={handleDeleteHistoryItem}
        onClearHistory={handleClearHistory}
        onSelectHistoryItem={handleSelectHistoryItem}
      />

      {/* Bottom Footer */}
      <Footer />
    </div>
  );
};
