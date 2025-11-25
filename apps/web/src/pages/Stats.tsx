/**
 * 统计页面
 */

import { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { ChevronLeft, ChevronRight, TrendingUp, Calendar, Award, Smile } from 'lucide-react';
import { useMoodStore } from '@/stores/mood';
import { useSettingsStore } from '@/stores/settings';
import { calculateDistribution, calculateStreak, calculateLongestStreak } from '@moodflow/core';
import { MoodDistributionBar, YearHeatmap } from '@/components/StatsCard';
import { cn } from '@/lib/utils';

export function StatsPage() {
  const { records } = useMoodStore();
  const { settings } = useSettingsStore();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const stats = useMemo(() => {
    const distribution = calculateDistribution(records);
    const streak = calculateStreak(records);
    const longestStreak = calculateLongestStreak(records);
    const total = Object.keys(records).length;

    // 转换为图表数据
    const pieData = Object.entries(distribution).map(([mood, count]) => ({
      name: mood,
      value: count,
      color: settings.emojiColors[mood] || '#888'
    }));

    // 最近30天趋势
    const today = new Date();
    const trendData: Array<{ date: string; count: number }> = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      trendData.push({
        date: `${d.getMonth() + 1}/${d.getDate()}`,
        count: records[key]?.mood ? 1 : 0
      });
    }

    // 按月统计
    const monthlyData: Array<{ month: string; count: number }> = [];
    for (let m = 0; m < 12; m++) {
      const monthKey = `${selectedYear}-${String(m + 1).padStart(2, '0')}`;
      let count = 0;
      for (const key in records) {
        if (key.startsWith(monthKey)) count++;
      }
      monthlyData.push({
        month: `${m + 1}月`,
        count
      });
    }

    // 年度热力图数据
    const heatmapData: Record<string, { mood?: string; count: number }> = {};
    for (const key in records) {
      if (key.startsWith(String(selectedYear))) {
        heatmapData[key] = { mood: records[key]?.mood, count: 1 };
      }
    }

    // 本年记录数
    const yearTotal = Object.keys(heatmapData).length;

    return { distribution, pieData, trendData, streak, longestStreak, total, monthlyData, heatmapData, yearTotal };
  }, [records, settings.emojiColors, selectedYear]);

  if (stats.total === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-8 text-center">
        <p className="text-6xl mb-4">📊</p>
        <h2 className="text-xl font-semibold mb-2">暂无数据</h2>
        <p className="text-gray-500 dark:text-gray-400">
          开始记录心情后，这里会显示统计信息
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 概览卡片 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="总记录" value={stats.total} icon="📝" />
        <StatCard label="当前连续" value={`${stats.streak} 天`} icon="🔥" />
        <StatCard label="最长连续" value={`${stats.longestStreak} 天`} icon="🏆" />
        <StatCard 
          label="心情种类" 
          value={Object.keys(stats.distribution).length} 
          icon="🎨" 
        />
      </div>

      {/* 心情分布 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4">
        <h3 className="text-lg font-semibold mb-4">心情分布</h3>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="w-48 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                >
                  {stats.pieData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {stats.pieData.map(({ name, value, color }) => (
              <div key={name} className="flex items-center gap-2">
                <span className="text-2xl">{name}</span>
                <span 
                  className="px-2 py-0.5 text-sm rounded-full"
                  style={{ backgroundColor: `${color}30`, color }}
                >
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 年度热力图 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">年度记录</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedYear(y => y - 1)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-medium">{selectedYear}</span>
            <button
              onClick={() => setSelectedYear(y => y + 1)}
              disabled={selectedYear >= new Date().getFullYear()}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-30"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-500 mb-3">
          {selectedYear}年共记录 <span className="font-bold text-primary-600">{stats.yearTotal}</span> 天
        </p>
        <YearHeatmap 
          data={stats.heatmapData} 
          year={selectedYear} 
          colors={settings.emojiColors} 
        />
      </div>

      {/* 月度统计 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4">
        <h3 className="text-lg font-semibold mb-4">月度统计</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.monthlyData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip 
                formatter={(value: number) => [`${value} 天`, '记录']}
                contentStyle={{ borderRadius: '8px' }}
              />
              <Bar 
                dataKey="count" 
                fill="var(--accent-color)" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 心情分布条形图 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4">
        <h3 className="text-lg font-semibold mb-4">心情占比</h3>
        <MoodDistributionBar
          distribution={stats.distribution}
          colors={settings.emojiColors}
          total={stats.total}
        />
      </div>
    </div>
  );
}

function StatCard({ 
  label, 
  value, 
  icon 
}: { 
  label: string; 
  value: string | number; 
  icon: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 text-center">
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
        {value}
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
    </div>
  );
}
