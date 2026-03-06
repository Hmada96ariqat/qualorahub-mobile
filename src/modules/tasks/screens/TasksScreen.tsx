import React, { useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { TaskSummary } from '../../../api/modules/tasks';
import {
  AppButton,
  AppDatePicker,
  AppInput,
  AppScreen,
  AppSelect,
  AppTextArea,
  BottomSheet,
  ConfirmDialog,
  DotBadge,
  EmptyState,
  ErrorState,
  FormValidationProvider,
  FormField,
  HeaderIconButton,
  HeaderMenuButton,
  ListRow,
  LogRow,
  NotificationHeaderButton,
  PillTabs,
  ProfileCard,
  PullToRefreshContainer,
  QuickActionGrid,
  SearchBar,
  SectionHeader,
  Skeleton,
  StatStrip,
  UnderlineTabs,
  useFormValidation,
  useToast,
} from '../../../components';
import type { DotBadgeVariant, ListRowIconVariant, QuickAction } from '../../../components';
import { palette } from '../../../theme/tokens';
import {
  TASK_PRIORITY_OPTIONS,
  TASK_STATUS_OPTIONS,
  normalizeTaskStatus,
  serializeTaskDueDate,
  toTaskAssetPayload,
  toTaskFormValues,
  type TaskFormMode,
  type TaskFormValues,
  type TaskListMode,
} from '../contracts';
import { useTasksModule } from '../useTasksModule.hook';

type DetailTab = 'comments' | 'activity';

/* ─── Helpers ─── */

function toStatusLabel(status: string): string {
  const s = status.trim().toLowerCase();
  if (s === 'in_progress') return 'In Progress';
  if (s === 'completed') return 'Completed';
  return 'Pending';
}

function toStatusVariant(status: string): DotBadgeVariant {
  const s = status.trim().toLowerCase();
  if (s === 'completed') return 'success';
  if (s === 'in_progress') return 'neutral';
  return 'warning';
}

function toIconVariant(status: string): ListRowIconVariant {
  const s = status.trim().toLowerCase();
  if (s === 'completed') return 'green';
  if (s === 'in_progress') return 'amber';
  return 'neutral';
}

function toTaskIcon(status: string): string {
  const s = status.trim().toLowerCase();
  if (s === 'completed') return 'check-circle-outline';
  if (s === 'in_progress') return 'clock-outline';
  return 'clipboard-text-outline';
}

function toPriorityLabel(priority: string | null | undefined): string {
  const p = (priority ?? '').trim().toLowerCase();
  if (p === 'high') return 'High';
  if (p === 'low') return 'Low';
  return 'Medium';
}

function isTaskOverdue(task: TaskSummary): boolean {
  if (!task.dueDate || normalizeTaskStatus(task.status) === 'completed') return false;
  const today = new Date().toISOString().slice(0, 10);
  return task.dueDate < today;
}

function calcOverdueDays(dueDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDateOnly = dueDate.includes('T') ? dueDate.slice(0, 10) : dueDate;
  const due = new Date(dueDateOnly + 'T00:00:00');
  const diff = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

function toDateLabel(value: string | null | undefined): string {
  if (!value) return 'No due date';
  const dateStr = value.includes('T') ? value.slice(0, 10) : value;
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function toShortDate(value: string | null | undefined): string {
  if (!value) return 'n/a';
  const dateStr = value.includes('T') ? value.slice(0, 10) : value;
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

/* ─── Component ─── */

export function TasksScreen() {
  const { showToast } = useToast();
  const formScrollViewRef = useRef<ScrollView | null>(null);
  const formValidation = useFormValidation<'title' | 'dueDate'>(formScrollViewRef);

  /* ─── List state ─── */
  const [listMode, setListMode] = useState<TaskListMode>('all');
  const [searchValue, setSearchValue] = useState('');

  /* ─── Form state ─── */
  const [formVisible, setFormVisible] = useState(false);
  const [formMode, setFormMode] = useState<TaskFormMode>('create');
  const [formValues, setFormValues] = useState<TaskFormValues>(toTaskFormValues());
  const [editingTask, setEditingTask] = useState<TaskSummary | null>(null);

  /* ─── Detail state ─── */
  const [detailsTask, setDetailsTask] = useState<TaskSummary | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>('comments');
  const [deletingTask, setDeletingTask] = useState<TaskSummary | null>(null);

  /* ─── Hook ─── */
  const {
    tasks,
    assetOptions,
    comments,
    activity,
    isLoading,
    isRefreshing,
    isMutating,
    detailsLoading,
    detailsErrorMessage,
    errorMessage,
    refresh,
    refreshDetails,
    createTask,
    updateTask,
    updateStatus,
    deleteTask,
  } = useTasksModule(detailsTask?.id ?? null);

  /* ─── Computed values ─── */

  const pendingCount = useMemo(
    () => tasks.filter((t) => normalizeTaskStatus(t.status) === 'pending').length,
    [tasks],
  );

  const inProgressCount = useMemo(
    () => tasks.filter((t) => normalizeTaskStatus(t.status) === 'in_progress').length,
    [tasks],
  );

  const completedCount = useMemo(
    () => tasks.filter((t) => normalizeTaskStatus(t.status) === 'completed').length,
    [tasks],
  );

  const overdueTasks = useMemo(() => tasks.filter(isTaskOverdue), [tasks]);

  const overdueCount = overdueTasks.length;

  const filteredRows = useMemo(() => {
    const term = searchValue.trim().toLowerCase();
    return tasks.filter((task) => {
      const status = normalizeTaskStatus(task.status);
      const statusMatch = listMode === 'all' || status === listMode;
      if (!statusMatch) return false;
      if (!term) return true;
      const titleMatch = task.title.toLowerCase().includes(term);
      const descriptionMatch = (task.description ?? '').toLowerCase().includes(term);
      return titleMatch || descriptionMatch;
    });
  }, [tasks, listMode, searchValue]);

  const assetSelectOptions = useMemo(
    () => [{ label: 'No asset', value: '' }, ...assetOptions],
    [assetOptions],
  );

  /* ─── Form handlers ─── */

  function closeFormSheet() {
    setFormVisible(false);
    setEditingTask(null);
    setFormValues(toTaskFormValues());
    formValidation.reset();
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
    const dueDateSerialization = serializeTaskDueDate(formValues.dueDate);
    const valid = formValidation.validate([
      {
        field: 'title',
        message: 'Task title is required.',
        isValid: title.length > 0,
      },
      {
        field: 'dueDate',
        message: 'Due date is invalid. Use a valid calendar date.',
        isValid: dueDateSerialization.valid,
      },
    ]);
    if (!valid) {
      showToast({ message: 'Complete the highlighted fields.', variant: 'error' });
      return;
    }

    const assetPayload = toTaskAssetPayload(formValues.assetId, assetOptions);

    const payload = {
      title,
      description: formValues.description.trim() || null,
      status: formValues.status,
      priority: formValues.priority,
      due_date_time: dueDateSerialization.dueDateTime,
      ...assetPayload,
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

  /* ─── Status handler ─── */

  async function submitStatus(task: TaskSummary, status: 'in_progress' | 'completed') {
    try {
      await updateStatus(task.id, status);
      showToast({
        message: `Task marked ${toStatusLabel(status).toLowerCase()}.`,
        variant: 'success',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Task status update failed.';
      showToast({ message, variant: 'error' });
    }
  }

  /* ─── Delete handler ─── */

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

  /* ─── Detail handlers ─── */

  function openTaskDetails(task: TaskSummary) {
    setDetailsTask(task);
    setDetailTab('comments');
  }

  function closeTaskDetails() {
    setDetailsTask(null);
  }

  /* ─── Quick actions builder ─── */

  function buildQuickActions(task: TaskSummary): QuickAction[] {
    const status = normalizeTaskStatus(task.status);
    const actions: QuickAction[] = [
      {
        key: 'edit',
        icon: 'pencil-outline',
        label: 'Edit',
        color: 'green' as const,
        onPress: () => openEditSheet(task),
      },
    ];

    if (status === 'pending') {
      actions.push({
        key: 'progress',
        icon: 'play-circle-outline',
        label: 'In Progress',
        color: 'blue' as const,
        onPress: () => void submitStatus(task, 'in_progress'),
      });
    }

    if (status !== 'completed') {
      actions.push({
        key: 'complete',
        icon: 'check-circle-outline',
        label: 'Complete',
        color: 'green' as const,
        onPress: () => void submitStatus(task, 'completed'),
      });
    }

    actions.push({
      key: 'delete',
      icon: 'delete-outline',
      label: 'Delete',
      color: 'red' as const,
      onPress: () => setDeletingTask(task),
    });

    return actions;
  }

  /* ─── RENDER ─── */

  return (
    <AppScreen padded={false}>
      {/* ─── Sticky Header ─── */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLead}>
            <HeaderMenuButton testID="tasks-header-menu" />
            <Text style={styles.headerTitle}>Tasks</Text>
          </View>
          <View style={styles.headerBtns}>
            <NotificationHeaderButton testID="tasks-header-notifications" />
            <HeaderIconButton icon="plus" onPress={openCreateSheet} filled />
          </View>
        </View>
        <SearchBar
          value={searchValue}
          onChangeText={setSearchValue}
          placeholder="Search by title or description..."
        />
      </View>

      {/* ─── Scrollable Main Content ─── */}
      <PullToRefreshContainer refreshing={isRefreshing} onRefresh={() => void refresh()}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.main}
          showsVerticalScrollIndicator={false}
        >
          {/* ─── Stats Strip ─── */}
          <StatStrip
            items={[
              { value: pendingCount, label: 'Pending', color: 'amber' },
              { value: inProgressCount, label: 'In Progress', color: 'green' },
              { value: overdueCount, label: 'Overdue', color: 'red' },
            ]}
          />

          {/* ─── Pill Tabs ─── */}
          <PillTabs
            value={listMode}
            onValueChange={(v) => setListMode(v as TaskListMode)}
            tabs={[
              { value: 'all', label: `All (${tasks.length})` },
              { value: 'pending', label: `Pending (${pendingCount})` },
              { value: 'in_progress', label: `Active (${inProgressCount})` },
              { value: 'completed', label: `Done (${completedCount})` },
            ]}
          />

          {/* ─── Section Header ─── */}
          <SectionHeader title="Tasks" trailing={`${filteredRows.length} items`} />

          {/* ─── Task List ─── */}
          {isLoading ? (
            <>
              <Skeleton height={68} />
              <Skeleton height={68} />
              <Skeleton height={68} />
            </>
          ) : errorMessage ? (
            <ErrorState message={errorMessage} onRetry={() => void refresh()} />
          ) : filteredRows.length === 0 ? (
            <EmptyState
              title="No tasks found"
              message="Try another search or filter, or create a new task."
              actionLabel="Create task"
              onAction={openCreateSheet}
            />
          ) : (
            filteredRows.map((task) => {
              const overdue = isTaskOverdue(task);
              const overdueDays = overdue && task.dueDate ? calcOverdueDays(task.dueDate) : 0;
              const dueLine = overdue
                ? `Overdue ${overdueDays} day${overdueDays === 1 ? '' : 's'}`
                : undefined;
              const subtitleDue = task.dueDate ? `Due ${toShortDate(task.dueDate)}` : 'No due date';

              return (
                <ListRow
                  key={task.id}
                  icon={toTaskIcon(task.status)}
                  iconVariant={toIconVariant(task.status)}
                  title={task.title}
                  subtitle={`${toPriorityLabel(task.priority)} · ${overdue ? 'Overdue' : subtitleDue}`}
                  badge={
                    <DotBadge
                      label={toStatusLabel(task.status)}
                      variant={toStatusVariant(task.status)}
                    />
                  }
                  overdueLine={dueLine}
                  accentBorder={overdue}
                  onPress={() => openTaskDetails(task)}
                />
              );
            })
          )}
        </ScrollView>
      </PullToRefreshContainer>

      {/* ════════════════════════════════════════
           DETAIL SHEET
           ════════════════════════════════════════ */}
      <BottomSheet
        visible={Boolean(detailsTask)}
        onDismiss={closeTaskDetails}
        title={detailsTask?.title ?? 'Task detail'}
      >
        {detailsTask && (
          <>
            {/* Profile Card */}
            <ProfileCard
              icon={toTaskIcon(detailsTask.status)}
              name={detailsTask.title}
              subtitle={`${toStatusLabel(detailsTask.status)} · ${toPriorityLabel(detailsTask.priority)} priority`}
              cells={[
                { label: 'Status', value: toStatusLabel(detailsTask.status) },
                { label: 'Priority', value: toPriorityLabel(detailsTask.priority) },
                { label: 'Due Date', value: toDateLabel(detailsTask.dueDate) },
                { label: 'Asset', value: detailsTask.assetLabel ?? 'None' },
              ]}
            />

            {/* Quick Actions */}
            <QuickActionGrid actions={buildQuickActions(detailsTask)} />

            {/* Underline Tabs */}
            <UnderlineTabs
              value={detailTab}
              onValueChange={(v) => setDetailTab(v as DetailTab)}
              tabs={[
                { value: 'comments', label: 'Comments' },
                { value: 'activity', label: 'Activity' },
              ]}
            />

            {/* Comments Tab */}
            {detailTab === 'comments' && (
              <>
                {detailsLoading ? (
                  <>
                    <Skeleton height={56} />
                    <Skeleton height={56} />
                  </>
                ) : detailsErrorMessage ? (
                  <ErrorState
                    message={detailsErrorMessage}
                    onRetry={() => void refreshDetails()}
                  />
                ) : comments.length === 0 ? (
                  <EmptyState
                    title="No comments"
                    message="No comments have been added to this task."
                  />
                ) : (
                  comments.map((comment) => (
                    <LogRow
                      key={comment.id || `${comment.message}-${comment.createdAt ?? 'now'}`}
                      title={comment.message}
                      date={toShortDate(comment.createdAt)}
                      chips={[{ label: 'By', value: comment.author ?? 'Unknown' }]}
                    />
                  ))
                )}
              </>
            )}

            {/* Activity Tab */}
            {detailTab === 'activity' && (
              <>
                {detailsLoading ? (
                  <>
                    <Skeleton height={56} />
                    <Skeleton height={56} />
                  </>
                ) : detailsErrorMessage ? (
                  <ErrorState
                    message={detailsErrorMessage}
                    onRetry={() => void refreshDetails()}
                  />
                ) : activity.length === 0 ? (
                  <EmptyState
                    title="No activity"
                    message="No activity entries are available for this task."
                  />
                ) : (
                  activity.map((entry) => (
                    <LogRow
                      key={entry.id || `${entry.action}-${entry.createdAt ?? 'now'}`}
                      title={entry.action}
                      date={toShortDate(entry.createdAt)}
                      chips={
                        entry.message ? [{ label: 'Detail', value: entry.message }] : undefined
                      }
                    />
                  ))
                )}
              </>
            )}
          </>
        )}
      </BottomSheet>

      {/* ════════════════════════════════════════
           CREATE / EDIT FORM SHEET
           ════════════════════════════════════════ */}
      <BottomSheet
        visible={formVisible}
        onDismiss={closeFormSheet}
        scrollViewRef={formScrollViewRef}
        title={formMode === 'create' ? 'New Task' : 'Edit Task'}
        footer={
          <View style={styles.formBtns}>
            <View style={styles.formBtnHalf}>
              <AppButton
                label="Cancel"
                mode="outlined"
                tone="neutral"
                onPress={closeFormSheet}
              />
            </View>
            <View style={styles.formBtnHalf}>
              <AppButton
                label={formMode === 'create' ? 'Create' : 'Save'}
                onPress={() => void submitForm()}
                loading={isMutating}
                disabled={isMutating}
              />
            </View>
          </View>
        }
      >
        <FormValidationProvider value={formValidation.providerValue}>
          <FormField label="Title" name="title" required>
            <AppInput
              value={formValues.title}
              onChangeText={(v) => {
                formValidation.clearFieldError('title');
                setFormValues((c) => ({ ...c, title: v }));
              }}
              placeholder="e.g. Fix irrigation pump in Field A"
            />
          </FormField>

          <FormField label="Description">
            <AppTextArea
              value={formValues.description}
              onChangeText={(v) => setFormValues((c) => ({ ...c, description: v }))}
              placeholder="Optional task details..."
            />
          </FormField>

          <FormField label="Status">
            <AppSelect
              value={formValues.status}
              onChange={(v) => setFormValues((c) => ({ ...c, status: normalizeTaskStatus(v) }))}
              options={TASK_STATUS_OPTIONS.map((o) => ({ label: o.label, value: o.value }))}
              label="Task status"
            />
          </FormField>

          <FormField label="Priority">
            <AppSelect
              value={formValues.priority}
              onChange={(v) =>
                setFormValues((c) => ({
                  ...c,
                  priority: v === 'low' || v === 'high' ? v : 'medium',
                }))
              }
              options={TASK_PRIORITY_OPTIONS.map((o) => ({ label: o.label, value: o.value }))}
              label="Task priority"
            />
          </FormField>

          <FormField label="Due date" name="dueDate">
            <AppDatePicker
              value={formValues.dueDate}
              onChange={(v) => {
                formValidation.clearFieldError('dueDate');
                setFormValues((c) => ({ ...c, dueDate: v }));
              }}
              label="Task due date"
            />
          </FormField>

          <FormField label="Asset">
            <AppSelect
              value={formValues.assetId ?? ''}
              onChange={(v) => setFormValues((c) => ({ ...c, assetId: v || null }))}
              options={assetSelectOptions}
              label="Task asset"
              placeholder="No asset selected"
            />
          </FormField>
        </FormValidationProvider>
      </BottomSheet>

      {/* ════════════════════════════════════════
           DELETE CONFIRM DIALOG
           ════════════════════════════════════════ */}
      <ConfirmDialog
        visible={Boolean(deletingTask)}
        title="Delete task?"
        message={`Delete "${deletingTask?.title ?? 'this task'}"? This cannot be undone.`}
        confirmLabel="Delete"
        confirmTone="destructive"
        onCancel={() => setDeletingTask(null)}
        onConfirm={() => void confirmDeleteTask()}
        confirmLoading={isMutating}
      />
    </AppScreen>
  );
}

/* ─── Styles ─── */

const styles = StyleSheet.create({
  /* Header */
  header: {
    backgroundColor: palette.surface,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
  },
  headerLead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
    color: palette.foreground,
  },
  headerBtns: {
    flexDirection: 'row',
    gap: 6,
  },

  /* Main content */
  scrollView: {
    flex: 1,
  },
  main: {
    padding: 16,
    paddingBottom: 96,
  },

  /* Form buttons */
  formBtns: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  formBtnHalf: {
    flex: 1,
  },
});
