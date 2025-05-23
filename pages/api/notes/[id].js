import { connectToDatabase } from '@/lib/db';
import Note from '@/models/Note';

export default async function handler(req, res) {
  const { id } = req.query;
  await connectToDatabase();

  if (req.method === 'DELETE') {
    try {
      await Note.findByIdAndDelete(id);
      res.status(200).json({ message: 'Note deleted' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete note' });
    }
  }

  if (req.method === 'PATCH') {
    try {
      const { title, body, isFavorite, isPinned, isDeleted } = req.body;
      const note = await Note.findByIdAndUpdate(
        id,
        { 
          title, 
          body,
          isFavorite,
          isPinned,
          isDeleted,
          updatedAt: new Date()
        },
        { new: true }
      );
      res.status(200).json(note);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'GET') {
    try {
      const note = await Note.findById(id);
      res.status(200).json(note);
    } catch (error) {
      res.status(404).json({ error: 'Note not found' });
    }
  }

  if (!['GET', 'PATCH', 'DELETE'].includes(req.method)) {
    res.setHeader('Allow', ['GET', 'PATCH', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
