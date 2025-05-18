import { useState } from 'react';
import TextareaAutosize from 'react-textarea-autosize';

export default function NoteForm({ onAdd }) {
  const [text, setText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onAdd(text.trim());
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
      />
      <button
        type="submit"
        className="self-start bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Add
      </button>
    </form>
  );
}
