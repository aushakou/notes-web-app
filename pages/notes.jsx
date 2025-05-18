import dynamic from 'next/dynamic';

const NotesPage = dynamic(() => import('../components/notes/NotesPage'), {
  ssr: false,
});

export default NotesPage;