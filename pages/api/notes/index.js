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
    const note = await Note.create(req.body);
    res.status(201).json(note);
  }
}
