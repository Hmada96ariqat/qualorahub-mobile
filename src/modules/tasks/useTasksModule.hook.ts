import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createTask,
  deleteTask,
  listTaskActivity,
  listTaskAssetOptions,
  listTaskComments,
  listTasks,
  updateTask,
  updateTaskStatus,
  type CreateTaskRequest,
  type TaskSummary,
  type UpdateTaskRequest,
} from '../../api/modules/tasks';
import { useAuthSession } from '../../hooks/useAuthSession';

const TASKS_QUERY_KEY = ['tasks', 'list'] as const;
const TASKS_ASSET_OPTIONS_QUERY_KEY = ['tasks', 'asset-options'] as const;

function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return 'Failed to load tasks.';
}

export function useTasksModule(selectedTaskId: string | null) {
  const { session } = useAuthSession();
  const token = session?.accessToken ?? null;
  const queryClient = useQueryClient();

  const tasksQuery = useQuery({
    queryKey: TASKS_QUERY_KEY,
    queryFn: () => listTasks(token ?? ''),
    enabled: Boolean(token),
  });

  const assetOptionsQuery = useQuery({
    queryKey: TASKS_ASSET_OPTIONS_QUERY_KEY,
    queryFn: () => listTaskAssetOptions(token ?? ''),
    enabled: Boolean(token),
  });

  const commentsQuery = useQuery({
    queryKey: ['tasks', 'comments', selectedTaskId],
    queryFn: () => listTaskComments(token ?? '', selectedTaskId ?? ''),
    enabled: Boolean(token && selectedTaskId),
  });

  const activityQuery = useQuery({
    queryKey: ['tasks', 'activity', selectedTaskId],
    queryFn: () => listTaskActivity(token ?? '', selectedTaskId ?? ''),
    enabled: Boolean(token && selectedTaskId),
  });

  const createMutation = useMutation({
    mutationFn: (input: CreateTaskRequest) => createTask(token ?? '', input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { taskId: string; input: UpdateTaskRequest }) =>
      updateTask(token ?? '', payload.taskId, payload.input),
    onSuccess: async (_, payload) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: ['tasks', 'comments', payload.taskId] }),
        queryClient.invalidateQueries({ queryKey: ['tasks', 'activity', payload.taskId] }),
      ]);
    },
  });

  const statusMutation = useMutation({
    mutationFn: (payload: { taskId: string; status: string }) =>
      updateTaskStatus(token ?? '', payload.taskId, payload.status),
    onSuccess: async (_, payload) => {
      await queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
      await queryClient.invalidateQueries({ queryKey: ['tasks', 'activity', payload.taskId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (taskId: string) => deleteTask(token ?? '', taskId),
    onSuccess: async (_, taskId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: ['tasks', 'comments', taskId] }),
        queryClient.invalidateQueries({ queryKey: ['tasks', 'activity', taskId] }),
      ]);
    },
  });

  const tasks = useMemo<TaskSummary[]>(() => tasksQuery.data ?? [], [tasksQuery.data]);
  const assetOptions = useMemo(() => assetOptionsQuery.data ?? [], [assetOptionsQuery.data]);
  const comments = useMemo(() => commentsQuery.data ?? [], [commentsQuery.data]);
  const activity = useMemo(() => activityQuery.data ?? [], [activityQuery.data]);

  const isMutating =
    createMutation.isPending ||
    updateMutation.isPending ||
    statusMutation.isPending ||
    deleteMutation.isPending;

  return {
    tasks,
    assetOptions,
    comments,
    activity,
    isLoading: tasksQuery.isLoading,
    isRefreshing: tasksQuery.isFetching,
    isMutating,
    detailsLoading: commentsQuery.isLoading || activityQuery.isLoading,
    detailsRefreshing: commentsQuery.isFetching || activityQuery.isFetching,
    errorMessage: tasksQuery.error ? toErrorMessage(tasksQuery.error) : null,
    detailsErrorMessage: commentsQuery.error
      ? toErrorMessage(commentsQuery.error)
      : activityQuery.error
        ? toErrorMessage(activityQuery.error)
        : null,
    refresh: async () => {
      await Promise.all([tasksQuery.refetch(), assetOptionsQuery.refetch()]);
    },
    refreshDetails: async () => {
      await Promise.all([commentsQuery.refetch(), activityQuery.refetch()]);
    },
    createTask: (input: CreateTaskRequest) => createMutation.mutateAsync(input),
    updateTask: (taskId: string, input: UpdateTaskRequest) => updateMutation.mutateAsync({ taskId, input }),
    updateStatus: (taskId: string, status: string) => statusMutation.mutateAsync({ taskId, status }),
    deleteTask: (taskId: string) => deleteMutation.mutateAsync(taskId),
  };
}
