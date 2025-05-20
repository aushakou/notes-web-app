import { useState } from 'react';

export default function NotesSidebar({ notes, loading, onSelect, selectedNote, onToggleFavorite, onTogglePin, onDeleteNote }) {
    const sortedNotes = [...notes].sort((a, b) => {
        // First sort by pinned status
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        // Then sort by date
        return new Date(b.updatedAt) - new Date(a.updatedAt);
    });
    const [openMenuId, setOpenMenuId] = useState(null);

    const handleMenuToggle = (noteId) => {
        setOpenMenuId(openMenuId === noteId ? null : noteId);
    };

    const handleFavorite = (noteId, currentIsFavorite) => {
        onToggleFavorite(noteId, !currentIsFavorite);
        setOpenMenuId(null);
    };

    const handlePin = (noteId, currentIsPinned) => {
        onTogglePin(noteId, !currentIsPinned);
        setOpenMenuId(null);
    };

    const handleDelete = (noteId) => {
        onDeleteNote(noteId);
        setOpenMenuId(null);
    };

    return (
        <div className="flex h-full dark:bg-neutral-900 overflow-y-auto overscroll-contain scrollbar-hide">
            <aside className="w-64 bg-gray-200 p-2 select-none transition-all duration-300 dark:bg-neutral-900 overscroll-contain">
                <div className="fixed top-0 left-0 w-full h-14 bg-gray-200 dark:bg-neutral-900 z-150">
                    <h2 className="text-lg mt-2 ml-2 font-bold text-gray-900 dark:text-gray-300">🗂 My Notes</h2>
                </div>
                {loading ? (
                    <p className="text-sm mt-15 text-gray-500">Loading notes...</p>
                ) : notes.length === 0 ? (
                    <p className="text-sm mt-15 text-gray-600">No notes yet</p>
                ) : (
                    <ul className="space-y-2 pb-4 mt-13">
                    {sortedNotes.map((note) => {
                        const isMenuOpen = openMenuId === note._id;
                        const isSelected = selectedNote?._id === note._id;

                        let liClasses = "ring shadow-sm rounded text-sm flex justify-between items-center relative group ";

                        if (isMenuOpen) {
                          liClasses += "z-40 "; // Highest z-index if menu is open
                          if (isSelected) {
                            liClasses += "bg-gray-300 ring-gray-400 transition-colors duration-500 dark:bg-neutral-600 dark:ring-gray-400 dark:text-gray-100";
                          } else {
                            liClasses += "bg-white ring-gray-300 dark:bg-neutral-700 dark:ring-gray-900 dark:text-gray-100"; // Default style if menu open but not selected
                          }
                        } else if (isSelected) {
                          liClasses += "z-20 hover:z-30 bg-gray-300 ring-gray-400 transition-colors duration-500 dark:bg-neutral-600 dark:ring-gray-400 dark:text-gray-100";
                        } else {
                          liClasses += "z-10 hover:z-30 bg-white ring-gray-300 dark:bg-neutral-700 dark:ring-gray-900 dark:text-gray-100";
                        }

                        return (
                        <li 
                            key={note._id} 
                            className={liClasses}
                        >
                          <span onClick={() => onSelect(note)} className="flex-1 p-3 h-full truncate cursor-pointer">
                            {note.title || 'Untitled'}
                          </span>
                          <div className="relative pr-2">
                            {note.isFavorite ? '❤️ ' : ''}
                            {note.isPinned ? '📌 ' : ''}
                          </div>
                          <div className="relative pr-2">
                            <button 
                              onClick={() => handleMenuToggle(note._id)} 
                              className="p-1 rounded-full hover:bg-gray-400 dark:hover:bg-neutral-500"
                              title="More options"
                            >
                              ⋮
                            </button>
                            {openMenuId === note._id && (
                              <div 
                                className="absolute right-0 mt-1 w-48 bg-white dark:bg-neutral-800 rounded-md shadow-lg z-50 ring-1 ring-gray-300 dark:ring-gray-700 ring-opacity-5 focus:outline-none"
                              >
                                <button 
                                  onClick={() => handlePin(note._id, note.isPinned)}
                                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-700"
                                >
                                  {note.isPinned ? 'Unpin from Top' : 'Pin to Top'}
                                </button>
                                <button 
                                  onClick={() => handleFavorite(note._id, note.isFavorite)}
                                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-700"
                                >
                                  {note.isFavorite ? 'Remove from Favorite' : 'Add to Favorite'}
                                </button>
                                <button 
                                  onClick={() => handleDelete(note._id)} 
                                  className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-neutral-700"
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </li>
                    )})}
                    </ul>
                )}
            </aside>
        </div>
    );
  }
