export default function NotesSidebar({ notes, loading }) {
    return (
        <div className="flex h-full overflow-y-auto overscroll-contain scrollbar-hide">
            <aside className="w-64 bg-gray-100 p-2 select-none transition-all duration-300">
                <div className="fixed top-0 left-0 w-full h-10 bg-gray-100">
                    <h2 className="text-lg font-bold">🗂 My Notes</h2>
                </div>
                {loading ? (
                    <p className="text-sm text-gray-400">Loading notes...</p>
                ) : notes.length === 0 ? (
                    <p className="text-sm text-gray-500">No notes yet</p>
                ) : (
                    <ul className="space-y-2 pb-4 mt-10">
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
