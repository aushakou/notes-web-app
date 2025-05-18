import { useState } from 'react';
import Layout from '../Layout';
import NoteForm from './NoteForm';
import NotesList from './NotesList';
import useLocalStorage from '../../hooks/useLocalStorage';

export default function NotesPage() {
  const [notes, setNotes] = useLocalStorage('notes', []);
  const [showSidebar, setShowSidebar] = useState(true);

  const addNote = (text) => {
    const newNote = { id: Date.now(), text };
    setNotes([newNote, ...notes]);
  };

  const deleteNote = (id) => {
    setNotes(notes.filter((note) => note.id !== id));
  };

  return (
    <Layout>
      <div className="flex h-screen">
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
                        <li key={note.id} className="p-2 bg-white border rounded text-sm truncate">
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
    </Layout>
  );
}
