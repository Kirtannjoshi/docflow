import React, { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { 
  ArrowLeft, Bold, Italic, Underline as UnderlineIcon, Heading1, Heading2, 
  List, ListOrdered, Share2, Save, Cloud, CloudLightning, X, ShieldAlert,
  UserPlus, Check, Eye, Trash2
} from 'lucide-react';

const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000'
  : 'https://docflow-qgsx.onrender.com';

export default function Editor({ user, documentId, onBack }) {
  const [doc, setDoc] = useState(null);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saving' | 'saved' | 'error'
  const [showShareModal, setShowShareModal] = useState(false);
  
  // Share form state
  const [shareEmail, setShareEmail] = useState('');
  const [sharePermission, setSharePermission] = useState('view');
  const [shareLoading, setShareLoading] = useState(false);
  const [shareError, setShareError] = useState('');
  const [shareSuccess, setShareSuccess] = useState('');
  const [sharesList, setSharesList] = useState([]);

  const isReadOnly = doc && doc.permission === 'view';
  const saveTimeoutRef = useRef(null);

  // Initialize TipTap
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline
    ],
    content: '',
    editable: !isReadOnly,
    onUpdate: ({ editor }) => {
      if (isReadOnly) return;
      triggerAutosave(title, editor.getHTML());
    }
  }, [isReadOnly]);

  // Load document
  useEffect(() => {
    fetchDocument();
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [documentId, user]);

  // Update editor content when document finishes loading or permission changes
  useEffect(() => {
    if (editor && doc) {
      editor.commands.setContent(doc.content || '');
      editor.setEditable(!isReadOnly);
    }
  }, [doc, editor, isReadOnly]);

  const fetchDocument = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE}/api/documents/${documentId}`, {
        headers: { 'x-user-id': user.id }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch document');
      }

      const data = await response.json();
      setDoc(data);
      setTitle(data.title);
      setSharesList(data.shares || []);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Could not load document.');
    } finally {
      setLoading(false);
    }
  };

  const handleTitleChange = (e) => {
    if (isReadOnly) return;
    const newTitle = e.target.value;
    setTitle(newTitle);
    triggerAutosave(newTitle, editor ? editor.getHTML() : '');
  };

  const triggerAutosave = (updatedTitle, updatedContent) => {
    if (isReadOnly) return;
    setSaveStatus('saving');

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveDocument(updatedTitle, updatedContent);
    }, 1000); // 1 second debounce
  };

  const saveDocument = async (updatedTitle, updatedContent) => {
    if (isReadOnly) return;
    try {
      const response = await fetch(`${API_BASE}/api/documents/${documentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id
        },
        body: JSON.stringify({
          title: updatedTitle,
          content: updatedContent
        })
      });

      if (!response.ok) {
        throw new Error('Save failed');
      }

      setSaveStatus('saved');
    } catch (err) {
      console.error(err);
      setSaveStatus('error');
    }
  };

  const handleShare = async (e) => {
    e.preventDefault();
    if (!shareEmail.trim()) return;

    setShareLoading(true);
    setShareError('');
    setShareSuccess('');

    try {
      const response = await fetch(`${API_BASE}/api/documents/${documentId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id
        },
        body: JSON.stringify({
          email: shareEmail.trim(),
          permission: sharePermission
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to share document');
      }

      setShareSuccess(`Shared with ${shareEmail}`);
      setShareEmail('');
      
      // Refresh shares list
      const sharesRes = await fetch(`${API_BASE}/api/documents/${documentId}`, {
        headers: { 'x-user-id': user.id }
      });
      if (sharesRes.ok) {
        const docData = await sharesRes.json();
        setSharesList(docData.shares || []);
      }
    } catch (err) {
      console.error(err);
      setShareError(err.message || 'Error occurred during sharing');
    } finally {
      setShareLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900 mb-3"></div>
        <span className="text-neutral-450 text-xs font-medium">Fetching page contents...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm max-w-sm w-full text-center">
          <ShieldAlert className="h-10 w-10 text-neutral-800 mx-auto mb-3" />
          <h3 className="text-md font-bold text-neutral-900">Access Denied</h3>
          <p className="text-neutral-500 text-xs mt-2">{error}</p>
          <button
            onClick={onBack}
            className="mt-5 inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Go Back</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans selection:bg-neutral-200">
      
      {/* Notion-style Top Header */}
      <header className="h-12 border-b border-neutral-200/60 bg-white px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
        
        {/* Left header: Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs font-medium text-neutral-500">
          <button
            onClick={onBack}
            className="flex items-center gap-1 hover:text-neutral-950 transition-colors cursor-pointer"
          >
            <span>Workspace</span>
          </button>
          <span className="text-neutral-300">/</span>
          <span className="text-neutral-800 font-semibold max-w-[120px] sm:max-w-xs truncate">
            {title}
          </span>
        </div>

        {/* Right header: Save Status & Actions */}
        <div className="flex items-center gap-4 text-xs">
          
          {/* Read Only Badge */}
          {isReadOnly ? (
            <span className="flex items-center gap-1 text-[9px] uppercase font-bold text-neutral-500 bg-neutral-100 border border-neutral-200 px-2.5 py-0.5 rounded-full">
              <Eye className="h-3 w-3" />
              <span>Read Only</span>
            </span>
          ) : (
            <div className="flex items-center gap-1.5">
              {saveStatus === 'saving' && (
                <span className="text-neutral-450 flex items-center gap-1">
                  <Save className="h-3 w-3 animate-spin" />
                  <span>Saving...</span>
                </span>
              )}
              {saveStatus === 'saved' && (
                <span className="text-neutral-450 flex items-center gap-1">
                  <Cloud className="h-3.5 w-3.5 text-neutral-400" />
                  <span>Saved</span>
                </span>
              )}
              {saveStatus === 'error' && (
                <span className="text-red-500 flex items-center gap-1 font-semibold">
                  <CloudLightning className="h-3.5 w-3.5" />
                  <span>Network Error</span>
                </span>
              )}
            </div>
          )}

          {doc.role === 'owner' && (
            <button
              onClick={() => setShowShareModal(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-neutral-950 hover:bg-neutral-850 text-white rounded text-xs font-semibold cursor-pointer transition-colors"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>Share</span>
            </button>
          )}
        </div>
      </header>

      {/* Editor Body */}
      <div className="flex-1 max-w-2xl w-full mx-auto px-6 py-10 flex flex-col">
        
        {/* Editor Title (Inline heading) */}
        <div className="mb-6">
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            disabled={isReadOnly}
            className="text-4xl font-extrabold text-neutral-900 focus:outline-none bg-transparent w-full border-none p-0 placeholder-neutral-200 tracking-tight"
            placeholder="Untitled Page"
          />
        </div>

        {/* Minimal Sticky Toolbar */}
        {!isReadOnly && editor && (
          <div className="bg-white border-y border-neutral-200/80 py-1.5 mb-6 flex flex-wrap items-center gap-0.5 sticky top-12 z-25 bg-opacity-95 backdrop-blur-sm">
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`p-1.5 rounded cursor-pointer hover:bg-neutral-100 transition-colors ${editor.isActive('bold') ? 'bg-neutral-100 text-neutral-950 font-bold' : 'text-neutral-500'}`}
              title="Bold"
            >
              <Bold className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`p-1.5 rounded cursor-pointer hover:bg-neutral-100 transition-colors ${editor.isActive('italic') ? 'bg-neutral-100 text-neutral-950 font-bold' : 'text-neutral-500'}`}
              title="Italic"
            >
              <Italic className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={`p-1.5 rounded cursor-pointer hover:bg-neutral-100 transition-colors ${editor.isActive('underline') ? 'bg-neutral-100 text-neutral-950 font-bold' : 'text-neutral-500'}`}
              title="Underline"
            >
              <UnderlineIcon className="h-3.5 w-3.5" />
            </button>

            <div className="w-px h-4 bg-neutral-200 mx-1"></div>

            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={`p-1.5 rounded cursor-pointer hover:bg-neutral-100 transition-colors ${editor.isActive('heading', { level: 1 }) ? 'bg-neutral-100 text-neutral-950 font-bold' : 'text-neutral-500'}`}
              title="Heading 1"
            >
              <Heading1 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={`p-1.5 rounded cursor-pointer hover:bg-neutral-100 transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-neutral-100 text-neutral-950 font-bold' : 'text-neutral-500'}`}
              title="Heading 2"
            >
              <Heading2 className="h-3.5 w-3.5" />
            </button>

            <div className="w-px h-4 bg-neutral-200 mx-1"></div>

            <button
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={`p-1.5 rounded cursor-pointer hover:bg-neutral-100 transition-colors ${editor.isActive('bulletList') ? 'bg-neutral-100 text-neutral-950 font-bold' : 'text-neutral-500'}`}
              title="Bulleted List"
            >
              <List className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={`p-1.5 rounded cursor-pointer hover:bg-neutral-100 transition-colors ${editor.isActive('orderedList') ? 'bg-neutral-100 text-neutral-950 font-bold' : 'text-neutral-500'}`}
              title="Numbered List"
            >
              <ListOrdered className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* TipTap editor area (Borderless Notion-style sheet) */}
        <div className="flex-1 min-h-[500px]">
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-neutral-950/20 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-neutral-250 max-w-sm w-full p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-100">
            <button
              onClick={() => {
                setShowShareModal(false);
                setShareError('');
                setShareSuccess('');
              }}
              className="absolute top-4 right-4 p-1 text-neutral-400 hover:text-neutral-600 rounded hover:bg-neutral-100 cursor-pointer"
            >
              <X className="h-4.5 w-4.5" />
            </button>

            <h3 className="text-md font-bold text-neutral-900 mb-2 flex items-center gap-1.5">
              <Share2 className="h-4.5 w-4.5 text-neutral-900" />
              <span>Share Page</span>
            </h3>
            <p className="text-neutral-500 text-[11px] mb-5">
              Type the email of another user to grant them access to this page.
            </p>

            {shareError && (
              <div className="mb-4 p-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded">
                {shareError}
              </div>
            )}
            {shareSuccess && (
              <div className="mb-4 p-2 bg-neutral-50 border border-neutral-200 text-neutral-800 text-xs rounded flex items-center gap-1.5 font-medium">
                <Check className="h-3.5 w-3.5 text-neutral-900 shrink-0" />
                <span>{shareSuccess}</span>
              </div>
            )}

            <form onSubmit={handleShare} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="alex@demo.com"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  className="w-full px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                  Access Level
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSharePermission('view')}
                    className={`py-2 border rounded text-xs font-semibold cursor-pointer transition-colors ${
                      sharePermission === 'view'
                        ? 'border-neutral-900 bg-neutral-900 text-white'
                        : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'
                    }`}
                  >
                    Viewer
                  </button>

                  <button
                    type="button"
                    onClick={() => setSharePermission('edit')}
                    className={`py-2 border rounded text-xs font-semibold cursor-pointer transition-colors ${
                      sharePermission === 'edit'
                        ? 'border-neutral-900 bg-neutral-900 text-white'
                        : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'
                    }`}
                  >
                    Editor
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={shareLoading}
                className="w-full flex justify-center items-center gap-1.5 py-2 bg-neutral-900 hover:bg-neutral-850 text-white rounded text-xs font-semibold cursor-pointer disabled:opacity-50 mt-4 shadow-sm"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>{shareLoading ? 'Sharing...' : 'Share Page'}</span>
              </button>
            </form>

            {sharesList.length > 0 && (
              <div className="mt-6 pt-5 border-t border-neutral-100">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-2">
                  Shared With ({sharesList.length})
                </span>
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {sharesList.map((share) => (
                    <div key={share.id} className="flex justify-between items-center bg-neutral-50 p-2 rounded border border-neutral-100 text-xs">
                      <div>
                        <span className="font-semibold text-neutral-800 block">{share.name}</span>
                        <span className="text-[10px] text-neutral-400">{share.email}</span>
                      </div>
                      <span className="text-[9px] uppercase font-bold text-neutral-500 bg-neutral-200/70 px-1.5 py-0.5 rounded">
                        {share.permission}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
