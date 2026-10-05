import React from 'react';
import { TaskStats, TaskStatus } from '../types';
import { Layers, Clock, Flame, Eye, CheckCircle2 } from 'lucide-react';

interface StatsCardsProps {
  stats?: TaskStats;
  selectedStatus?: TaskStatus | '';
  onSelectStatus: (status: TaskStatus | '') => void;
  isLoading: boolean;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  stats,
  selectedStatus,
  onSelectStatus,
  isLoading,
}) => {
  const cards = [
    {
      id: '' as '' | TaskStatus,
      label: '전체 태스크',
      count: stats?.total ?? 0,
      icon: Layers,
      color: 'from-blue-500/10 to-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/60',
      activeRing: 'ring-2 ring-indigo-500',
    },
    {
      id: 'TODO' as TaskStatus,
      label: '대기 중 (To-Do)',
      count: stats?.todo ?? 0,
      icon: Clock,
      color: 'from-amber-500/10 to-orange-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/60',
      activeRing: 'ring-2 ring-amber-500',
    },
    {
      id: 'IN_PROGRESS' as TaskStatus,
      label: '진행 중',
      count: stats?.inProgress ?? 0,
      icon: Flame,
      color: 'from-sky-500/10 to-blue-500/10 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-800/60',
      activeRing: 'ring-2 ring-sky-500',
    },
    {
      id: 'REVIEW' as TaskStatus,
      label: '검토 중 (Review)',
      count: stats?.review ?? 0,
      icon: Eye,
      color: 'from-purple-500/10 to-violet-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800/60',
      activeRing: 'ring-2 ring-purple-500',
    },
    {
      id: 'DONE' as TaskStatus,
      label: '완료됨 (Done)',
      count: stats?.done ?? 0,
      icon: CheckCircle2,
      color: 'from-emerald-500/10 to-teal-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60',
      activeRing: 'ring-2 ring-emerald-500',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 mb-6">
      {cards.map((card) => {
        const Icon = card.icon;
        const isSelected = selectedStatus === card.id;

        return (
          <button
            key={card.label}
            onClick={() => onSelectStatus(card.id)}
            className={`text-left p-4 rounded-2xl glass-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer ${
              isSelected ? `${card.activeRing} shadow-md` : 'hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {card.label}
              </span>
              <div className={`p-2 rounded-xl bg-gradient-to-br ${card.color}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {isLoading ? (
                <div className="h-7 w-12 bg-slate-200 dark:bg-slate-700 animate-pulse rounded" />
              ) : (
                card.count
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
};
