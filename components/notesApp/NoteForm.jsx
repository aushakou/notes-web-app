import { useState, useRef } from 'react';
import TextareaAutosize from 'react-textarea-autosize';

export default function NoteForm({ onAdd }) {
  const [text, setText] = useState('');
  const lastSavedText = useRef(''); // track last saved value

  const handleBlur = () => {
    const trimmed = text.trim();
    if (trimmed && trimmed !== lastSavedText.current) {
      onAdd(trimmed);          // auto-save
      lastSavedText.current = trimmed; // mark as saved
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
