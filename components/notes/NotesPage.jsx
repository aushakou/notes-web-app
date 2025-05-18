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
      <h1>📝 My Notes</h1>
      <NoteForm onAdd={addNote} />
      <NotesList notes={notes} onDelete={deleteNote} />
    </Layout>
  );
}
