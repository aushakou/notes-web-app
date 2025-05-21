import { useState, useRef, useEffect } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import { buildMarkovChain, predictNextWord } from '../../utils/markovPredictor';

export default function NoteForm({ notes, onAdd, onUpdate, selectedNote, setSelectedNote, mutate, scrollContainerRef, smartSuggestions = true }) {
  const [noteTitle, setNoteTitle] = useState(selectedNote?.title || '');
  const [noteBody, setNoteBody] = useState(selectedNote?.body || '');
  const [showSaved, setShowSaved] = useState(false);
  const lastSavedNoteTitle = useRef(selectedNote?.title || '');
  const lastSavedNoteBody = useRef(selectedNote?.body || '');
  const typingTimeout = useRef(null);
  const autoSaveTimeout = useRef(null);
  const titleRef = useRef(null);
  const bodyRef = useRef(null);
  const hasUserEdited = useRef(false);
  const previousNoteIdRef = useRef(null);
  const [suggestion, setSuggestion] = useState('');
  const [chain, setChain] = useState({});
  const [isFocused, setIsFocused] = useState(false);
  const mirrorRef = useRef(null);
  const suggestionRef = useRef(null);
  const [caretCoords, setCaretCoords] = useState({ top: 0, left: 0 });
  const selectionRef = useRef(0);
  const textareaContainerRef = useRef(null);
  
  const NEW_NOTE_PLACEHOLDER_ID = `NEW_NOTE_PLACEHOLDER_ID`;
  
  // Build initial Markov chain
  useEffect(() => {
    const texts = notes.map((note) =>
      typeof note === 'string'
        ? note
        : [note.title, note.body].filter(Boolean).join(' ')
    );
  
    const model = buildMarkovChain(texts, 2);
    setChain(model);
  }, [notes]);

  useEffect(() => {
    if (!smartSuggestions || noteBody.trim() === '') {
      setSuggestion('');
      return;
    }

    if (typingTimeout.current) clearTimeout(typingTimeout.current);

    typingTimeout.current = setTimeout(() => {
      const predicted = predictNextWord(chain, noteBody.slice(0, selectionRef.current), 2);
      setSuggestion(predicted || '');
    }, 150);
  }, [noteBody, chain, smartSuggestions]);

  // Track cursor position and update mirror content
  useEffect(() => {
    if (!isFocused || !smartSuggestions) return;
    
    const updateCaretPosition = () => {
      const textarea = bodyRef.current;
      const mirror = mirrorRef.current;
      const container = textareaContainerRef.current;
      
      if (!textarea || !mirror || !container) return;
      
      // Copy textarea styles to mirror for accurate positioning
      const textareaStyles = window.getComputedStyle(textarea);
      mirror.style.fontSize = textareaStyles.fontSize;
      mirror.style.fontFamily = textareaStyles.fontFamily;
      mirror.style.lineHeight = textareaStyles.lineHeight;
      mirror.style.padding = textareaStyles.padding;
      mirror.style.width = textareaStyles.width;
      mirror.style.boxSizing = 'border-box';
      
      // Get current cursor position
      const cursorPos = textarea.selectionStart;
      selectionRef.current = cursorPos;
      
      // Get the text before the cursor
      const value = textarea.value;
      const before = value.slice(0, cursorPos);
      
      // Update mirror content with HTML entities for spaces and line breaks
      mirror.innerHTML = 
        before.replace(/\n/g, '<br/>').replace(/ /g, '&nbsp;') + 
        '<span id="caret-marker">|</span>';
      
      // Get position of the caret marker
      const caretMarker = mirror.querySelector('#caret-marker');
      if (caretMarker) {
        const containerRect = container.getBoundingClientRect();
        const caretRect = caretMarker.getBoundingClientRect();
        
        // Calculate position relative to the container
        const top = caretRect.top - containerRect.top;
        const left = caretRect.left - containerRect.left;
        
        setCaretCoords({ top, left });
      }
    };
    
    // Set initial position
    requestAnimationFrame(updateCaretPosition);
    
    // Add event listeners for cursor movement
    const textarea = bodyRef.current;
    if (textarea) {
      textarea.addEventListener('keyup', updateCaretPosition);
      textarea.addEventListener('click', updateCaretPosition);
      textarea.addEventListener('select', updateCaretPosition);
      
      // Also update on scroll and resize
      textarea.addEventListener('scroll', updateCaretPosition);
      window.addEventListener('resize', updateCaretPosition);
    }
    
    return () => {
      if (textarea) {
        textarea.removeEventListener('keyup', updateCaretPosition);
        textarea.removeEventListener('click', updateCaretPosition);
        textarea.removeEventListener('select', updateCaretPosition);
        textarea.removeEventListener('scroll', updateCaretPosition);
        window.removeEventListener('resize', updateCaretPosition);
      }
    };
  }, [noteBody, isFocused, smartSuggestions]);

  // Clear suggestion when smartSuggestions is toggled off
  useEffect(() => {
    if (!smartSuggestions) {
      setSuggestion('');
    }
  }, [smartSuggestions]);

  useEffect(() => {
    const currentNoteId = selectedNote?._id;

    // Only scroll and focus if the selected note ID has actually changed
    if (selectedNote && currentNoteId !== previousNoteIdRef.current) {
      setNoteTitle(selectedNote.title || '');
      setNoteBody(selectedNote.body || '');

      setTimeout(() => {
        scrollContainerRef?.current?.scrollTo({ top: 0, behavior: 'smooth' });
        if (titleRef.current && selectedNote._id === NEW_NOTE_PLACEHOLDER_ID) {
          titleRef.current?.focus();
        }
      }, 0);
    } else if (!selectedNote && previousNoteIdRef.current) {
      // Handle case where a note was selected, and now no note is selected (e.g., after delete)
      setNoteTitle('');
      setNoteBody('');
    }
    // Update the ref after processing
    previousNoteIdRef.current = currentNoteId;

  }, [selectedNote, scrollContainerRef]); // scrollContainerRef is stable, effect mainly driven by selectedNote

  // Auto-save logic
  useEffect(() => {
    if (!hasUserEdited.current || !selectedNote || (noteTitle === lastSavedNoteTitle.current && noteBody === lastSavedNoteBody.current)) {
      return;
    }

    if (noteBody.trim() === '') return setSuggestion('');

    clearTimeout(autoSaveTimeout.current);

    autoSaveTimeout.current = setTimeout(() => {
      const saveNote = async () => {
        if (selectedNote._id && selectedNote._id !== NEW_NOTE_PLACEHOLDER_ID) {
          await onUpdate(selectedNote._id, { title: noteTitle, body: noteBody });
          lastSavedNoteTitle.current = noteTitle;
          lastSavedNoteBody.current = noteBody;
        } else { // It's a new note
          const newNoteWithoutId = await onAdd({ title: noteTitle, body: noteBody });
          if (newNoteWithoutId) {
            setSelectedNote(newNoteWithoutId); // Update selectedNote in parent to have the real ID
            lastSavedNoteTitle.current = newNoteWithoutId.title;
            lastSavedNoteBody.current = newNoteWithoutId.body;
          }
        }

        setShowSaved(true);
        hasUserEdited.current = false;
        setTimeout(() => setShowSaved(false), 3000);
      };

      saveNote();
    }, 500); // debounce delay (ms)

    return () => clearTimeout(autoSaveTimeout.current);
  }, [noteTitle, noteBody, selectedNote]);

  const handleBlur = async () => {
    // If blurring from an empty placeholder, do nothing. NotesPage cleanup will handle it.
    if (selectedNote?._id === NEW_NOTE_PLACEHOLDER_ID && !noteTitle && !noteBody) {
      return;
    }

    if (!noteTitle && !noteBody && selectedNote._id && selectedNote._id !== NEW_NOTE_PLACEHOLDER_ID) {
      return;
    }

    setSuggestion('');
    setIsFocused(false);

    // Normal save if content has changed
    if (noteTitle !== lastSavedNoteTitle.current || noteBody !== lastSavedNoteBody.current) {
      if (selectedNote._id && selectedNote._id !== NEW_NOTE_PLACEHOLDER_ID) {
        await onUpdate(selectedNote._id, { title: noteTitle, body: noteBody });
        lastSavedNoteTitle.current = noteTitle;
        lastSavedNoteBody.current = noteBody;
      } else { // It's a new note
        const newNoteWithoutId = await onAdd({ title: noteTitle, body: noteBody });
        if (newNoteWithoutId) {
            setSelectedNote(newNoteWithoutId); // Update selectedNote to have the real ID
            lastSavedNoteTitle.current = newNoteWithoutId.title;
            lastSavedNoteBody.current = newNoteWithoutId.body;
        }
      }
      setShowSaved(true);
      hasUserEdited.current = false;
      setTimeout(() => setShowSaved(false), 3000);
    }
  };

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    const now = new Date().toISOString();

    setNoteTitle(newTitle);
    hasUserEdited.current = true;

    if (selectedNote?._id === NEW_NOTE_PLACEHOLDER_ID) {
      mutate(
        (notes) =>
          notes.map((n) =>
            n._id === NEW_NOTE_PLACEHOLDER_ID ? { ...n, title: newTitle, updatedAt: now } : n
          ),
        false
      );
    } else if (selectedNote) {
      setSelectedNote({ ...selectedNote, title: newTitle, updatedAt: now });
      mutate(
        (notes) =>
          notes.map((n) =>
            n._id === selectedNote._id ? { ...n, title: newTitle, updatedAt: now } : n
          ),
        false
      );
    }
  };

  const handleBodyChange = (e) => {
    const newBody = e.target.value;
    const now = new Date().toISOString();

    setNoteBody(newBody);
    hasUserEdited.current = true;

    if (selectedNote?._id === NEW_NOTE_PLACEHOLDER_ID) {
      mutate(
        (notes) =>
          notes.map((n) =>
            n._id === NEW_NOTE_PLACEHOLDER_ID ? { ...n, body: newBody, updatedAt: now } : n
          ),
        false
      );
    } else if (selectedNote) {
      setSelectedNote({ ...selectedNote, body: newBody, updatedAt: now });
      mutate(
        (notes) =>
          notes.map((n) =>
            n._id === selectedNote._id ? { ...n, body: newBody, updatedAt: now } : n
          ),
        false
      );
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Tab' && suggestion) {
      e.preventDefault();
      const cursorPos = selectionRef.current;

      const newNote =
        noteBody.slice(0, cursorPos) + suggestion + noteBody.slice(cursorPos);
      const newCursor = cursorPos + suggestion.length;

      setNoteBody(newNote);
      setSuggestion('');

      // Set cursor after inserted word
      requestAnimationFrame(() => {
        bodyRef.current?.setSelectionRange(newCursor, newCursor);
        selectionRef.current = newCursor;
      });
    }
  };

  // Position the suggestion box above or below cursor based on available space
  const getSuggestionBoxPosition = () => {
    if (!textareaContainerRef.current) return { top: caretCoords.top - 30, left: caretCoords.left };
    
    const spaceAbove = caretCoords.top;
    const estimatedBoxHeight = 30; // Height of suggestion box
    
    // If there's enough space above, position it above; otherwise, below
    if (spaceAbove > estimatedBoxHeight) {
      return {
        top: caretCoords.top - estimatedBoxHeight,
        left: caretCoords.left
      };
    } else {
      return {
        top: caretCoords.top + 20, // Position below with some offset
        left: caretCoords.left
      };
    }
  };

  if (!selectedNote) {
    return (
      <div className="flex items-center justify-center w-full flex-1 text-gray-500 italic dark:text-gray-400">
        {notes.length === 0 ? 'Create a note' : 'Select a note or create a new one'}
      </div>
    );
  }
  
  return (
    <div className="relative w-full flex-1 bg-gray-100 dark:bg-neutral-700 p-4 rounded-md">
      <input
        ref={titleRef}
        type="text"
        value={noteTitle}
        onChange={handleTitleChange}
        onBlur={handleBlur}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            bodyRef.current?.focus();
          }
        }}
        placeholder="New note title"
        className="w-full text-2xl p-2 font-semibold bg-transparent focus:outline-none placeholder-gray-400 dark:text-gray-100 dark:placeholder-neutral-500"
      />
      <div ref={textareaContainerRef} className="relative">
        <div
          ref={mirrorRef}
          className="absolute w-full p-2"
          style={{
            visibility: 'hidden',
            pointerEvents: 'none',
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
            position: 'absolute',
            top: 0,
            left: 0
          }}
        ></div>
        <TextareaAutosize
          minRows={1}
          ref={bodyRef}
          className="w-full p-2 bg-transparent focus:outline-none placeholder-gray-400 text-gray-800 resize-none dark:text-gray-100 dark:placeholder-neutral-500"
          placeholder="Type your note..."
          value={noteBody}
          onChange={handleBodyChange}
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
          onClick={() => setSuggestion('')}
          onKeyDown={(e) => {
            if ((e.key === 'Backspace' || e.key === 'Delete') && !noteBody) {
              e.preventDefault();
              titleRef.current?.focus();
            } else {
              handleKeyDown(e);
            }
          }}
        />
        {smartSuggestions && isFocused && suggestion && (
          <div
            ref={suggestionRef}
            className="absolute bg-white dark:bg-neutral-700 shadow-md rounded-md px-2 py-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm"
            style={{
              ...getSuggestionBoxPosition(),
              zIndex: 10,
            }}
          >
            <div className="flex items-center">
              <span>{suggestion}</span>
              <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">(Tab)</span>
            </div>
          </div>
        )}
      </div>
      {showSaved && (
        <div className="absolute top-0 right-2 bg-gray-100 rounded-md text-gray-500 px-4 py-2 z-100 dark:bg-neutral-700 dark:text-neutral-400">
          Saved.
        </div>
      )}
    </div>
  );
}
