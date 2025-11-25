/**
 * 设置页面
 */

import { useState } from 'react';
import { 
  Sun, Moon, Monitor, Globe, Calendar as CalendarIcon,
  Download, Upload, Cloud, RefreshCw, Trash2, LogOut
} from 'lucide-react';
import { useSettingsStore } from '@/stores/settings';
import { useMoodStore } from '@/stores/mood';
import { useAuthStore } from '@/stores/auth';
import { exportToJsonString, parseImportJson } from '@moodflow/core';
import { cn } from '@/lib/utils';

export function SettingsPage() {
  const { settings, updateSettings } = useSettingsStore();
  const { records, syncWithCloud, isSyncing, importRecords, lastSyncAt } = useMoodStore();
  const { isAuthenticated, logout, user } = useAuthStore();
  const [importError, setImportError] = useState('');

  const handleExport = () => {
    const json = exportToJsonString(records, settings);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `moodflow_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const { records: importedRecords } = parseImportJson(text);
      
      if (confirm(`将导入 ${Object.keys(importedRecords).length} 条记录，是否继续？`)) {
        await importRecords(importedRecords);
        setImportError('');
        alert('导入成功！');
      }
    } catch (err) {
      setImportError('导入失败：文件格式无效');
    }
    
    e.target.value = '';
  };

  const handleClearData = () => {
    if (confirm('确定要清除所有数据吗？此操作不可恢复！')) {
      importRecords({}, true);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* 账号信息 */}
      <SettingSection title="账号" icon="👤">
        {isAuthenticated ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{user?.username}</p>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
              >
                <LogOut className="w-4 h-4" />
                退出
              </button>
            </div>
          </div>
        ) : (
          <p className="text-gray-500">
            <a href="/login" className="text-primary-600 hover:underline">登录</a>
            {' '}后可使用云同步功能
          </p>
        )}
      </SettingSection>

      {/* 外观设置 */}
      <SettingSection title="外观" icon="🎨">
        <SettingItem label="主题">
          <div className="flex gap-2">
            {[
              { value: 'light', icon: Sun, label: '浅色' },
              { value: 'dark', icon: Moon, label: '深色' },
              { value: 'system', icon: Monitor, label: '系统' },
            ].map(({ value, icon: Icon, label }) => (
              <button
                key={value}
                onClick={() => updateSettings({ theme: value as any })}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors',
                  settings.theme === value
                    ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </SettingItem>

        <SettingItem label="语言">
          <div className="flex gap-2">
            {[
              { value: 'zh', label: '中文' },
              { value: 'en', label: 'English' },
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => updateSettings({ language: value as any })}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors',
                  settings.language === value
                    ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                )}
              >
                <Globe className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </SettingItem>

        <SettingItem label="周起始日">
          <div className="flex gap-2">
            {[
              { value: 1, label: '周一' },
              { value: 0, label: '周日' },
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => updateSettings({ weekStart: value as any })}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors',
                  settings.weekStart === value
                    ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                )}
              >
                <CalendarIcon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </SettingItem>
      </SettingSection>

      {/* 云同步 */}
      <SettingSection title="云同步" icon="☁️">
        {isAuthenticated ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  {lastSyncAt 
                    ? `上次同步: ${new Date(lastSyncAt).toLocaleString()}` 
                    : '尚未同步'}
                </p>
              </div>
              <button
                onClick={syncWithCloud}
                disabled={isSyncing}
                className="flex items-center gap-2 px-3 py-1.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
              >
                <RefreshCw className={cn('w-4 h-4', isSyncing && 'animate-spin')} />
                {isSyncing ? '同步中...' : '立即同步'}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-gray-500">登录后可使用云同步功能</p>
        )}
      </SettingSection>

      {/* 数据管理 */}
      <SettingSection title="数据管理" icon="💾">
        <div className="space-y-3">
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              <Download className="w-4 h-4" />
              导出数据
            </button>
            
            <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer">
              <Upload className="w-4 h-4" />
              导入数据
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </label>
          </div>
          
          {importError && (
            <p className="text-sm text-red-500">{importError}</p>
          )}

          <button
            onClick={handleClearData}
            className="flex items-center gap-2 px-4 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
          >
            <Trash2 className="w-4 h-4" />
            清除所有数据
          </button>
        </div>
      </SettingSection>

      {/* 关于 */}
      <SettingSection title="关于" icon="ℹ️">
        <div className="text-sm text-gray-500 space-y-1">
          <p>MoodFlow · 心情日历 v2.0.0</p>
          <p>记录每日心情，追踪情绪变化</p>
          <p className="pt-2">
            <a 
              href="https://github.com/lessup/MoodFlow" 
              target="_blank"
              className="text-primary-600 hover:underline"
            >
              GitHub
            </a>
            {' · '}
            <a href="/privacy" className="text-primary-600 hover:underline">
              隐私政策
            </a>
          </p>
        </div>
      </SettingSection>
    </div>
  );
}

function SettingSection({ 
  title, 
  icon, 
  children 
}: { 
  title: string; 
  icon: string; 
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <span>{icon}</span>
        {title}
      </h3>
      {children}
    </div>
  );
}

function SettingItem({ 
  label, 
  children 
}: { 
  label: string; 
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-gray-600 dark:text-gray-300">{label}</span>
      {children}
    </div>
  );
}
