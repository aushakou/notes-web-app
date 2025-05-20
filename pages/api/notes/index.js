import { connectToDatabase } from '@/lib/db';
import Note from '@/models/Note';

export default async function handler(req, res) {
  await connectToDatabase();

  if (req.method === 'GET') {
    const { userId } = req.query;
    const notes = await Note.find({ userId });
    res.status(200).json(notes);
  }

  if (req.method === 'POST') {
    try {
      const { title, body, isFavorite, isPinned, userId } = req.body;
      const note = new Note({
        userId,
        title,
        body,
        isFavorite,
        isPinned,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      await note.save();
      res.status(201).json(note);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}
