/**
 * 心情记录模型
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IMoodRecord extends Document {
  userId: mongoose.Types.ObjectId;
  dateKey: string;
  mood: string;
  note?: string;
  tags?: string[];
  ts: number;
  createdAt: Date;
  updatedAt: Date;
}

const MoodRecordSchema = new Schema<IMoodRecord>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  dateKey: { type: String, required: true },
  mood: { type: String, default: '' },
  note: { type: String, default: '' },
  tags: { type: [String], default: [] },
  ts: { type: Number, required: true }
}, {
  timestamps: true
});

// 复合索引：用户 + 日期唯一
MoodRecordSchema.index({ userId: 1, dateKey: 1 }, { unique: true });
MoodRecordSchema.index({ userId: 1, ts: -1 });

export const MoodRecord = mongoose.model<IMoodRecord>('MoodRecord', MoodRecordSchema);
