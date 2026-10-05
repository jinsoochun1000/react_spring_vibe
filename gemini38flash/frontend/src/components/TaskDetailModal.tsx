import React from 'react';
import { Task, TaskCategory, TaskPriority, TaskStatus } from '../types';
import {
  X,
  Calendar,
  User,
  Clock,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Code2,
  Server,
  Database,
  Terminal,
  Palette,
  Flame,
  Eye
} from 'lucide-react';

interface TaskDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
  onStatusChange: (id: number, status: TaskStatus) => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onStatusChange,
}) => {
  if (!isOpen || !task) return null;

  const getCategoryMeta = (cat: TaskCategory) => {
    switch (cat) {
      case 'FRONTEND': return { label: 'Frontend', icon: Code2, color: 'text-blue-500 bg-blue-500/10' };
      case 'BACKEND': return { label: 'Backend', icon: Server, color: 'text-emerald-500 bg-emerald-500/10' };
      case 'DATABASE': return { label: 'Database', icon: Database, color: 'text-purple-500 bg-purple-500/10' };
      case 'DEVOPS': return { label: 'DevOps', icon: Terminal, color: 'text-cyan-500 bg-cyan-500/10' };
      case 'DESIGN': return { label: 'Design', icon: Palette, color: 'text-pink-500 bg-pink-500/10' };
      default: return { label: 'Other', icon: AlertCircle, color: 'text-slate-500 bg-slate-500/10' };
    }
  };

  const catMeta = getCategoryMeta(task.category);
  const CategoryIcon = catMeta.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
      <div className="glass-panel w-full max-w-xl rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-2 mb-2">
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold ${catMeta.color}`}>
                <CategoryIcon className="w-3.5 h-3.5" />
                {catMeta.label}
              </span>
              <span className="text-xs font-medium px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                우선순위: {task.priority}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                상태: {task.status}
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-snug">
              {task.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Metadata grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-4 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs">
          <div>
            <span className="text-slate-400 block mb-0.5">작성자</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-indigo-500" />
              {task.authorName} ({task.authorUsername})
            </span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">마감일</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-indigo-500" />
              {task.dueDate || '미지정'}
            </span>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <span className="text-slate-400 block mb-0.5">등록일시</span>
            <span className="font-mono text-slate-700 dark:text-slate-300">
              {task.createdAt ? new Date(task.createdAt).toLocaleString('ko-KR') : '-'}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="my-4">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            작업 상세 내용
          </label>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 text-sm text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed max-h-60 overflow-y-auto">
            {task.content}
          </div>
        </div>

        {/* Quick status switch buttons */}
        <div className="my-4 pt-3 border-t border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-500 dark:text-slate-400 block mb-2 font-medium">
            빠른 상태 변경:
          </span>
          <div className="grid grid-cols-4 gap-2">
            {(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'] as TaskStatus[]).map((st) => (
              <button
                key={st}
                onClick={() => onStatusChange(task.id, st)}
                className={`py-1.5 text-xs font-semibold rounded-lg border transition ${
                  task.status === st
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={() => {
              onClose();
              onDelete(task.id);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs font-semibold transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>태스크 삭제</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onEdit(task);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-500/20 active:scale-95 transition"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>수정하기</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
