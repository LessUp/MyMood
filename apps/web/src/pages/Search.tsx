/**
 * 搜索页面
 */

import { useState, useMemo } from 'react';
import { Search as SearchIcon, Filter, X } from 'lucide-react';
import { useMoodStore } from '@/stores/mood';
import { useSettingsStore } from '@/stores/settings';
import { searchRecords } from '@moodflow/core';
import { parseDateKey, formatRelativeTime } from '@/lib/utils';

export function SearchPage() {
  const { records } = useMoodStore();
  const { settings } = useSettingsStore();
  
  const [keyword, setKeyword] = useState('');
  const [moodFilter, setMoodFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const results = useMemo(() => {
    return searchRecords(records, {
      keyword: keyword || undefined,
      mood: moodFilter || undefined
    });
  }, [records, keyword, moodFilter]);

  const clearFilters = () => {
    setKeyword('');
    setMoodFilter('');
  };

  const hasFilters = keyword || moodFilter;

  return (
    <div className="space-y-4">
      {/* 搜索栏 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索备注内容..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg transition-colors ${
              showFilters || moodFilter
                ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Filter className="w-5 h-5" />
          </button>
        </div>

        {/* 筛选器 */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                按心情筛选
              </span>
              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-primary-600 hover:text-primary-700"
                >
                  清除筛选
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {settings.emojis.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => setMoodFilter(moodFilter === emoji ? '' : emoji)}
                  className={`w-10 h-10 text-xl rounded-lg transition-all ${
                    moodFilter === emoji
                      ? 'ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-900/50'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 搜索结果 */}
      <div className="space-y-2">
        {results.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-8 text-center">
            <p className="text-4xl mb-4">🔍</p>
            <p className="text-gray-500 dark:text-gray-400">
              {hasFilters ? '没有找到匹配的记录' : '输入关键词开始搜索'}
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 dark:text-gray-400 px-1">
              找到 {results.length} 条记录
            </p>
            {results.map(({ dateKey, entry }) => {
              const date = parseDateKey(dateKey);
              const dateStr = settings.language === 'en'
                ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                : date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' });
              
              return (
                <div
                  key={dateKey}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{entry.mood}</span>
                      <div>
                        <div className="font-medium">{dateStr}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {formatRelativeTime(entry.ts)}
                        </div>
                      </div>
                    </div>
                  </div>
                  {entry.note && (
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                      {entry.note}
                    </p>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
