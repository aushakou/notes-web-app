import { useState, useRef, useEffect } from 'react';
import TextareaAutosize from 'react-textarea-autosize';

export default function NoteForm({ onAdd, onUpdate, onDelete, selectedNote, setSelectedNote, mutate, scrollContainerRef }) {
  const [noteTitle, setNoteTitle] = useState(selectedNote?.title || '');
  const [noteBody, setNoteBody] = useState(selectedNote?.body || '');
  const [showSaved, setShowSaved] = useState(false);
  const lastSavedNoteTitle = useRef(selectedNote?.title || '');
  const lastSavedNoteBody = useRef(selectedNote?.body || '');
  const typingTimeout = useRef(null);
  const titleRef = useRef(null);
  const bodyRef = useRef(null);
  const hasUserEdited = useRef(false);
  const previousNoteIdRef = useRef(null);   
  
  const NEW_NOTE_PLACEHOLDER_ID = `NEW_NOTE_PLACEHOLDER_ID`;
  
  useEffect(() => {
    const currentNoteId = selectedNote?._id;

    // Only scroll and focus if the selected note ID has actually changed
    if (selectedNote && currentNoteId !== previousNoteIdRef.current) {
      setNoteTitle(selectedNote.title || '');
      setNoteBody(selectedNote.body || '');

      setTimeout(() => {
        scrollContainerRef?.current?.scrollTo({ top: 0, behavior: 'smooth' });
        if (titleRef.current && selectedNote._id === NEW_NOTE_PLACEHOLDER_ID) {
          titleRef.current?.focus();
        }
      }, 0);
    } else if (!selectedNote && previousNoteIdRef.current) {
      // Handle case where a note was selected, and now no note is selected (e.g., after delete)
      setNoteTitle('');
      setNoteBody('');
    }
    // Update the ref after processing
    previousNoteIdRef.current = currentNoteId;

  }, [selectedNote, scrollContainerRef]); // scrollContainerRef is stable, effect mainly driven by selectedNote

  // Auto-save logic
  useEffect(() => {
    if (!hasUserEdited.current || !selectedNote || (noteTitle === lastSavedNoteTitle.current && noteBody === lastSavedNoteBody.current)) {
      return;
    }

    clearTimeout(typingTimeout.current);

    typingTimeout.current = setTimeout(() => {
      const saveNote = async () => {
        if (selectedNote._id && selectedNote._id !== NEW_NOTE_PLACEHOLDER_ID) {
          await onUpdate(selectedNote._id, { title: noteTitle, body: noteBody });
          lastSavedNoteTitle.current = noteTitle;
          lastSavedNoteBody.current = noteBody;
        } else { // It's a new note
          const newNoteWithoutId = await onAdd({ title: noteTitle, body: noteBody });
          if (newNoteWithoutId) {
            setSelectedNote(newNoteWithoutId); // Update selectedNote in parent to have the real ID
            lastSavedNoteTitle.current = newNoteWithoutId.title;
            lastSavedNoteBody.current = newNoteWithoutId.body;
          }
        }

        setShowSaved(true);
        hasUserEdited.current = false;
        setTimeout(() => setShowSaved(false), 3000);
      };

      saveNote();
    }, 500); // debounce delay (ms)

    return () => clearTimeout(typingTimeout.current);
  }, [noteTitle, noteBody, selectedNote]);

  const handleBlur = async () => {
    // If blurring from an empty placeholder, do nothing. NotesPage cleanup will handle it.
    if (selectedNote?._id === NEW_NOTE_PLACEHOLDER_ID && !noteTitle && !noteBody) {
      return;
    }

    if (!noteTitle && !noteBody && selectedNote._id && selectedNote._id !== NEW_NOTE_PLACEHOLDER_ID) {
      return;
    }

    // Normal save if content has changed
    if (noteTitle !== lastSavedNoteTitle.current || noteBody !== lastSavedNoteBody.current) {
      if (selectedNote._id && selectedNote._id !== NEW_NOTE_PLACEHOLDER_ID) {
        await onUpdate(selectedNote._id, { title: noteTitle, body: noteBody });
        lastSavedNoteTitle.current = noteTitle;
        lastSavedNoteBody.current = noteBody;
      } else { // It's a new note
        const newNoteWithoutId = await onAdd({ title: noteTitle, body: noteBody });
        if (newNoteWithoutId) {
            setSelectedNote(newNoteWithoutId); // Update selectedNote to have the real ID
            lastSavedNoteTitle.current = newNoteWithoutId.title;
            lastSavedNoteBody.current = newNoteWithoutId.body;
        }
      }
      setShowSaved(true);
      hasUserEdited.current = false;
      setTimeout(() => setShowSaved(false), 3000);
    }
  };

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    const now = new Date().toISOString();

    setNoteTitle(newTitle);
    hasUserEdited.current = true;

    if (selectedNote?._id === NEW_NOTE_PLACEHOLDER_ID) {
      mutate(
        (notes) =>
          notes.map((n) =>
            n._id === NEW_NOTE_PLACEHOLDER_ID ? { ...n, title: newTitle, updatedAt: now } : n
          ),
        false
      );
    } else if (selectedNote) {
      setSelectedNote({ ...selectedNote, title: newTitle, updatedAt: now });
      mutate(
        (notes) =>
          notes.map((n) =>
            n._id === selectedNote._id ? { ...n, title: newTitle, updatedAt: now } : n
          ),
        false
      );
    }
  };

  const handleBodyChange = (e) => {
    const newBody = e.target.value;
    const now = new Date().toISOString();

    setNoteBody(newBody);
    hasUserEdited.current = true;

    if (selectedNote?._id === NEW_NOTE_PLACEHOLDER_ID) {
      mutate(
        (notes) =>
          notes.map((n) =>
            n._id === NEW_NOTE_PLACEHOLDER_ID ? { ...n, body: newBody, updatedAt: now } : n
          ),
        false
      );
    } else if (selectedNote) {
      setSelectedNote({ ...selectedNote, body: newBody, updatedAt: now });
      mutate(
        (notes) =>
          notes.map((n) =>
            n._id === selectedNote._id ? { ...n, body: newBody, updatedAt: now } : n
          ),
        false
      );
    }
  };

  if (!selectedNote) {
    return (
      <div className="flex items-center justify-center w-full flex-1 text-gray-500 italic dark:text-gray-400">
        Select a note or create a new one
      </div>
    );
  }
  
  return (
    <div className="relative w-full flex-1 bg-gray-100 dark:bg-neutral-700 p-4 rounded-md">
      <input
        ref={titleRef}
        type="text"
        value={noteTitle}
        onChange={handleTitleChange}
        onBlur={handleBlur}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            bodyRef.current?.focus();
          }
        }}
        placeholder="New note title"
        className="w-full text-2xl p-2 font-semibold bg-transparent focus:outline-none placeholder-gray-400 dark:text-gray-100 dark:placeholder-neutral-500"
      />
      <TextareaAutosize
        minRows={1}
        ref={bodyRef}
        className="w-full p-2 bg-transparent focus:outline-none placeholder-gray-400 text-gray-800 resize-none dark:text-gray-100 dark:placeholder-neutral-500"
        placeholder="Type your note..."
        value={noteBody}
        onChange={handleBodyChange}
        onBlur={handleBlur}
        onKeyDown={(e) => {
          if ((e.key === 'Backspace' || e.key === 'Delete') && !noteBody) {
            e.preventDefault();
            titleRef.current?.focus();
          }
        }}
      />
      {showSaved && (
        <div className="absolute top-0 right-2 bg-gray-100 rounded-md text-gray-500 px-4 py-2 z-100 dark:bg-neutral-700 dark:text-neutral-400">
          Saved.
        </div>
      )}
    </div>
  );
}
