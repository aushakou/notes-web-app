import { useState, useRef, useEffect } from 'react';
import TextareaAutosize from 'react-textarea-autosize';

export default function NoteForm({ onAdd, onUpdate, existingNote }) {
  const [text, setText] = useState(existingNote?.text || '');
  const lastSavedText = useRef(existingNote?.text || ''); // track last saved value

  useEffect(() => {
    setText(existingNote?.text || '');
  }, [existingNote]);

  const handleBlur = () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    if (existingNote) {
      if (trimmed !== existingNote.text) {
        onUpdate(existingNote._id, trimmed);
      }
    } else {
      onAdd(trimmed);
    }
  };

  return (
    <form className="flex flex-col gap-4">
      <TextareaAutosize
        minRows={1}
        className="text-base text-gray-800 placeholder-gray-400 focus:outline-none resize-none bg-transparent"
        placeholder="Type your note..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={handleBlur}
      />
    </form>
  );
}
