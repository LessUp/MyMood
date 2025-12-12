import { User } from '../models/User';
import { hashPassword, verifyPassword } from './auth';
import { MoodRecord } from '../models/MoodRecord';
import { Backup } from '../models/Backup';

export async function updateProfile(userId: string, data: { username?: string; avatar?: string }) {
  const user = await User.findByIdAndUpdate(userId, { $set: data }, { new: true });
  if (!user) return null;
  return {
    id: user._id,
    username: user.username,
    avatar: user.avatar
  };
}

export async function updateSettings(userId: string, data: Record<string, unknown>) {
  const updateFields: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      updateFields[`settings.${key}`] = value;
    }
  }

  const user = await User.findByIdAndUpdate(userId, { $set: updateFields }, { new: true });
  if (!user) return null;
  return user.settings;
}

export async function getSettings(userId: string) {
  const user = await User.findById(userId);
  if (!user) return null;
  return user.settings;
}

export async function changePassword(userId: string, oldPassword: string, newPassword: string) {
  const user = await User.findById(userId);
  if (!user) return { ok: false as const, reason: 'NOT_FOUND' as const };

  if (!user.password) return { ok: false as const, reason: 'NO_PASSWORD' as const };

  const valid = await verifyPassword(oldPassword, user.password);
  if (!valid) return { ok: false as const, reason: 'WRONG_PASSWORD' as const };

  const hashedPassword = await hashPassword(newPassword);
  await User.findByIdAndUpdate(userId, { password: hashedPassword });
  return { ok: true as const };
}

export async function deleteAccount(userId: string): Promise<void> {
  await MoodRecord.deleteMany({ userId });
  await Backup.deleteMany({ userId });
  await User.findByIdAndDelete(userId);
}

export async function exportUserData(userId: string) {
  const user = await User.findById(userId);
  if (!user) return null;

  const records = await MoodRecord.find({ userId });

  const moodData: Record<string, any> = {};
  for (const record of records) {
    moodData[record.dateKey] = {
      mood: record.mood,
      note: record.note,
      ts: record.ts,
      tags: record.tags
    };
  }

  return {
    version: '2.0.0',
    exportedAt: Date.now(),
    user: {
      username: user.username,
      email: user.email
    },
    settings: user.settings,
    records: moodData
  };
}
