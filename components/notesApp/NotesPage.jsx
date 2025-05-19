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
  const [selectedNote, setSelectedNote] = useState({_id: null, title: ''});

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
        setNotes(data.reverse());
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error loading notes:', err);
        setLoading(false);
      });
  }, [userId]);

  const addNote = async ({ title, body }) => {
    const res = await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, body, userId }),
    });
    const newNote = await res.json();
    setNotes([newNote, ...notes]);
    return newNote;
  };

  const updateNote = async (id, { title, body }) => {
    const res = await fetch(`/api/notes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, body }),
    });
    const updatedNote = await res.json();
  
    setNotes(notes.map((n) => (n._id === id ? updatedNote : n)));
  };

  const deleteNote = async (id) => {
    await fetch(`/api/notes/${id}`, { method: 'DELETE' });
    setNotes(notes.filter((note) => note._id !== id));
  };

  const handleNewNote = () => {
    setSelectedNote({ title: '', body: '' });
  };

  return (
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <div className="flex flex-row">
          <div 
          onClick={() => setShowSidebar(!showSidebar)}
          className="z-100 bg-gray-200 hover:bg-gray-300">
            <div 
              className="fixed h-full w-9 bg-gray-200 hover:bg-gray-300"
            >
            </div> 
            <span
              className="fixed top-1/2 -translate-y-1/2 z-50 select-none pointer-events-none text-gray-500 px-2 py-1"
            >
              {showSidebar ? '<<' : '>>'}
            </span>
          </div>
          <div
            className={`fixed ml-9 top-0 left-0 h-screen z-10 w-64 bg-gray-100 shadow transition-transform duration-300 transform ${
              showSidebar ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            {showSidebar && (
              <NotesSidebar 
                notes={notes}
                loading={loading}
                onSelect={setSelectedNote}
                selectedNote={selectedNote}
              />
            )}
          </div>
        </div>
        {/* Main content always full width if sidebar is hidden */}
        <main className={`flex-1 overflow-y-auto w-fit p-6 transition-all duration-300 ${showSidebar ? 'ml-72' : 'ml-9 w-full'}`}>
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold mb-4">Add a Note</h1>
            <button
              onClick={handleNewNote}
              type="button"
              className="text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700"
            >
              New Note
            </button>
          </div>
          <NoteForm
            onAdd={async ({ title, body }) => {
              const newNote = await addNote({ title, body });
              setSelectedNote(newNote);
              return newNote;
            }}
            onUpdate={updateNote}
            onDelete={deleteNote}
            selectedNote={selectedNote}
            setSelectedNote={setSelectedNote}
          />
          {loading ? (
            <p className="text-gray-500">Loading...</p>
          ) : (
            <div className="mt-10">
              <NotesList
                notes={notes}
                onDelete={deleteNote}
                onSelect={setSelectedNote}
                selectedNote={selectedNote}
              />
            </div>
          )}
        </main>
      </div>
  );
}
