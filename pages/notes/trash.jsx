import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import useSWR from 'swr';
import { useRouter } from 'next/router';
import { useTheme } from '@/context/ThemeContext';
const fetcher = (url) => fetch(url).then((res) => res.json());

export default function TrashPage() {
  const [userId, setUserId] = useState('');
  const router = useRouter();

  // Initialize userId from localStorage
  useEffect(() => {
    let storedId = localStorage.getItem('userId');
    if (!storedId) {
      storedId = uuidv4();
      localStorage.setItem('userId', storedId);
    }
    setUserId(storedId);
  }, []);

  // Fetch notes with SWR, including deleted notes
  const { data: notes = [], mutate, isLoading } = useSWR(
    userId ? `/api/notes?userId=${userId}&showDeleted=true` : null,
    fetcher
  );

  const { darkMode, toggleTheme } = useTheme();

  const deletedNotes = notes.filter(note => note.isDeleted);

  const handleRestore = async (noteId) => {
    try {
      const res = await fetch(`/api/notes/${noteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDeleted: false }),
      });
      await res.json();
      mutate();
    } catch (error) {
      console.error('Failed to restore note:', error);
    }
  };

  const handleDeletePermanently = async (noteId) => {
    try {
      await fetch(`/api/notes/${noteId}`, { method: 'DELETE' });
      mutate();
    } catch (error) {
      console.error('Failed to delete note permanently:', error);
    }
  };

  return (
    <div className="flex flex-col flex-1 h-screen bg-gray-200 dark:bg-neutral-900 transition-all duration-300 ease-in-out overflow-hidden overscroll-contain"> 
      {/* Sticky Navigation Bar */}
      <div className="sticky top-0 z-20 bg-gray-200 dark:bg-neutral-900 shadow-md overscroll-contain flex-shrink-0">
        <nav className="px-4 py-2 flex items-center min-h-[56px]">
          <div className="flex w-1/2 justify-start items-center">
            <h1 className="text-lg font-bold text-gray-900 dark:text-gray-200">Deleted Notes</h1>
            <button
            onClick={() => router.push('/notes')}
            className="ppx-3 py-1 pr-3 pl-3 ml-20 rounded-md text-sm font-medium bg-neutral-300 dark:bg-neutral-800 text-gray-800 dark:text-gray-100 hover:bg-neutral-400 dark:hover:bg-neutral-600"
          >
            Back to Notes
          </button>
          </div>
          <div className="flex w-1/2 justify-end items-center">
            <button 
              onClick={toggleTheme} 
              className="px-3 py-1 mr-10 rounded-md text-sm font-medium bg-neutral-300 dark:bg-neutral-800 text-gray-800 dark:text-gray-100 hover:bg-neutral-400 dark:hover:bg-neutral-600"
            >
              {darkMode ? '⚪ Light Theme' : '⚫ Dark Theme'}
            </button>
            <button
                type="button"
                className="px-3 py-1 rounded-md text-sm font-medium bg-neutral-300 dark:bg-neutral-800 text-gray-800 dark:text-gray-100 hover:bg-neutral-400 dark:hover:bg-neutral-600"
              >
                Login
            </button>
          </div>
        </nav>
      </div>
      <div className="w-full h-full mx-auto p-8 bg-gray-200 dark:bg-neutral-900 overflow-y-auto overscroll-contain scrollbar-hide">
        {isLoading ? (
          <p className="text-gray-500 dark:text-gray-400">Loading...</p>
        ) : deletedNotes.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">No deleted notes</p>
        ) : (
          <div className="space-y-4">
            {deletedNotes.map((note) => (
              <div
                key={note._id}
                className="p-4 bg-white dark:bg-neutral-700 rounded-lg shadow-md"
              >
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {note.title || 'Untitled'}
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {note.body}
                </p>
                <div className="flex space-x-4">
                  <button
                    onClick={() => handleRestore(note._id)}
                    className="px-4 py-2 bg-blue-500 dark:bg-sky-800 text-white rounded-md hover:bg-sky-700 dark:hover:bg-sky-700"
                  >
                    Restore
                  </button>
                  <button
                    onClick={() => handleDeletePermanently(note._id)}
                    className="px-4 py-2 bg-red-500 dark:bg-red-900 text-white rounded-md hover:bg-red-700 dark:hover:bg-red-700"
                  >
                    Delete Permanently
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 