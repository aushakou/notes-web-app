export default function NotesList({ notes, onDelete, onSelect, selectedNote }) {
  if (notes.length === 0) return <p className="text-gray-500">No notes yet.</p>;

  return (
    <ul className="flex flex-col space-y-2">
      {notes.map((note) => (
        <li
          key={note._id}
          onClick={() => onSelect(note)}
          className={`p-4 mt-4 mb-4 ring shadow-md rounded flex justify-between items-center
            ${selectedNote?._id === note._id
              ? 'bg-gray-200 ring-gray-400 transition-colors duration-500'
              : 'bg-white ring-gray-300'}
          `}
        >
          <span>{note.text}</span>
          <button
            onClick={() => onDelete(note._id)}
            className="text-red-500 hover:text-red-700"
          >
            ❌
          </button>
        </li>
      ))}
    </ul>
  );
}
