import React, { useState, useEffect } from 'react';
import { Plus, FileText, Share2, Trash2, Upload, LogOut, Clock, User, AlertCircle, Sparkles, FolderClosed, FileSymlink } from 'lucide-react';

export default function Dashboard({ user, onLogout, onSelectDocument }) {
  const [ownedDocs, setOwnedDocs] = useState([]);
  const [sharedDocs, setSharedDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [importing, setImporting] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'owned' | 'shared'

  useEffect(() => {
    fetchDocuments();
  }, [user]);

  const fetchDocuments = async () => {
    setLoading(true);
    setError('');
    try {
      const headers = { 'x-user-id': user.id };

      // Fetch owned
      const ownedRes = await fetch('http://localhost:5000/api/documents', { headers });
      if (!ownedRes.ok) throw new Error('Failed to load your documents');
      const ownedData = await ownedRes.json();
      setOwnedDocs(ownedData);

      // Fetch shared
      const sharedRes = await fetch('http://localhost:5000/api/shared-documents', { headers });
      if (!sharedRes.ok) throw new Error('Failed to load shared documents');
      const sharedData = await sharedRes.json();
      setSharedDocs(sharedData);
    } catch (err) {
      console.error(err);
      setError('Failed to retrieve documents.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDocument = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id
        },
        body: JSON.stringify({ title: 'Untitled Page', content: '' })
      });

      if (!response.ok) {
        throw new Error('Failed to create document');
      }

      const newDoc = await response.json();
      onSelectDocument(newDoc.id);
    } catch (err) {
      console.error(err);
      setError('Could not create a new document.');
    }
  };

  const handleDeleteDocument = async (e, docId) => {
    e.stopPropagation();
    if (!confirm('Delete this page?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/documents/${docId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': user.id
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete');
      }

      fetchDocuments();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to delete.');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const extension = file.name.split('.').pop().toLowerCase();
    if (extension !== 'txt' && extension !== 'md') {
      alert('Only .txt and .md files are supported.');
      return;
    }

    setImporting(true);
    setError('');

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      const title = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;

      try {
        const response = await fetch('http://localhost:5000/api/documents/import', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': user.id
          },
          body: JSON.stringify({ title, content: `<p>${text.replace(/\n/g, '<br>')}</p>` })
        });

        if (!response.ok) {
          throw new Error('Failed to import file');
        }

        const newDoc = await response.json();
        onSelectDocument(newDoc.id);
      } catch (err) {
        console.error(err);
        setError('Error importing file.');
      } finally {
        setImporting(false);
      }
    };

    reader.readAsText(file);
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-white flex text-neutral-800 font-sans selection:bg-neutral-200">
      
      {/* Notion-style Left Sidebar */}
      <aside className="w-64 border-r border-neutral-200 bg-[#f7f7f5] flex flex-col justify-between shrink-0 p-3 h-screen sticky top-0">
        <div className="space-y-6">
          {/* User Workspace Info */}
          <div className="flex items-center justify-between p-2 hover:bg-neutral-200/50 rounded-lg cursor-pointer transition-colors">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="h-6 w-6 rounded bg-neutral-900 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="font-bold text-sm text-neutral-900 truncate">
                {user.name}'s DocFlow
              </span>
            </div>
            <Sparkles className="h-4 w-4 text-neutral-400" />
          </div>

          {/* Quick Actions */}
          <div className="space-y-1">
            <button
              onClick={handleCreateDocument}
              className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-neutral-200/50 rounded-lg text-sm text-neutral-700 font-semibold cursor-pointer text-left transition-colors"
            >
              <Plus className="h-4 w-4 text-neutral-500" />
              <span>Add a page</span>
            </button>

            <label className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-neutral-200/50 rounded-lg text-sm text-neutral-700 font-semibold cursor-pointer text-left transition-colors">
              <Upload className="h-4 w-4 text-neutral-500" />
              <span>{importing ? 'Importing...' : 'Import file (.txt / .md)'}</span>
              <input
                type="file"
                accept=".txt,.md"
                onChange={handleFileUpload}
                disabled={importing}
                className="hidden"
              />
            </label>
          </div>

          {/* Navigation links */}
          <div className="space-y-1">
            <span className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider px-3 mb-2">
              Private/Shared Tables
            </span>
            <button
              onClick={() => setActiveTab('all')}
              className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm cursor-pointer text-left transition-colors ${
                activeTab === 'all'
                  ? 'bg-neutral-200/70 text-neutral-950 font-bold'
                  : 'text-neutral-600 hover:bg-neutral-200/30'
              }`}
            >
              <FolderClosed className="h-4 w-4 text-neutral-500" />
              <span>All Workspace</span>
            </button>

            <button
              onClick={() => setActiveTab('owned')}
              className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm cursor-pointer text-left transition-colors ${
                activeTab === 'owned'
                  ? 'bg-neutral-200/70 text-neutral-950 font-bold'
                  : 'text-neutral-600 hover:bg-neutral-200/30'
              }`}
            >
              <FileText className="h-4 w-4 text-neutral-500" />
              <span>My Documents</span>
            </button>

            <button
              onClick={() => setActiveTab('shared')}
              className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm cursor-pointer text-left transition-colors ${
                activeTab === 'shared'
                  ? 'bg-neutral-200/70 text-neutral-950 font-bold'
                  : 'text-neutral-600 hover:bg-neutral-200/30'
              }`}
            >
              <FileSymlink className="h-4 w-4 text-neutral-500" />
              <span>Shared With Me</span>
            </button>
          </div>
        </div>

        {/* Footer Area */}
        <div className="border-t border-neutral-200/80 pt-3">
          <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-200/30 mb-2">
            <span className="text-xs font-medium text-neutral-500 truncate" title={user.email}>
              {user.email}
            </span>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-neutral-500 hover:text-neutral-950 rounded-lg hover:bg-neutral-200/50 cursor-pointer transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Logout session</span>
          </button>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <main className="flex-1 min-h-screen py-10 px-8 max-w-4xl mx-auto overflow-y-auto">
        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center justify-between mb-8 pb-4 border-b border-neutral-100">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Workspace Pages</h1>
            <p className="text-neutral-400 text-xs mt-0.5">Quickly access, edit and share your documents.</p>
          </div>
          
          <button
            onClick={handleCreateDocument}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-sm transition-colors"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>New Page</span>
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900 mb-3"></div>
            <span className="text-neutral-400 text-xs font-medium">Fetching pages...</span>
          </div>
        ) : (
          <div className="space-y-8">
            
            {/* My Pages list */}
            {(activeTab === 'all' || activeTab === 'owned') && (
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3 px-2 flex items-center justify-between">
                  <span>My Pages</span>
                  <span>{ownedDocs.length}</span>
                </h2>

                {ownedDocs.length === 0 ? (
                  <p className="text-xs text-neutral-400 px-2 py-4 italic">No private pages. Click "New Page" to create one.</p>
                ) : (
                  <div className="border border-neutral-100 rounded-lg overflow-hidden divide-y divide-neutral-150">
                    {ownedDocs.map((doc) => (
                      <div
                        key={doc.id}
                        onClick={() => onSelectDocument(doc.id)}
                        className="flex items-center justify-between p-3.5 hover:bg-neutral-50 cursor-pointer group transition-colors"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <FileText className="h-4.5 w-4.5 text-neutral-400 shrink-0" />
                          <span className="text-sm font-semibold text-neutral-800 truncate group-hover:text-neutral-950">
                            {doc.title}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-neutral-400">
                          <span className="flex items-center gap-1 text-[11px] shrink-0 font-medium">
                            <Clock className="h-3.5 w-3.5" />
                            <span>{formatDate(doc.updated_at)}</span>
                          </span>

                          <button
                            onClick={(e) => handleDeleteDocument(e, doc.id)}
                            className="p-1 text-neutral-400 hover:text-red-650 hover:bg-red-50 rounded cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Shared Pages list */}
            {(activeTab === 'all' || activeTab === 'shared') && (
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3 px-2 flex items-center justify-between">
                  <span>Shared Pages</span>
                  <span>{sharedDocs.length}</span>
                </h2>

                {sharedDocs.length === 0 ? (
                  <p className="text-xs text-neutral-400 px-2 py-4 italic">No pages have been shared with you yet.</p>
                ) : (
                  <div className="border border-neutral-100 rounded-lg overflow-hidden divide-y divide-neutral-150">
                    {sharedDocs.map((doc) => (
                      <div
                        key={doc.id}
                        onClick={() => onSelectDocument(doc.id)}
                        className="flex items-center justify-between p-3.5 hover:bg-neutral-50 cursor-pointer group transition-colors"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <Share2 className="h-4.5 w-4.5 text-neutral-400 shrink-0" />
                          <div>
                            <span className="text-sm font-semibold text-neutral-800 truncate block group-hover:text-neutral-950">
                              {doc.title}
                            </span>
                            <span className="text-[10px] text-neutral-400 flex items-center gap-1 mt-0.5">
                              <User className="h-3 w-3" />
                              <span>Owner: {doc.owner_name}</span>
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3.5 text-xs text-neutral-400">
                          <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full ${
                            doc.permission === 'edit'
                              ? 'bg-amber-50 border border-amber-200 text-amber-600'
                              : 'bg-neutral-100 border border-neutral-200 text-neutral-600'
                          }`}>
                            {doc.permission === 'edit' ? 'edit' : 'view'}
                          </span>

                          <span className="flex items-center gap-1 text-[11px] shrink-0 font-medium">
                            <Clock className="h-3.5 w-3.5" />
                            <span>{formatDate(doc.updated_at)}</span>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        )}
      </main>
    </div>
  );
}
