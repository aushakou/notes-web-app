export default function NotesSidebar({ notes, loading }) {
    return (
        <div className="flex">
            <aside className="w-64 bg-gray-100 p-2 overflow-y-auto transition-all duration-300">
            <h2 className="text-lg font-bold mb-4">🗂 My Notes</h2>
            {loading ? (
                <p className="text-sm text-gray-400">Loading notes...</p>
            ) : notes.length === 0 ? (
                <p className="text-sm text-gray-500">No notes yet</p>
            ) : (
                <ul className="space-y-2">
                {notes.map((note) => (
                    <li key={note._id} className="p-2 bg-white ring ring-gray-300 shadow-sm rounded text-sm truncate">
                    {note.text}
                    </li>
                ))}
                </ul>
            )}
            </aside>
        </div>
    );
  }
