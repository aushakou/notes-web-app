import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import NoteForm from './NoteForm';
import NotesList from './NotesList';
import NotesSidebar from './NotesSidebar';

export default function NotesPage() {
  const [notes, setNotes] = useState([]);
  const [showSidebar, setShowSidebar] = useState(true);
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(true);

  // Initialize user ID
  useEffect(() => {
    let storedId = localStorage.getItem('userId');
    if (!storedId) {
      storedId = uuidv4();
      localStorage.setItem('userId', storedId);
    }
    setUserId(storedId);
  }, []);

  // Fetch notes from MongoDB Cluster
  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    fetch(`/api/notes?userId=${userId}`)
      .then((res) => res.json())
      .then((data) => {
        setNotes(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error loading notes:', err);
        setLoading(false);
      });
  }, [userId]);

  const addNote = async (text) => {
    const res = await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, userId }),
    });
    const newNote = await res.json();
    setNotes([newNote, ...notes]);
  };

  const deleteNote = async (id) => {
    await fetch(`/api/notes/${id}`, { method: 'DELETE' });
    setNotes(notes.filter((note) => note._id !== id));
  };

  return (
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <div className="flex flex-row">
          <div className="flex-none">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="h-full w-fit bg-gray-200 text-sm px-2 py-1 rounded hover:bg-gray-300"
            >
              {showSidebar ? '<<' : '>>'}
            </button>
          </div>
          {showSidebar && (
            <NotesSidebar notes={notes} loading={loading} />
          )}
        </div>
        {/* Main content always full width if sidebar is hidden */}
        <main className={`flex-1 w-fit p-6 transition-all duration-300 ${showSidebar ? '' : 'w-full'}`}>
          <h1 className="text-2xl font-bold mb-4">Add a Note</h1>
          <NoteForm onAdd={addNote} />
          {loading ? (
            <p className="text-gray-500">Loading...</p>
          ) : (
            <NotesList notes={notes} onDelete={deleteNote} />
          )}
        </main>
      </div>
  );
}
