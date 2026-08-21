import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Editor from './components/Editor';

export default function App() {
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('login'); // 'login' | 'dashboard' | 'editor'
  const [selectedDocumentId, setSelectedDocumentId] = useState(null);

  // Check for stored session on load
  useEffect(() => {
    const savedUser = localStorage.getItem('docflow_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        setCurrentView('dashboard');
      } catch (e) {
        localStorage.removeItem('docflow_user');
      }
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('docflow_user', JSON.stringify(userData));
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('docflow_user');
    setCurrentView('login');
  };

  const handleSelectDocument = (docId) => {
    setSelectedDocumentId(docId);
    setCurrentView('editor');
  };

  const handleBackToDashboard = () => {
    setSelectedDocumentId(null);
    setCurrentView('dashboard');
  };

  return (
    <>
      {currentView === 'login' && <Login onLogin={handleLogin} />}
      {currentView === 'dashboard' && (
        <Dashboard
          user={user}
          onLogout={handleLogout}
          onSelectDocument={handleSelectDocument}
        />
      )}
      {currentView === 'editor' && (
        <Editor
          user={user}
          documentId={selectedDocumentId}
          onBack={handleBackToDashboard}
        />
      )}
    </>
  );
}
