import { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import useSWR from 'swr';
import NoteForm from './NoteForm';
import NotesList from './NotesList';
import NotesSidebar from './NotesSidebar';

const fetcher = (url) => fetch(url).then((res) => res.json());
const NEW_NOTE_PLACEHOLDER_ID = `NEW_NOTE_PLACEHOLDER_ID`;

export default function NotesPage() {
  const [userId, setUserId] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);
  const [selectedNote, setSelectedNote] = useState(null);
  const scrollContainerRef = useRef(null);
  const previousSelectedNoteIdRef = useRef();

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

  // Effect to remove empty, unsaved placeholder if another note is selected
  useEffect(() => {
    const prevSelectedId = previousSelectedNoteIdRef.current;
    const currentSelectedId = selectedNote?._id;

    if (
      prevSelectedId === NEW_NOTE_PLACEHOLDER_ID && // The previously selected item was the placeholder
      currentSelectedId !== NEW_NOTE_PLACEHOLDER_ID   // And now something else (or nothing) is selected
    ) {
      // Find the placeholder in the current notes list (from SWR cache)
      const placeholderInCache = notes.find(note => note._id === NEW_NOTE_PLACEHOLDER_ID);

      if (
        placeholderInCache &&
        !placeholderInCache.title && // Check if it's actually empty
        !placeholderInCache.body
      ) {
        mutate(
          (currentNotesData = []) => currentNotesData.filter(n => n._id !== NEW_NOTE_PLACEHOLDER_ID),
          { revalidate: false } // Don't re-fetch from server, just update local cache
        );
      }
    }

    // Update the ref for the next render
    previousSelectedNoteIdRef.current = currentSelectedId;
  }, [selectedNote, notes, mutate]); // Dependencies: selectedNote, notes array, and mutate function

  const addNote = async ({ title, body }) => {
    let noteToReturnForForm = null;

    await mutate(
      async (currentNotesData = []) => {
        const res = await fetch('/api/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, body, userId, updatedAt: new Date().toISOString() }),
        });
        const newNoteFromServer = await res.json();
        noteToReturnForForm = newNoteFromServer;

        // If the selected note was the placeholder, update NotesPage's selectedNote state
        // to the new note from the server *before* this async callback returns data to SWR.
        if (selectedNote?._id === NEW_NOTE_PLACEHOLDER_ID && newNoteFromServer) {
          setSelectedNote(newNoteFromServer);
        }

        // Replace the placeholder with the actual note from the server in SWR's cache
        return currentNotesData.map(note =>
          note._id === NEW_NOTE_PLACEHOLDER_ID ? newNoteFromServer : note
        );
      },
      {
        optimisticData: (currentNotesData = []) => {
          // Find and update the existing placeholder note in SWR cache
          return currentNotesData.map(note => {
            if (note._id === NEW_NOTE_PLACEHOLDER_ID) {
              return {
                ...note,
                title,
                body,
                updatedAt: new Date().toISOString(),
              };
            }
            return note;
          });
        },
        rollbackOnError: true,
        revalidate: false,
      }
    );

    return noteToReturnForForm;
  };

  const updateNote = async (id, { title, body }) => {
    if (id === NEW_NOTE_PLACEHOLDER_ID) return; // don't try to PATCH a temp note

    mutate(
      async (currentNotes = []) => {
        const res = await fetch(`/api/notes/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, body }),
        });
        
        const updatedNote = await res.json();
        
        return currentNotes.map((note) =>
          note._id === id ? updatedNote : note
        );
      },
      {
        optimisticData: (currentNotes = []) =>
          currentNotes.map((note) =>
            note._id === id ? { ...note, title, body, updatedAt: new Date().toISOString() } : note
          ),
        rollbackOnError: true,
        revalidate: false,
      }
    );
  };

  const deleteNote = async (id) => {
    if (selectedNote?._id === id) {
      setSelectedNote(null);
    }

    // If it's the placeholder note, just remove it locally without an API call.
    if (id === NEW_NOTE_PLACEHOLDER_ID) {
      mutate(
        (currentNotes = []) => currentNotes.filter((note) => note._id !== id),
        { revalidate: false } // No need to revalidate from server
      );
      return; // Stop execution to prevent API call
    }

    // For actual notes, proceed with API call and optimistic update
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
    // Check for an existing empty note with a real ID
    const existingEmptyNote = notes.find(note =>
      !note.title &&
      !note.body &&
      note._id && note._id !== NEW_NOTE_PLACEHOLDER_ID
    );

    if (existingEmptyNote) {
      setSelectedNote(existingEmptyNote);
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' }); 
      return;
    }

    // If no existing empty note, proceed to create a new placeholder
    const placeholderNote = {
      _id: NEW_NOTE_PLACEHOLDER_ID,
      title: '',
      body: '',
      userId,
      updatedAt: new Date().toISOString(),
    };

    // Use SWR's mutate to update the local cache
    mutate(
      (currentNotesData = []) => {
        // Remove any existing placeholder first to avoid duplicates if clicked multiple times
        const notesWithoutOldPlaceholder = currentNotesData.filter(
          note => note._id !== NEW_NOTE_PLACEHOLDER_ID
        );
        // Add the new placeholder at the beginning of the list
        return [placeholderNote, ...notesWithoutOldPlaceholder];
      },
      { revalidate: false } // Don't re-fetch from server for this UI-only change
    );

    setSelectedNote(placeholderNote);
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
        <main ref={scrollContainerRef} className={`flex-1 overflow-y-auto w-fit p-6 transition-all duration-300 ${showSidebar ? 'ml-72' : 'ml-9 w-full'}`}>
          <div className="flex justify-between items-center">
            <h1 className="w-125 text-2xl truncate font-bold mb-4">Notes/{selectedNote?.title || 'Untitled'}</h1>
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
            scrollContainerRef={scrollContainerRef}
          />
          <hr className="text-gray-300 mt-6" />
          {isLoading ? (
            <p className="text-gray-500">Loading notes...</p>
          ) : (
            <div className="mt-2">
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
