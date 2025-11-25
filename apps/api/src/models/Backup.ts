/**
 * 备份记录模型
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IBackup extends Document {
  userId: mongoose.Types.ObjectId;
  note: string;
  summary: {
    total: number;
    dateRange?: {
      start: string;
      end: string;
    };
  };
  payload: string;
  size: number;
  createdAt: Date;
}

const BackupSchema = new Schema<IBackup>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  note: { type: String, default: '' },
  summary: {
    total: { type: Number, default: 0 },
    dateRange: {
      start: { type: String },
      end: { type: String }
    }
  },
  payload: { type: String, required: true },
  size: { type: Number, default: 0 }
}, {
  timestamps: true
});

// 索引
BackupSchema.index({ userId: 1, createdAt: -1 });

export const Backup = mongoose.model<IBackup>('Backup', BackupSchema);
