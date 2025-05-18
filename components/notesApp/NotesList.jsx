export default function NotesList({ notes, onDelete }) {
  if (notes.length === 0) return <p className="text-gray-500">No notes yet.</p>;

  return (
    <ul className="flex flex-col space-y-2">
      {notes.map((note) => (
        <li
          key={note.id}
          className="p-4 m-4 ring ring-gray-300 shadow-md rounded flex justify-between items-center"
        >
          <span>{note.text}</span>
          <button
            onClick={() => onDelete(note.id)}
            className="text-red-500 hover:text-red-700"
          >
            ❌
          </button>
        </li>
      ))}
    </ul>
  );
}
