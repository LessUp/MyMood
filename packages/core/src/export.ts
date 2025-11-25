/**
 * 数据导出/导入模块
 */

import type { 
  MoodRecordMap, 
  ExportData, 
  ExportFormat,
  UserSettings 
} from '@moodflow/types';
import { isValidDateKey } from './date';

const EXPORT_VERSION = '2.0.0';

/**
 * 导出为 JSON 格式
 */
export function exportToJson(
  records: MoodRecordMap,
  settings?: Partial<UserSettings>
): ExportData {
  return {
    version: EXPORT_VERSION,
    exportedAt: Date.now(),
    records,
    settings
  };
}

/**
 * 导出为 JSON 字符串
 */
export function exportToJsonString(
  records: MoodRecordMap,
  settings?: Partial<UserSettings>,
  pretty = true
): string {
  const data = exportToJson(records, settings);
  return pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
}

/**
 * 导出为 CSV 格式
 */
export function exportToCsv(records: MoodRecordMap): string {
  const lines: string[] = ['date,mood,note,timestamp'];
  
  const sortedKeys = Object.keys(records).sort();
  
  for (const dateKey of sortedKeys) {
    const entry = records[dateKey];
    if (!entry) continue;
    
    const mood = entry.mood || '';
    const note = (entry.note || '').replace(/"/g, '""');
    const ts = entry.ts || 0;
    
    lines.push(`${dateKey},"${mood}","${note}",${ts}`);
  }
  
  return lines.join('\n');
}

/**
 * 导出数据
 */
export function exportData(
  records: MoodRecordMap,
  format: ExportFormat,
  settings?: Partial<UserSettings>
): string {
  switch (format) {
    case 'csv':
      return exportToCsv(records);
    case 'json':
    default:
      return exportToJsonString(records, settings);
  }
}

/**
 * 解析导入的 JSON 数据
 */
export function parseImportJson(jsonString: string): {
  records: MoodRecordMap;
  settings?: Partial<UserSettings>;
  version: string;
  exportedAt: number;
} {
  const data = JSON.parse(jsonString);
  
  // 检查是否为 ExportData 格式
  if (data.version && data.records) {
    return {
      records: validateRecords(data.records),
      settings: data.settings,
      version: data.version,
      exportedAt: data.exportedAt || 0
    };
  }
  
  // 兼容旧格式（直接是 MoodRecordMap）
  return {
    records: validateRecords(data),
    version: '1.0.0',
    exportedAt: 0
  };
}

/**
 * 解析导入的 CSV 数据
 */
export function parseImportCsv(csvString: string): MoodRecordMap {
  const lines = csvString.trim().split('\n');
  const records: MoodRecordMap = {};
  
  // 跳过标题行
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // 简单的 CSV 解析
    const parts = parseCsvLine(line);
    if (parts.length < 2) continue;
    
    const dateKey = parts[0];
    if (!isValidDateKey(dateKey)) continue;
    
    const mood = parts[1] || '';
    const note = parts[2] || '';
    const ts = parseInt(parts[3]) || Date.now();
    
    if (mood || note) {
      records[dateKey] = { mood, note, ts };
    }
  }
  
  return records;
}

/**
 * 解析 CSV 行（处理引号）
 */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result;
}

/**
 * 验证并清理记录数据
 */
export function validateRecords(data: unknown): MoodRecordMap {
  if (!data || typeof data !== 'object') {
    return {};
  }
  
  const records: MoodRecordMap = {};
  
  for (const key in data as Record<string, unknown>) {
    // 跳过内部属性
    if (key.startsWith('__')) continue;
    
    // 验证日期键格式
    if (!isValidDateKey(key)) continue;
    
    const entry = (data as Record<string, unknown>)[key];
    if (!entry || typeof entry !== 'object') continue;
    
    const e = entry as Record<string, unknown>;
    const mood = typeof e.mood === 'string' ? e.mood : '';
    const note = typeof e.note === 'string' ? e.note : '';
    const ts = typeof e.ts === 'number' ? e.ts : Date.now();
    
    if (mood || note) {
      records[key] = { mood, note, ts };
    }
  }
  
  return records;
}

/**
 * 获取导入预览信息
 */
export function getImportPreview(
  existingRecords: MoodRecordMap,
  importRecords: MoodRecordMap
): {
  total: number;
  newRecords: number;
  updateRecords: number;
  conflictRecords: number;
  dateRange: { start: string; end: string } | null;
} {
  const importKeys = Object.keys(importRecords);
  
  if (importKeys.length === 0) {
    return {
      total: 0,
      newRecords: 0,
      updateRecords: 0,
      conflictRecords: 0,
      dateRange: null
    };
  }
  
  let newRecords = 0;
  let updateRecords = 0;
  let conflictRecords = 0;
  
  for (const key of importKeys) {
    const existing = existingRecords[key];
    const importing = importRecords[key];
    
    if (!existing) {
      newRecords++;
    } else {
      const existingTs = existing.ts || 0;
      const importingTs = importing.ts || 0;
      
      if (importingTs > existingTs) {
        updateRecords++;
      } else if (importingTs < existingTs) {
        // 本地数据更新，不会覆盖
        conflictRecords++;
      } else if (
        existing.mood !== importing.mood ||
        existing.note !== importing.note
      ) {
        conflictRecords++;
      }
    }
  }
  
  const sortedKeys = importKeys.sort();
  
  return {
    total: importKeys.length,
    newRecords,
    updateRecords,
    conflictRecords,
    dateRange: {
      start: sortedKeys[0],
      end: sortedKeys[sortedKeys.length - 1]
    }
  };
}
