import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './context/AuthContext';
import { taskApi } from './api/task';
import { Task, TaskCategory, TaskFormData, TaskPriority, TaskStatus } from './types';
import { Navbar } from './components/Navbar';
import { StatsCards } from './components/StatsCards';
import { FilterBar } from './components/FilterBar';
import { TaskCard } from './components/TaskCard';
import { TaskModal } from './components/TaskModal';
import { TaskDetailModal } from './components/TaskDetailModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { Pagination } from './components/Pagination';
import { LoginPage } from './components/LoginPage';
import {
  Sparkles,
  Inbox,
  Plus,
  RefreshCw,
  Database,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export const App: React.FC = () => {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const queryClient = useQueryClient();

  // Filters & Pagination State
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState<TaskCategory | ''>('');
  const [priority, setPriority] = useState<TaskPriority | ''>('');
  const [status, setStatus] = useState<TaskStatus | ''>('');
  const [sort, setSort] = useState('createdAt,desc');
  const [page, setPage] = useState(0);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<number | null>(null);

  // Notification Toast State
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Queries
  const {
    data: taskPage,
    isLoading: isTasksLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['tasks', { keyword, category, priority, status, page, sort }],
    queryFn: () => taskApi.getTasks({ keyword, category, priority, status, page, size: 9, sort }),
    enabled: isAuthenticated,
  });

  const { data: stats, isLoading: isStatsLoading } = useQuery({
    queryKey: ['taskStats'],
    queryFn: taskApi.getTaskStats,
    enabled: isAuthenticated,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: TaskFormData) => taskApi.createTask(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['taskStats'] });
      showToast('새 태스크가 성공적으로 등록되었습니다.');
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || '태스크 등록에 실패했습니다.', 'error');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: TaskFormData }) => taskApi.updateTask(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['taskStats'] });
      showToast('태스크가 성공적으로 수정되었습니다.');
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || '수정에 실패했습니다.', 'error');
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: TaskStatus }) => taskApi.updateTaskStatus(id, status),
    onSuccess: (updatedTask) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['taskStats'] });
      if (viewingTask?.id === updatedTask.id) {
        setViewingTask(updatedTask);
      }
      showToast(`태스크 상태가 '${updatedTask.status}'(으)로 변경되었습니다.`);
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || '상태 변경에 실패했습니다.', 'error');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => taskApi.deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['taskStats'] });
      setDeletingTaskId(null);
      showToast('태스크가 성공적으로 삭제되었습니다.');
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || '삭제에 실패했습니다.', 'error');
    },
  });

  const handleResetFilters = () => {
    setKeyword('');
    setCategory('');
    setPriority('');
    setStatus('');
    setSort('createdAt,desc');
    setPage(0);
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium text-slate-400">인증 세션 확인 중...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors selection:bg-indigo-500 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div
            className={`px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-semibold backdrop-blur-md ${
              toastMessage.type === 'success'
                ? 'bg-emerald-600 text-white shadow-emerald-500/25'
                : 'bg-red-600 text-white shadow-red-500/25'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Navbar */}
      <Navbar onOpenCreateModal={() => setIsCreateOpen(true)} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tutorial Banner */}
        <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-transparent border border-indigo-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-500/30">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>실시간 Oracle 18c XE 연동 풀스택 CRUD</span>
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                React Query 캐싱, Spring Security 무상태 JWT, Hibernate DDL 시퀀스 자동 매핑이 적용되어 있습니다.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-indigo-500' : ''}`} />
              <span>새로고침</span>
            </button>
          </div>
        </div>

        {/* Real-time Stats Cards */}
        <StatsCards
          stats={stats}
          selectedStatus={status}
          onSelectStatus={(st) => {
            setStatus(st);
            setPage(0);
          }}
          isLoading={isStatsLoading}
        />

        {/* Filter and Search Bar */}
        <FilterBar
          keyword={keyword}
          onKeywordChange={(val) => {
            setKeyword(val);
            setPage(0);
          }}
          category={category}
          onCategoryChange={(val) => {
            setCategory(val);
            setPage(0);
          }}
          priority={priority}
          onPriorityChange={(val) => {
            setPriority(val);
            setPage(0);
          }}
          status={status}
          onStatusChange={(val) => {
            setStatus(val);
            setPage(0);
          }}
          sort={sort}
          onSortChange={(val) => {
            setSort(val);
            setPage(0);
          }}
          onReset={handleResetFilters}
        />

        {/* Tasks Grid or Empty State */}
        {isTasksLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="glass-card rounded-2xl p-5 border border-slate-200 dark:border-slate-800 animate-pulse h-48" />
            ))}
          </div>
        ) : taskPage?.content && taskPage.content.length > 0 ? (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {taskPage.content.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onView={(t) => setViewingTask(t)}
                  onEdit={(t) => setEditingTask(t)}
                  onDelete={(id) => setDeletingTaskId(id)}
                  onStatusChange={(id, st) => statusMutation.mutate({ id, status: st })}
                />
              ))}
            </div>

            {/* Pagination */}
            <Pagination
              currentPage={taskPage.number}
              totalPages={taskPage.totalPages}
              totalElements={taskPage.totalElements}
              pageSize={taskPage.size}
              onPageChange={(p) => setPage(p)}
            />
          </div>
        ) : (
          <div className="glass-panel rounded-2xl p-12 text-center border border-dashed border-slate-300 dark:border-slate-800 my-8">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-500 flex items-center justify-center mx-auto mb-4">
              <Inbox className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">
              등록된 태스크가 없습니다.
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-5">
              {keyword || category || status || priority
                ? '선택된 검색 조건과 일치하는 태스크가 없습니다. 필터를 초기화해보세요.'
                : '첫 번째 개발 태스크를 등록하고 프로젝트 일정을 관리해보세요!'}
            </p>
            {keyword || category || status || priority ? (
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition"
              >
                검색 조건 초기화
              </button>
            ) : (
              <button
                onClick={() => setIsCreateOpen(true)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 transition inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>새 태스크 생성하기</span>
              </button>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto py-6 border-t border-slate-200/80 dark:border-slate-800/80 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>CRUD Tutorial with React 19 + Spring Boot 3 + Oracle 18c XE</span>
          <span className="font-mono text-[11px] text-slate-400">Stateless JWT Auth · TanStack Query v5</span>
        </div>
      </footer>

      {/* Create Modal */}
      <TaskModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={async (data) => {
          await createMutation.mutateAsync(data);
        }}
        isLoading={createMutation.isPending}
      />

      {/* Edit Modal */}
      <TaskModal
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
        initialData={editingTask}
        onSubmit={async (data) => {
          if (editingTask) {
            await updateMutation.mutateAsync({ id: editingTask.id, data });
          }
        }}
        isLoading={updateMutation.isPending}
      />

      {/* Detail Modal */}
      <TaskDetailModal
        task={viewingTask}
        isOpen={!!viewingTask}
        onClose={() => setViewingTask(null)}
        onEdit={(t) => {
          setViewingTask(null);
          setEditingTask(t);
        }}
        onDelete={(id) => {
          setViewingTask(null);
          setDeletingTaskId(id);
        }}
        onStatusChange={(id, st) => statusMutation.mutate({ id, status: st })}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deletingTaskId !== null}
        onClose={() => setDeletingTaskId(null)}
        onConfirm={async () => {
          if (deletingTaskId !== null) {
            await deleteMutation.mutateAsync(deletingTaskId);
          }
        }}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
