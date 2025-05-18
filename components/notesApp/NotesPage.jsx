import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import NoteForm from './NoteForm';
import NotesList from './NotesList';

export default function NotesPage() {
  const [notes, setNotes] = useState([]);
  const [showSidebar, setShowSidebar] = useState(true);
  const [userId, setUserId] = useState('');

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
    fetch(`/api/notes?userId=${userId}`)
      .then((res) => res.json())
      .then((data) => {
        console.log('Fetched notes:', data);
        setNotes(data)
      })
      .catch((err) => console.error('Error loading notes:', err));
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
              <div className="flex">
                <aside className="w-64 bg-gray-100 p-2 overflow-y-auto transition-all duration-300">
                  <h2 className="text-lg font-bold mb-4">🗂 My Notes</h2>
                  {notes.length === 0 ? (
                    <p className="text-sm text-gray-500">No notes yet</p>
                  ) : (
                    <ul className="space-y-2">
                      {notes.map((note) => (
                        <li key={note._id} className="p-2 bg-white ring ring-gray-300 shadow-sm rounded text-sm truncate">
                          {note.text}
                        </li>
                      ))}
                    </ul>
                  )}
                </aside>
              </div>
          )}
        </div>
        {/* Main content always full width if sidebar is hidden */}
        <main className={`flex-1 w-fit p-6 transition-all duration-300 ${showSidebar ? '' : 'w-full'}`}>
          <h1 className="text-2xl font-bold mb-4">Add a Note</h1>
          <NoteForm onAdd={addNote} />
          <NotesList notes={notes} onDelete={deleteNote} />
        </main>
      </div>
  );
}
