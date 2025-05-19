import mongoose from 'mongoose';

const NoteSchema = new mongoose.Schema({
  userId: String,
  title: String,
  body: String,
  isFavorite: { type: Boolean, default: false },
  folder: { type: String, default: 'default' },
}, { timestamps: true });

export default mongoose.models.Note || mongoose.model('Note', NoteSchema);
