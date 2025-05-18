import mongoose from 'mongoose';

const NoteSchema = new mongoose.Schema({
  userId: String,
  title: String,
  text: String,
  isFavorite: { type: Boolean, default: false },
  folder: { type: String, default: 'default' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.Note || mongoose.model('Note', NoteSchema);
