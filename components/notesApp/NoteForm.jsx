import { useState, useRef, useEffect } from 'react';
import TextareaAutosize from 'react-textarea-autosize';

export default function NoteForm({ onAdd, onUpdate, onDelete, selectedNote, setSelectedNote }) {
  const [noteTitle, setNoteTitle] = useState(selectedNote?.title || '');
  const [noteBody, setNoteBody] = useState(selectedNote?.body || '');
  const [showSaved, setShowSaved] = useState(false);
  const lastSavedNoteTitle = useRef(selectedNote?.title || '');
  const lastSavedNoteBody = useRef(selectedNote?.body || '');
  const typingTimeout = useRef(null);
  const titleRef = useRef(null);
  const bodyRef = useRef(null);

  useEffect(() => {
    setNoteTitle(selectedNote?.title || '');
    setNoteBody(selectedNote?.body || '');
    lastSavedNoteTitle.current = selectedNote?.title || '';
    lastSavedNoteBody.current = selectedNote?.body || '';
    setTimeout(() => {
      if (titleRef.current) {
        titleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (!selectedNote?.title && !selectedNote?.body) {
          setTimeout(() => {
            titleRef.current?.focus();
          }, 500);
        }
      }
    }, 0);
    
    
  }, [selectedNote]);

  // Auto-save logic
  useEffect(() => {
    if (noteTitle === lastSavedNoteTitle.current && noteBody === lastSavedNoteBody.current) {
      return;
    }

    clearTimeout(typingTimeout.current);

    typingTimeout.current = setTimeout(() => {
      const saveNote = async () => {
        if (selectedNote._id) {
          await onUpdate(selectedNote._id, { title: noteTitle, body: noteBody });
        } else {
          const newNote = await onAdd({ title: noteTitle, body: noteBody });
          setSelectedNote(newNote);
        }

        lastSavedNoteTitle.current = noteTitle;
        lastSavedNoteBody.current = noteBody;
        setShowSaved(true);
        setTimeout(() => setShowSaved(false), 2000);
      };

      saveNote();
    }, 500); // debounce delay (ms)

    return () => clearTimeout(typingTimeout.current);
  }, [noteTitle, noteBody, selectedNote]);

  const handleBlur = async () => {
    // If user cleared an existing note → delete it
    if (!noteTitle && !noteBody && selectedNote._id) {
      await onDelete(selectedNote._id);
      setSelectedNote({_id: null, title: '', body: '' });
      return;
    }

    // Normal save
    if (noteTitle !== lastSavedNoteTitle.current || noteBody !== lastSavedNoteBody.current) {
      if (selectedNote._id) {
        await onUpdate(selectedNote._id, { title: noteTitle, body: noteBody });
      } else {
        await onAdd({ title: noteTitle, body: noteBody }).then((newNote) => setSelectedNote(newNote));
      }
      lastSavedNoteTitle.current = noteTitle;
      lastSavedNoteBody.current = noteBody;
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2000);
    }
  };

  return (
    <div className="relative w-full min-h-[60%] bg-gray-100 p-4 rounded-md">
      <input
        ref={titleRef}
        type="text"
        value={noteTitle}
        onChange={(e) => setNoteTitle(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            bodyRef.current?.focus();
          }
        }}
        placeholder="New note title"
        className="w-full text-2xl p-2 font-semibold bg-transparent focus:outline-none placeholder-gray-400"
      />
      <TextareaAutosize
        minRows={1}
        ref={bodyRef}
        className="w-full p-2 bg-transparent focus:outline-none placeholder-gray-400 text-gray-800 resize-none "
        placeholder="Type your note..."
        value={noteBody}
        onChange={(e) => setNoteBody(e.target.value)}
        onBlur={handleBlur}
      />
      {showSaved && (
        <div className="absolute top-0 right-2 bg-gray-100 rounded-md text-gray-500 px-4 py-2 z-100">
          Saved.
        </div>
      )}
    </div>
  );
}
