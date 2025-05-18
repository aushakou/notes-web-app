import dynamic from 'next/dynamic';

const NotesPage = dynamic(() => import('../components/notesApp/NotesPage'), {
  ssr: false,
});

export default NotesPage;