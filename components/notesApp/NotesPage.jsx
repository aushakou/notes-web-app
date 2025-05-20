import { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useTheme } from '@/context/ThemeContext';
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
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
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

  const onToggleFavorite = async (noteId, newIsFavoriteState) => {
    // If it's the placeholder note, just update it locally
    if (noteId === NEW_NOTE_PLACEHOLDER_ID) {
      mutate(
        (currentNotes = []) =>
          currentNotes.map((note) =>
            note._id === noteId ? { ...note, isFavorite: newIsFavoriteState, updatedAt: new Date().toISOString() } : note
          ),
        false
      );
      if (selectedNote && selectedNote._id === noteId) {
        setSelectedNote(prevSelectedNote => ({
          ...prevSelectedNote,
          isFavorite: newIsFavoriteState,
          updatedAt: new Date().toISOString()
        }));
      }
      return;
    }

    // For actual notes, proceed with API call and optimistic update
    mutate(
      (currentNotes = []) =>
        currentNotes.map((note) =>
          note._id === noteId ? { ...note, isFavorite: newIsFavoriteState, updatedAt: new Date().toISOString() } : note
        ),
      false // prevent revalidation, we will do it after the PATCH
    );

    // Optimistically update selectedNote state if it's the one being toggled
    if (selectedNote && selectedNote._id === noteId) {
      setSelectedNote(prevSelectedNote => ({
        ...prevSelectedNote,
        isFavorite: newIsFavoriteState,
        updatedAt: new Date().toISOString() // Keep updatedAt consistent
      }));
    }

    // Update the note on the server
    try {
      const res = await fetch(`/api/notes/${noteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFavorite: newIsFavoriteState }),
      });
      const updatedNoteFromServer = await res.json();

      // Revalidate SWR cache with server data (or update directly if preferred)
      mutate(
        (currentNotes = []) =>
          currentNotes.map((note) =>
            note._id === noteId ? updatedNoteFromServer : note
          )
        // No explicit revalidate: false needed here, SWR will handle it smartly if an async function is passed
        // or simply rely on the previous optimistic update if server matches.
      );
    } catch (error) {
      console.error("Failed to update favorite status:", error);
      // Optionally, revert optimistic update here if server call fails
      mutate(
        (currentNotes = []) =>
          currentNotes.map((note) =>
            note._id === noteId ? { ...note, isFavorite: !newIsFavoriteState } : note // Revert
          ),
        false
      );
    }
  };

  const onTogglePin = async (noteId, newIsPinnedState) => {
    // If it's the placeholder note, just update it locally
    if (noteId === NEW_NOTE_PLACEHOLDER_ID) {
      mutate(
        (currentNotes = []) =>
          currentNotes.map((note) =>
            note._id === noteId ? { ...note, isPinned: newIsPinnedState, updatedAt: new Date().toISOString() } : note
          ),
        false
      );
      if (selectedNote && selectedNote._id === noteId) {
        setSelectedNote(prevSelectedNote => ({
          ...prevSelectedNote,
          isPinned: newIsPinnedState,
          updatedAt: new Date().toISOString()
        }));
      }
      return;
    }

    // For actual notes, proceed with API call and optimistic update
    mutate(
      (currentNotes = []) =>
        currentNotes.map((note) =>
          note._id === noteId ? { ...note, isPinned: newIsPinnedState, updatedAt: new Date().toISOString() } : note
        ),
      false
    );

    // Optimistically update selectedNote state if it's the one being toggled
    if (selectedNote && selectedNote._id === noteId) {
      setSelectedNote(prevSelectedNote => ({
        ...prevSelectedNote,
        isPinned: newIsPinnedState,
        updatedAt: new Date().toISOString()
      }));
    }

    try {
      const res = await fetch(`/api/notes/${noteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPinned: newIsPinnedState }),
      });
      const updatedNoteFromServer = await res.json();

      mutate(
        (currentNotes = []) =>
          currentNotes.map((note) =>
            note._id === noteId ? updatedNoteFromServer : note
          )
      );
    } catch (error) {
      console.error("Failed to update pin status:", error);
      mutate(
        (currentNotes = []) =>
          currentNotes.map((note) =>
            note._id === noteId ? { ...note, isPinned: !newIsPinnedState } : note
          ),
        false
      );
    }
  };

  const addNote = async ({ title, body }) => {
    let noteToReturnForForm = null;

    await mutate(
      async (currentNotesData = []) => {
        const res = await fetch('/api/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            title, 
            body, 
            userId, 
            isFavorite: selectedNote?.isFavorite || false,
            isPinned: selectedNote?.isPinned || false,
            updatedAt: new Date().toISOString() 
          }),
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
                isFavorite: selectedNote?.isFavorite || false,
                isPinned: selectedNote?.isPinned || false,
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

  const updateNote = async (id, { title, body, isFavorite }) => {
    if (id === NEW_NOTE_PLACEHOLDER_ID) return;

    const payload = {};
    if (title !== undefined) payload.title = title;
    if (body !== undefined) payload.body = body;
    if (isFavorite !== undefined) payload.isFavorite = isFavorite;

    mutate(
      async (currentNotes = []) => {
        const res = await fetch(`/api/notes/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        
        const updatedNote = await res.json();
        
        return currentNotes.map((note) =>
          note._id === id ? updatedNote : note
        );
      },
      {
        optimisticData: (currentNotes = []) =>
          currentNotes.map((note) =>
            note._id === id ? { ...note, ...payload, updatedAt: new Date().toISOString() } : note
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
        const res = await fetch(`/api/notes/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isDeleted: true }),
        });
        const updatedNote = await res.json();
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

  const handleNewNote = async () => {
    // If the currently selected note is the placeholder AND has unsaved changes, save it first.
    if (selectedNote?._id === NEW_NOTE_PLACEHOLDER_ID) {
      const currentPlaceholderInCache = notes.find(n => n._id === NEW_NOTE_PLACEHOLDER_ID);
      if (currentPlaceholderInCache && (currentPlaceholderInCache.title || currentPlaceholderInCache.body)) {
        await addNote({
          title: currentPlaceholderInCache.title,
          body: currentPlaceholderInCache.body,
        });
        // After saving, selectedNote in NotesPage is updated by addNote.
        // NoteForm will also get this updated selectedNote (the real one).
      }
      // If it was an empty placeholder, it will be replaced by the new one below anyway.
    }

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

    mutate(
      (currentNotesData = []) => {
        const notesWithoutOldPlaceholder = currentNotesData.filter(
          note => note._id !== NEW_NOTE_PLACEHOLDER_ID // This ensures any old placeholder is gone
        );
        return [placeholderNote, ...notesWithoutOldPlaceholder];
      },
      { revalidate: false }
    );

    setSelectedNote(placeholderNote);
  };

  const handleOptionsToggle = () => {
    setShowOptionsMenu(!showOptionsMenu);
  };

  const handlePin = () => {
    if (selectedNote) {
      onTogglePin(selectedNote._id, !selectedNote.isPinned);
      setShowOptionsMenu(false);
    }
  };

  const handleFavorite = () => {
    if (selectedNote) {
      onToggleFavorite(selectedNote._id, !selectedNote.isFavorite);
      setShowOptionsMenu(false);
    }
  };

  const handleDelete = () => {
    if (selectedNote) {
      deleteNote(selectedNote._id);
      setShowOptionsMenu(false);
    }
  };

  const { darkMode, toggleTheme } = useTheme();
  
  return (
    <div className="flex h-screen bg-white dark:bg-neutral-800 overflow-hidden overscroll-contain">
      {/* Sidebar */}
      <div className="flex-shrink-0">
        <div 
          onClick={() => setShowSidebar(!showSidebar)}
          className="fixed top-0 left-0 h-full w-9 z-50 bg-gray-300 hover:bg-gray-400 dark:bg-neutral-700 dark:hover:bg-neutral-600 cursor-pointer overscroll-contain">
          <span
            className="fixed top-1/2 -translate-y-1/2 z-50 select-none pointer-events-none text-gray-600 dark:text-gray-300 px-2 py-1"
          >
            {showSidebar ? '<<' : '>>'}
          </span>
        </div>
        <div
          className={`fixed top-0 left-0 h-screen z-40 w-64 bg-gray-200 dark:bg-neutral-800 overscroll-contain transition-transform duration-300 transform ${showSidebar ? 'translate-x-0' : '-translate-x-full'} ml-9`}
        >
          {showSidebar && (
            <NotesSidebar 
              notes={notes}
              loading={isLoading}
              onSelect={setSelectedNote}
              selectedNote={selectedNote}
              onToggleFavorite={onToggleFavorite}
              onTogglePin={onTogglePin}
              onDelete={deleteNote}
            />
          )}
        </div>
      </div>

      {/* Main Area */}
      <div className={`flex flex-col flex-1 transition-all duration-300 ease-in-out overflow-hidden overscroll-contain ${showSidebar ? 'ml-72' : 'ml-9'}`}> 
        {/* Sticky Navigation Bar */}
        <div className="sticky top-0 z-20 bg-gray-200 dark:bg-neutral-900 shadow-md overscroll-contain flex-shrink-0">
          <nav className="px-4 py-2 flex items-center min-h-[56px]">
            <div className="flex w-1/2 justify-start items-center">
              <button
                onClick={handleNewNote}
                type="button"
                className="px-3 py-1 mr-10 rounded-md text-sm font-medium bg-neutral-300 dark:bg-neutral-800 text-gray-800 dark:text-gray-100 hover:bg-neutral-400 dark:hover:bg-neutral-600"
              >
                New Note
              </button>
            </div>
            <div className="flex w-1/2 justify-end items-center">
              <button 
                onClick={toggleTheme} 
                className="px-3 py-1 mr-10 rounded-md text-sm font-medium bg-neutral-300 dark:bg-neutral-800 text-gray-800 dark:text-gray-100 hover:bg-neutral-400 dark:hover:bg-neutral-600"
              >
                {darkMode ? '⚪ Light Theme' : '⚫ Dark Theme'}
              </button>
              <button
                  type="button"
                  className="px-3 py-1 rounded-md text-sm font-medium bg-neutral-300 dark:bg-neutral-800 text-gray-800 dark:text-gray-100 hover:bg-neutral-400 dark:hover:bg-neutral-600"
                >
                  Login
              </button>
            </div>
          </nav>
        </div>

        {/* Main scrollable content */}
        <main ref={scrollContainerRef} className="flex-1 overflow-y-auto p-2 w-full overscroll-contain">
          <div className="flex p-2 justify-between items-center">
            {selectedNote && (
              <div className="flex w-full">
                <div className="flex w-1/2 justify-start items-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(selectedNote._id, !selectedNote?.isFavorite);
                    }}
                    className="p-1 ml-2 rounded-full hover:bg-gray-300 dark:hover:bg-neutral-600 mr-2"
                    title={selectedNote?.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    {selectedNote?.isFavorite ? '❤️' : '🤍'}
                  </button>
                </div>
                <div className="flex w-1/2 items-center justify-end">
                  <div className="relative">
                    <button
                      onClick={handleOptionsToggle}
                      className="p-1 mr-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-400 dark:hover:bg-neutral-500"
                      title="More options"
                    >
                      ⋮
                    </button>
                    {showOptionsMenu && (
                      <div 
                        className="absolute right-0 mt-1 w-48 bg-white dark:bg-neutral-800 rounded-md shadow-lg z-50 ring-1 ring-gray-300 dark:ring-gray-700 ring-opacity-5 focus:outline-none"
                      >
                        <button 
                          onClick={handlePin}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-700"
                        >
                          {selectedNote?.isPinned ? 'Unpin from Top' : 'Pin to Top'}
                        </button>
                        <button 
                          onClick={handleFavorite}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-700"
                        >
                          {selectedNote?.isFavorite ? 'Remove from Favorite' : 'Add to Favorite'}
                        </button>
                        <button 
                          onClick={handleDelete} 
                          className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-neutral-700"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
            </div>
            )}
          </div>
          <div className="p-2 min-h-[60%] flex flex-col">
            <NoteForm
              notes={notes}
              onAdd={addNote}
              onUpdate={updateNote}
              onDelete={deleteNote}
              selectedNote={selectedNote}
              setSelectedNote={setSelectedNote}
              mutate={mutate}
              scrollContainerRef={scrollContainerRef}              
            />
          </div>
          <hr className="border-gray-300 dark:border-gray-700 mt-6" />
          <div className="p-2 h-auto">
            {isLoading ? (
              <p className="text-gray-500 dark:text-gray-400">Loading notes...</p>
            ) : (
              <div className="mt-2">
                <div><h1 className="text-2xl font-bold text-gray-600 dark:text-gray-200 text-center">Favorite Notes:</h1></div>
                <NotesList
                  notes={notes}
                  onDelete={deleteNote}
                  onSelect={setSelectedNote}
                  selectedNote={selectedNote}
                  onToggleFavorite={onToggleFavorite}
                />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
