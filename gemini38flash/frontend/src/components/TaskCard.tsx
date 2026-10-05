import React from 'react';
import { Task, TaskCategory, TaskPriority, TaskStatus } from '../types';
import {
  Calendar,
  User,
  Edit2,
  Trash2,
  AlertCircle,
  Code2,
  Server,
  Database,
  Terminal,
  Palette,
  CheckCircle2,
  Clock,
  Flame,
  Eye,
  ChevronDown
} from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onView: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
  onStatusChange: (id: number, status: TaskStatus) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onView,
  onEdit,
  onDelete,
  onStatusChange,
}) => {
  const getCategoryMeta = (cat: TaskCategory) => {
    switch (cat) {
      case 'FRONTEND':
        return { label: 'Frontend', icon: Code2, bg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800' };
      case 'BACKEND':
        return { label: 'Backend', icon: Server, bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' };
      case 'DATABASE':
        return { label: 'Database', icon: Database, bg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800' };
      case 'DEVOPS':
        return { label: 'DevOps', icon: Terminal, bg: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800' };
      case 'DESIGN':
        return { label: 'Design', icon: Palette, bg: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-200 dark:border-pink-800' };
      default:
        return { label: 'Other', icon: AlertCircle, bg: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800' };
    }
  };

  const getPriorityBadge = (p: TaskPriority) => {
    switch (p) {
      case 'URGENT':
        return 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-300 dark:border-red-800/80';
      case 'HIGH':
        return 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-300 dark:border-orange-800/80';
      case 'MEDIUM':
        return 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-300 dark:border-sky-800/80';
      case 'LOW':
        return 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-800/80';
    }
  };

  const getStatusBadge = (s: TaskStatus) => {
    switch (s) {
      case 'TODO':
        return { label: '대기 중', icon: Clock, bg: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800/60' };
      case 'IN_PROGRESS':
        return { label: '진행 중', icon: Flame, bg: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-800/60' };
      case 'REVIEW':
        return { label: '검토 중', icon: Eye, bg: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-800/60' };
      case 'DONE':
        return { label: '완료', icon: CheckCircle2, bg: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800/60' };
    }
  };

  const categoryMeta = getCategoryMeta(task.category);
  const CategoryIcon = categoryMeta.icon;
  const statusMeta = getStatusBadge(task.status);
  const StatusIcon = statusMeta.icon;

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date(new Date().setHours(0, 0, 0, 0)) && task.status !== 'DONE';

  return (
    <div className="group glass-card rounded-2xl p-5 border border-slate-200/90 dark:border-slate-800/90 hover:border-indigo-400/50 dark:hover:border-indigo-500/50 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between relative overflow-hidden">
      {/* Top badges */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold border ${categoryMeta.bg}`}>
              <CategoryIcon className="w-3 h-3" />
              {categoryMeta.label}
            </span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-medium border ${getPriorityBadge(task.priority)}`}>
              {task.priority}
            </span>
          </div>

          {/* Quick status selector */}
          <div className="relative">
            <select
              value={task.status}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => onStatusChange(task.id, e.target.value as TaskStatus)}
              className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border appearance-none pr-6 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500 ${statusMeta.bg}`}
            >
              <option value="TODO">TODO</option>
              <option value="IN_PROGRESS">IN PROGRESS</option>
              <option value="REVIEW">REVIEW</option>
              <option value="DONE">DONE</option>
            </select>
            <ChevronDown className="w-3 h-3 absolute right-1.5 top-2 pointer-events-none opacity-60" />
          </div>
        </div>

        {/* Title */}
        <h3
          onClick={() => onView(task)}
          className="text-base font-bold text-slate-900 dark:text-white line-clamp-1 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer transition"
          title={task.title}
        >
          {task.title}
        </h3>

        {/* Content snippet */}
        <p
          onClick={() => onView(task)}
          className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mt-2 cursor-pointer leading-relaxed"
        >
          {task.content}
        </p>
      </div>

      {/* Footer info & actions */}
      <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-3">
          {/* Due date */}
          <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-500 font-semibold' : ''}`}>
            <Calendar className="w-3.5 h-3.5" />
            {task.dueDate ? task.dueDate : '기한 없음'}
          </span>
          {/* Author */}
          <span className="flex items-center gap-1 hidden sm:flex">
            <User className="w-3.5 h-3.5 text-indigo-400" />
            {task.authorName}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(task)}
            title="수정"
            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(task.id)}
            title="삭제"
            className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
