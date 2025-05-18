export default function NotesList({ notes, onDelete }) {
    if (notes.length === 0) return <p>No notes yet!</p>;
  
    return (
      <ul>
        {notes.map((note) => (
          <li key={note.id}>
            {note.text}
            <button onClick={() => onDelete(note.id)}>❌</button>
          </li>
        ))}
      </ul>
    );
  }
  