import { useState, useRef, useEffect } from 'react';
import TextareaAutosize from 'react-textarea-autosize';

export default function NoteForm({ onAdd, onUpdate, selectedNote, setSelectedNote }) {
  const [text, setText] = useState(selectedNote?.text || '');
  const [showSaved, setShowSaved] = useState(false);
  const lastSaved = useRef(selectedNote?.text || '');
  const typingTimeout = useRef(null);

  useEffect(() => {
    setText(selectedNote?.text || '');
    lastSaved.current = selectedNote?.text || '';
  }, [selectedNote]);

  // Auto-save logic
  useEffect(() => {
    const trimmed = text.trim();

    // Don’t run if nothing to save
    if (!trimmed || trimmed === lastSaved.current) return;

    // Debounce: clear previous timeout
    clearTimeout(typingTimeout.current);

    typingTimeout.current = setTimeout(async () => {
      if (selectedNote) {
        // update existing note
        await onUpdate(selectedNote._id, trimmed);
      } else {
        // create new note and select it
        const newNote = await onAdd(trimmed);
        setSelectedNote(newNote);
      }
      lastSaved.current = trimmed;
      // Show "Saved."
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 3000);
    }, 500); // debounce delay (ms)

    return () => clearTimeout(typingTimeout.current);
  }, [text, selectedNote]);

  const handleBlur = async () => {
    const trimmed = text.trim();
    if (!trimmed || trimmed === lastSaved.current) return;

    if (selectedNote) {
      onUpdate(selectedNote._id, trimmed);
    } else {
      await onAdd(trimmed);
    }

    lastSaved.current = trimmed;
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 3000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    if (!selectedNote) onAdd(text.trim());
    setText('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <TextareaAutosize
        minRows={1}
        className="text-base text-gray-800 placeholder-gray-400 focus:outline-none resize-none bg-transparent"
        placeholder="Type your note..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={handleBlur}
      />
      {showSaved && (
        <div className="fixed top-20 right-4 text-gray-400 px-4 py-2 z-100">
          Saved.
        </div>
      )}
    </form>
  );
}
