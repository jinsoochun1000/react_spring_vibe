import React from 'react';
import { TaskCategory, TaskPriority, TaskStatus } from '../types';
import { Search, X, RotateCcw, SlidersHorizontal } from 'lucide-react';

interface FilterBarProps {
  keyword: string;
  onKeywordChange: (val: string) => void;
  category: TaskCategory | '';
  onCategoryChange: (val: TaskCategory | '') => void;
  priority: TaskPriority | '';
  onPriorityChange: (val: TaskPriority | '') => void;
  status: TaskStatus | '';
  onStatusChange: (val: TaskStatus | '') => void;
  sort: string;
  onSortChange: (val: string) => void;
  onReset: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  keyword,
  onKeywordChange,
  category,
  onCategoryChange,
  priority,
  onPriorityChange,
  status,
  onStatusChange,
  sort,
  onSortChange,
  onReset,
}) => {
  const hasFilters = !!keyword || !!category || !!priority || !!status || sort !== 'createdAt,desc';

  return (
    <div className="glass-card rounded-2xl p-4 mb-6 shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        {/* Search input */}
        <div className="relative flex-1 min-w-[240px]">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={keyword}
            onChange={(e) => onKeywordChange(e.target.value)}
            placeholder="제목, 내용, 작성자 검색..."
            className="w-full pl-10 pr-9 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          />
          {keyword && (
            <button
              onClick={() => onKeywordChange('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <select
            value={category}
            onChange={(e) => onCategoryChange(e.target.value as TaskCategory | '')}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-700 dark:text-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="">모든 카테고리</option>
            <option value="FRONTEND">FRONTEND</option>
            <option value="BACKEND">BACKEND</option>
            <option value="DATABASE">DATABASE</option>
            <option value="DEVOPS">DEVOPS</option>
            <option value="DESIGN">DESIGN</option>
            <option value="OTHER">OTHER</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priority}
            onChange={(e) => onPriorityChange(e.target.value as TaskPriority | '')}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-700 dark:text-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="">모든 우선순위</option>
            <option value="URGENT">긴급 (URGENT)</option>
            <option value="HIGH">높음 (HIGH)</option>
            <option value="MEDIUM">보통 (MEDIUM)</option>
            <option value="LOW">낮음 (LOW)</option>
          </select>

          {/* Status Filter */}
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value as TaskStatus | '')}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-700 dark:text-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="">모든 상태</option>
            <option value="TODO">대기 (TODO)</option>
            <option value="IN_PROGRESS">진행 중 (IN_PROGRESS)</option>
            <option value="REVIEW">검토 (REVIEW)</option>
            <option value="DONE">완료 (DONE)</option>
          </select>

          {/* Sort Option */}
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-700 dark:text-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="createdAt,desc">최신 등록순</option>
            <option value="createdAt,asc">오래된 순</option>
            <option value="dueDate,asc">마감 임박순</option>
            <option value="title,asc">제목 가나다순</option>
          </select>

          {/* Reset Filters */}
          {hasFilters && (
            <button
              onClick={onReset}
              title="필터 초기화"
              className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 border border-slate-200 dark:border-slate-700/80 transition flex items-center gap-1 text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">초기화</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
