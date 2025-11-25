/**
 * 用户模型
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email?: string;
  phone?: string;
  username?: string;
  password?: string;
  avatar?: string;
  wxOpenId?: string;
  settings: {
    weekStart: number;
    emojis: string[];
    emojiColors: Record<string, string>;
    theme: string;
    accentColor: string;
    language: string;
    cloudSyncEnabled: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  email: { type: String, unique: true, sparse: true },
  phone: { type: String, unique: true, sparse: true },
  username: { type: String },
  password: { type: String },
  avatar: { type: String },
  wxOpenId: { type: String, unique: true, sparse: true },
  settings: {
    weekStart: { type: Number, default: 1 },
    emojis: { type: [String], default: ['😊', '😐', '😢', '😡', '😴', '🤔', '😎', '🥳'] },
    emojiColors: { type: Map, of: String, default: new Map() },
    theme: { type: String, default: 'system' },
    accentColor: { type: String, default: '#07c160' },
    language: { type: String, default: 'zh' },
    cloudSyncEnabled: { type: Boolean, default: true }
  }
}, {
  timestamps: true
});

// 索引
UserSchema.index({ email: 1 });
UserSchema.index({ phone: 1 });
UserSchema.index({ wxOpenId: 1 });

export const User = mongoose.model<IUser>('User', UserSchema);
