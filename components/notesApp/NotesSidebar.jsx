export default function NotesSidebar({ notes, loading, onSelect, selectedNote }) {
    return (
        <div className="flex h-full overflow-y-auto overscroll-contain scrollbar-hide">
            <aside className="w-64 bg-gray-100 p-2 select-none transition-all duration-300">
                <div className="fixed top-0 left-0 w-full h-10 bg-gray-100">
                    <h2 className="text-lg font-bold">🗂 My Notes</h2>
                </div>
                {loading ? (
                    <p className="text-sm mt-10 text-gray-400">Loading notes...</p>
                ) : notes.length === 0 ? (
                    <p className="text-sm mt-10 text-gray-600">No notes yet.</p>
                ) : (
                    <ul className="space-y-2 pb-4 mt-10">
                    {notes.map((note) => (
                        <li 
                            key={note._id} 
                            className={`p-2 ring shadow-sm rounded text-sm truncate
                                ${selectedNote?._id === note._id
                                  ? 'bg-gray-200 ring-gray-400 transition-colors duration-500'
                                  : 'bg-white ring-gray-300'}
                              `}
                            onClick={() => onSelect(note)}
                        >
                        {note.title || 'Untitled'}
                        </li>
                    ))}
                    </ul>
                )}
            </aside>
        </div>
    );
  }
