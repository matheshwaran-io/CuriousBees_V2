'use client';

import React, { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store/useStore';

export function PushNotificationPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const { currentUser } = useStore();

  useEffect(() => {
    // Only run on client
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    setPermission(Notification.permission);

    // If we haven't asked yet and the user hasn't dismissed it, show the prompt
    const dismissed = localStorage.getItem('push_prompt_dismissed');
    
    if (Notification.permission === 'default' && !dismissed && currentUser) {
      // Small delay so it doesn't pop up instantly on load
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [currentUser]);

  // Simulated Push Notification System (Runs when tab is in background)
  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (permission !== 'granted') return;

    let intervalId: NodeJS.Timeout;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // When tab goes to background, simulate incoming messages/posts
        intervalId = setInterval(() => {
          const mockEvents = [
            { title: 'New Message', body: 'Dr. Jane Du sent you a message about the AI research project.' },
            { title: 'New Post', body: 'Arjun Kumar published a new paper on Knowledge Graphs.' },
            { title: 'Collaboration Request', body: 'You have a new request from the Computer Science department.' }
          ];
          const randomEvent = mockEvents[Math.floor(Math.random() * mockEvents.length)];
          
          new Notification(randomEvent.title, {
            body: randomEvent.body,
            icon: '/favicon.ico', // Assuming there's a standard favicon
          });
        }, 15000); // Simulate an event every 15 seconds while hidden
      } else {
        // When tab is active, stop simulating background notifications
        clearInterval(intervalId);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(intervalId);
    };
  }, [permission]);

  const handleEnable = async () => {
    if (!('Notification' in window)) {
      alert('This browser does not support desktop notifications.');
      return;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === 'granted') {
        setShowPrompt(false);
        new Notification('Notifications Enabled', {
          body: 'You will now receive alerts for new messages and posts when this tab is in the background.'
        });
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('push_prompt_dismissed', 'true');
    setShowPrompt(false);
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed bottom-6 left-6 z-50 max-w-sm w-full bg-white border border-slate-200 rounded-2xl shadow-xl p-4 flex gap-4"
        >
          {/* Bell Icon Container */}
          <div className="shrink-0">
            <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center text-white">
              <Bell className="w-6 h-6" />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 pr-6">
            <h3 className="text-base font-bold text-slate-900 leading-tight">Turn on notifications</h3>
            <p className="text-sm text-slate-500 mt-1 leading-snug">
              Get message alerts when this tab is in the background — like WhatsApp Web.
            </p>
          </div>

          {/* Actions */}
          <div className="absolute right-4 top-4 flex flex-col justify-between h-[calc(100%-2rem)] items-end">
            <button 
              onClick={handleDismiss}
              className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <button 
              onClick={handleEnable}
              className="mt-auto px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-full transition-colors"
            >
              Enable
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
