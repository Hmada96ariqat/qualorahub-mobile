import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import type { TaskSummary } from '../../../api/modules/tasks';
import {
  ActionSheet,
  AppBadge,
  AppButton,
  AppCard,
  AppDatePicker,
  AppHeader,
  AppInput,
  AppListItem,
  AppScreen,
  AppSection,
  AppSelect,
  AppTabs,
  AppTextArea,
  BottomSheet,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  FilterBar,
  FormField,
  PaginationFooter,
  PullToRefreshContainer,
  Skeleton,
  useToast,
} from '../../../components';
import { palette, spacing, typography } from '../../../theme/tokens';
import {
  TASK_PRIORITY_OPTIONS,
  TASK_STATUS_OPTIONS,
  normalizeTaskStatus,
  toTaskFormValues,
  type TaskFormMode,
  type TaskFormValues,
  type TaskListMode,
} from '../contracts';
import { useTasksModule } from '../useTasksModule.hook';

function normalizeRowStatus(status: string): string {
  return status.trim().toLowerCase().replace(/\s+/g, '_');
}

function formatTaskMeta(task: TaskSummary): string {
  const due = task.dueDate ? `Due ${task.dueDate}` : 'No due date';
  const priority = task.priority ? `Priority ${task.priority}` : 'Priority n/a';
  return `${due} • ${priority}`;
}

function getStatusBadge(task: TaskSummary): string {
  const status = normalizeRowStatus(task.status);
  if (status === 'completed') return 'done';
  if (status === 'in_progress') return 'in-progress';
  return status || 'pending';
}

function getStatusVariant(task: TaskSummary): 'neutral' | 'accent' | 'warning' | 'success' {
  const status = normalizeRowStatus(task.status);
  if (status === 'completed') return 'success';
  if (status === 'in_progress') return 'accent';
  return 'warning';
}

function getPriorityVariant(priority: string | null | undefined): 'neutral' | 'warning' | 'destructive' {
  if (priority === 'high') return 'destructive';
  if (priority === 'medium') return 'warning';
  return 'neutral';
}

type StatusAction = 'in_progress' | 'completed';

export function TasksScreen() {
  const { showToast } = useToast();
  const [listMode, setListMode] = useState<TaskListMode>('all');
  const [searchValue, setSearchValue] = useState('');
  const [formVisible, setFormVisible] = useState(false);
  const [formMode, setFormMode] = useState<TaskFormMode>('create');
  const [formValues, setFormValues] = useState<TaskFormValues>(toTaskFormValues());
  const [editingTask, setEditingTask] = useState<TaskSummary | null>(null);
  const [actionTask, setActionTask] = useState<TaskSummary | null>(null);
  const [deletingTask, setDeletingTask] = useState<TaskSummary | null>(null);
  const [detailsTask, setDetailsTask] = useState<TaskSummary | null>(null);
  const {
    tasks,
    assetOptions,
    comments,
    activity,
    isLoading,
    isRefreshing,
    isMutating,
    detailsLoading,
    detailsRefreshing,
    errorMessage,
    detailsErrorMessage,
    refresh,
    refreshDetails,
    createTask,
    updateTask,
    updateStatus,
    deleteTask,
  } = useTasksModule(detailsTask?.id ?? null);

  const filteredRows = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    return tasks.filter((task) => {
      const status = normalizeTaskStatus(task.status);
      const statusMatch = listMode === 'all' || status === listMode;
      if (!statusMatch) return false;

      if (!normalizedSearch) return true;

      const titleMatch = task.title.toLowerCase().includes(normalizedSearch);
      const descriptionMatch = (task.description ?? '').toLowerCase().includes(normalizedSearch);
      return titleMatch || descriptionMatch;
    });
  }, [tasks, listMode, searchValue]);

  const assetSelectOptions = useMemo(
    () => [{ label: 'No asset', value: '' }, ...assetOptions],
    [assetOptions],
  );

  function closeFormSheet() {
    setFormVisible(false);
    setEditingTask(null);
    setFormValues(toTaskFormValues());
  }

  function openCreateSheet() {
    setFormMode('create');
    setEditingTask(null);
    setFormValues(toTaskFormValues());
    setFormVisible(true);
  }

  function openEditSheet(task: TaskSummary) {
    setFormMode('edit');
    setEditingTask(task);
    setFormValues(toTaskFormValues(task));
    setFormVisible(true);
  }

  async function submitForm() {
    const title = formValues.title.trim();
    if (!title) {
      showToast({ message: 'Task title is required.', variant: 'error' });
      return;
    }

    const payload = {
      title,
      description: formValues.description.trim() || null,
      status: formValues.status,
      priority: formValues.priority,
      due_date: formValues.dueDate,
      asset_id: formValues.assetId || null,
    };

    try {
      if (formMode === 'create') {
        await createTask(payload);
        showToast({ message: 'Task created.', variant: 'success' });
      } else if (editingTask) {
        await updateTask(editingTask.id, payload);
        showToast({ message: 'Task updated.', variant: 'success' });
      }

      closeFormSheet();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Task mutation failed.';
      showToast({ message, variant: 'error' });
    }
  }

  async function submitStatus(task: TaskSummary, status: StatusAction) {
    try {
      await updateStatus(task.id, status);
      showToast({ message: `Task marked ${status.replace('_', ' ')}.`, variant: 'success' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Task status update failed.';
      showToast({ message, variant: 'error' });
    }
  }

  async function confirmDeleteTask() {
    if (!deletingTask) return;

    try {
      await deleteTask(deletingTask.id);
      showToast({ message: 'Task deleted.', variant: 'success' });
      if (detailsTask?.id === deletingTask.id) {
        setDetailsTask(null);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Task deletion failed.';
      showToast({ message, variant: 'error' });
    } finally {
      setDeletingTask(null);
    }
  }

  return (
    <AppScreen scroll>
      <AppHeader
        title="Tasks"
        subtitle="List, create, edit, filter, and update task lifecycle states."
      />

      <View style={styles.topActions}>
        <View style={styles.primaryAction}>
          <AppButton label="Create Task" onPress={openCreateSheet} />
        </View>
        <View style={styles.secondaryAction}>
          <AppButton
            label="Refresh"
            mode="outlined"
            tone="neutral"
            onPress={() => void refresh()}
            loading={isRefreshing || isMutating}
          />
        </View>
      </View>

      <AppCard>
        <FilterBar
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          searchPlaceholder="Search tasks"
        >
          <AppTabs
            value={listMode}
            onValueChange={(nextValue) => setListMode(nextValue as TaskListMode)}
            tabs={[
              { value: 'all', label: 'All' },
              { value: 'pending', label: 'Pending' },
              { value: 'in_progress', label: 'In Progress' },
              { value: 'completed', label: 'Completed' },
            ]}
          />
        </FilterBar>
      </AppCard>

      <AppCard>
        <AppSection
          title="Task records"
          description="Shared list/filter/skeleton/error patterns with quick status updates."
        >
          {isLoading ? (
            <>
              <Skeleton height={56} />
              <Skeleton height={56} />
              <Skeleton height={56} />
            </>
          ) : errorMessage ? (
            <ErrorState message={errorMessage} onRetry={() => void refresh()} />
          ) : filteredRows.length === 0 ? (
            <EmptyState
              title="No tasks found"
              message="Try another search/filter or create a new task."
              actionLabel="Create task"
              onAction={openCreateSheet}
            />
          ) : (
            <PullToRefreshContainer refreshing={isRefreshing} onRefresh={() => void refresh()}>
              <View style={styles.rows}>
                {filteredRows.map((task) => (
                  <AppCard key={task.id}>
                    <AppListItem
                      title={task.title}
                      description={formatTaskMeta(task)}
                      leftIcon="clipboard-text-outline"
                      onPress={() => setActionTask(task)}
                    />
                    <View style={styles.rowMeta}>
                      <View style={styles.metaGroup}>
                        <Text style={styles.metaText}>Status</Text>
                        <AppBadge value={getStatusBadge(task)} variant={getStatusVariant(task)} />
                      </View>
                      <View style={styles.metaGroup}>
                        <Text style={styles.metaText}>Priority</Text>
                        <AppBadge value={task.priority ?? 'n/a'} variant={getPriorityVariant(task.priority)} />
                      </View>
                    </View>
                  </AppCard>
                ))}
              </View>
            </PullToRefreshContainer>
          )}
        </AppSection>
      </AppCard>

      <PaginationFooter
        page={1}
        pageSize={Math.max(filteredRows.length, 1)}
        totalItems={filteredRows.length}
        onPageChange={() => undefined}
      />

      <BottomSheet
        visible={formVisible}
        onDismiss={closeFormSheet}
        title={formMode === 'create' ? 'Create Task' : 'Edit Task'}
        footer={
          <View style={styles.sheetFooter}>
            <AppButton label="Cancel" mode="text" tone="neutral" onPress={closeFormSheet} />
            <AppButton
              label={formMode === 'create' ? 'Create' : 'Save'}
              onPress={() => void submitForm()}
              loading={isMutating}
              disabled={isMutating || !formValues.title.trim()}
            />
          </View>
        }
      >
        <FormField label="Title" required>
          <AppInput
            value={formValues.title}
            onChangeText={(value) => setFormValues((prev) => ({ ...prev, title: value }))}
            placeholder="Task title"
          />
        </FormField>

        <FormField label="Description">
          <AppTextArea
            value={formValues.description}
            onChangeText={(value) => setFormValues((prev) => ({ ...prev, description: value }))}
            placeholder="Task details"
          />
        </FormField>

        <FormField label="Status">
          <AppSelect
            value={formValues.status}
            onChange={(value) =>
              setFormValues((prev) => ({ ...prev, status: normalizeTaskStatus(value) }))
            }
            options={TASK_STATUS_OPTIONS.map((option) => ({ label: option.label, value: option.value }))}
            label="Task status"
          />
        </FormField>

        <FormField label="Priority">
          <AppSelect
            value={formValues.priority}
            onChange={(value) =>
              setFormValues((prev) => ({
                ...prev,
                priority: value === 'low' || value === 'high' ? value : 'medium',
              }))
            }
            options={TASK_PRIORITY_OPTIONS.map((option) => ({ label: option.label, value: option.value }))}
            label="Task priority"
          />
        </FormField>

        <FormField label="Due date">
          <AppDatePicker
            value={formValues.dueDate}
            onChange={(value) => setFormValues((prev) => ({ ...prev, dueDate: value }))}
            label="Task due date"
          />
        </FormField>

        <FormField label="Asset">
          <AppSelect
            value={formValues.assetId ?? ''}
            onChange={(value) => setFormValues((prev) => ({ ...prev, assetId: value || null }))}
            options={assetSelectOptions}
            label="Task asset"
            placeholder="No asset selected"
          />
        </FormField>
      </BottomSheet>

      <BottomSheet
        visible={Boolean(detailsTask)}
        onDismiss={() => setDetailsTask(null)}
        title={detailsTask ? `Task Activity: ${detailsTask.title}` : 'Task Activity'}
      >
        {detailsLoading ? (
          <>
            <Skeleton height={48} />
            <Skeleton height={48} />
            <Skeleton height={48} />
          </>
        ) : detailsErrorMessage ? (
          <ErrorState message={detailsErrorMessage} onRetry={() => void refreshDetails()} />
        ) : (
          <>
            <AppSection title="Comments">
              {comments.length === 0 ? (
                <EmptyState
                  title="No comments"
                  message="No task comments are available for this record."
                />
              ) : (
                <View style={styles.rows}>
                  {comments.map((comment) => (
                    <AppListItem
                      key={comment.id || `${comment.message}-${comment.createdAt ?? 'now'}`}
                      title={comment.message}
                      description={comment.author ?? 'Unknown author'}
                      leftIcon="comment-outline"
                      rightText={comment.createdAt ?? ''}
                    />
                  ))}
                </View>
              )}
            </AppSection>

            <AppSection title="Activity">
              {activity.length === 0 ? (
                <EmptyState
                  title="No activity"
                  message="No activity entries are available for this task."
                />
              ) : (
                <View style={styles.rows}>
                  {activity.map((entry) => (
                    <AppListItem
                      key={entry.id || `${entry.action}-${entry.createdAt ?? 'now'}`}
                      title={entry.action}
                      description={entry.message ?? 'No activity details'}
                      leftIcon="history"
                      rightText={entry.createdAt ?? ''}
                    />
                  ))}
                </View>
              )}
            </AppSection>

            <AppButton
              label={detailsRefreshing ? 'Refreshing…' : 'Refresh activity'}
              mode="outlined"
              tone="neutral"
              onPress={() => void refreshDetails()}
              disabled={detailsRefreshing}
            />
          </>
        )}
      </BottomSheet>

      <ActionSheet
        visible={Boolean(actionTask)}
        onDismiss={() => setActionTask(null)}
        title={actionTask?.title}
        message="Choose an action for this task."
        actions={[
          {
            key: 'edit',
            label: 'Edit task',
            disabled: isMutating,
            onPress: () => {
              if (!actionTask) return;
              openEditSheet(actionTask);
            },
          },
          {
            key: 'details',
            label: 'View comments/activity',
            disabled: isMutating,
            onPress: () => {
              if (!actionTask) return;
              setDetailsTask(actionTask);
            },
          },
          {
            key: 'progress',
            label: 'Mark in progress',
            disabled: isMutating,
            onPress: () => {
              if (!actionTask) return;
              void submitStatus(actionTask, 'in_progress');
            },
          },
          {
            key: 'completed',
            label: 'Mark completed',
            disabled: isMutating,
            onPress: () => {
              if (!actionTask) return;
              void submitStatus(actionTask, 'completed');
            },
          },
          {
            key: 'delete',
            label: 'Delete task',
            destructive: true,
            disabled: isMutating,
            onPress: () => {
              if (!actionTask) return;
              setDeletingTask(actionTask);
            },
          },
        ]}
      />

      <ConfirmDialog
        visible={Boolean(deletingTask)}
        title="Delete task?"
        message="This action cannot be undone."
        confirmLabel="Delete"
        confirmTone="destructive"
        onCancel={() => setDeletingTask(null)}
        onConfirm={() => void confirmDeleteTask()}
        confirmLoading={isMutating}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  topActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  primaryAction: {
    flex: 1,
  },
  secondaryAction: {
    minWidth: 120,
  },
  rows: {
    gap: spacing.sm,
  },
  rowMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.xs,
    gap: spacing.sm,
  },
  metaGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaText: {
    ...typography.caption,
    color: palette.mutedForeground,
    fontWeight: '600',
  },
  sheetFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
});
