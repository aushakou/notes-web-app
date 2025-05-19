import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import useSWR from 'swr';
import NoteForm from './NoteForm';
import NotesList from './NotesList';
import NotesSidebar from './NotesSidebar';

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function NotesPage() {
  const [userId, setUserId] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);
  const [selectedNote, setSelectedNote] = useState({_id: null, title: ''});

  // Initialize userId from localStorage
  useEffect(() => {
    let storedId = localStorage.getItem('userId');
    if (!storedId) {
      storedId = uuidv4();
      localStorage.setItem('userId', storedId);
    }
    setUserId(storedId);
  }, []);

  // Fetch notes with SWR
  const { data: notes = [], mutate, isLoading } = useSWR(
    userId ? `/api/notes?userId=${userId}` : null,
    fetcher
  );

  // Add note
  const addNote = async ({ title, body }) => {
    const tempNote = {
      _id: `temp-${Date.now()}`,
      title,
      body,
      userId,
      createdAt: new Date().toISOString(),
    };

    let newNote;

    await mutate(
      async (currentNotes = []) => {
        const res = await fetch('/api/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, body, userId }),
        });
        newNote = await res.json();
        return [newNote, ...currentNotes.filter(n => n._id !== tempNote._id)];
      },
      {
        optimisticData: (currentNotes = []) => [tempNote, ...currentNotes],
        rollbackOnError: true,
        revalidate: false,
      }
    );
  
    return newNote;
  };

  // Update note
  const updateNote = async (id, { title, body }) => {
    if (id.startsWith('temp-')) return; // don't try to PATCH a temp note

    mutate(
      async (currentNotes = []) => {
        await fetch(`/api/notes/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, body }),
        });
        return currentNotes.map((note) =>
          note._id === id ? { ...note, title, body } : note
        );
      },
      {
        optimisticData: (currentNotes = []) =>
          currentNotes.map((note) =>
            note._id === id ? { ...note, title, body } : note
          ),
        rollbackOnError: true,
        revalidate: false,
      }
    );
  };

  // Delete note
  const deleteNote = async (id) => {
    if (selectedNote?._id === id) setSelectedNote(null);

    mutate(
      async (currentNotes = []) => {
        await fetch(`/api/notes/${id}`, { method: 'DELETE' });
        return currentNotes.filter((note) => note._id !== id);
      },
      {
        optimisticData: (currentNotes = []) =>
          currentNotes.filter((note) => note._id !== id),
        rollbackOnError: true,
        revalidate: false,
      }
    );
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
                loading={isLoading}
                onSelect={setSelectedNote}
                selectedNote={selectedNote}
              />
            )}
          </div>
        </div>
        {/* Main content always full width if sidebar is hidden */}
        <main className={`flex-1 overflow-y-auto w-fit p-6 transition-all duration-300 ${showSidebar ? 'ml-72' : 'ml-9 w-full'}`}>
          <div className="flex justify-between items-center">
            <h1 className="w-125 text-2xl truncate font-bold mb-4">Notes/{selectedNote.title}</h1>
            <button
              onClick={handleNewNote}
              type="button"
              className="text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700"
            >
              New Note
            </button>
          </div>
          <NoteForm
            onAdd={addNote}
            onUpdate={updateNote}
            onDelete={deleteNote}
            selectedNote={selectedNote}
            setSelectedNote={setSelectedNote}
            mutate={mutate}
          />
          {isLoading ? (
            <p className="text-gray-500">Loading...</p>
          ) : (
            <div className="mt-5">
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
