import Layout from '../Layout';
import NoteForm from './NoteForm';
import NotesList from './NotesList';
import useLocalStorage from '../../hooks/useLocalStorage';

export default function NotesPage() {
  const [notes, setNotes] = useLocalStorage('notes', []);

  const addNote = (text) => {
    const newNote = { id: Date.now(), text };
    setNotes([newNote, ...notes]);
  };

  const deleteNote = (id) => {
    setNotes(notes.filter((note) => note.id !== id));
  };

  return (
    <Layout>
      <div className="mx-auto m-6 p-6 ring ring-gray-300 shadow-lg rounded space-y-6">
        <h1 className="text-2xl font-bold text-center">📝 My Notes</h1>
        <NoteForm onAdd={addNote} />
        <NotesList notes={notes} onDelete={deleteNote} />
      </div>
    </Layout>
  );
}
