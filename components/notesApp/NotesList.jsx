export default function NotesList({ notes, onDelete, onSelect, selectedNote, onToggleFavorite }) {
  if (notes.length === 0) return <p className="text-gray-500 dark:text-gray-400">No notes yet</p>;

  const sortedNotes = [...notes].sort((a, b) => {
    return new Date(b.updatedAt) - new Date(a.updatedAt); // newest first
});

  return (
    <ul className="flex flex-col space-y-2">
      {sortedNotes.map((note) => (
        <li
          key={note._id}
          onClick={() => onSelect(note)}
          className={`p-4 mt-4 mb-4 ring shadow-md rounded flex justify-between items-center
            ${selectedNote?._id === note._id
              ? 'bg-gray-200 ring-2 ring-gray-400 transition-colors duration-500 dark:bg-neutral-600 dark:ring-gray-400 dark:text-gray-100'
              : 'bg-white ring-2 ring-gray-300 dark:bg-neutral-700 dark:ring-neutral-800 dark:text-gray-100'}
          `}
        >
          <span className="truncate flex-1 mr-2">{note.title || 'Untitled'}</span>
          <div className="flex items-center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(note._id, !note.isFavorite);
              }}
              className="p-1 rounded-full hover:bg-gray-300 dark:hover:bg-neutral-600 mr-2"
              title={note.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              {note.isFavorite ? '❤️' : '🤍'}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(note._id);
              }}
              className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-600 p-1 rounded-full hover:bg-gray-300 dark:hover:bg-neutral-600"
              title="Delete note"
            >
              ❌
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
