export type NotificationFormValues = {
  title: string;
  message: string;
  type: string;
};

export const NOTIFICATION_TYPE_OPTIONS = [
  { value: 'task_assigned', label: 'Task Assigned' },
  { value: 'task_updated', label: 'Task Updated' },
  { value: 'task_status_changed', label: 'Task Status Changed' },
  { value: 'task_commented', label: 'Task Commented' },
  { value: 'task_due', label: 'Task Due' },
  { value: 'weather_alert', label: 'Weather Alert' },
  { value: 'order_received', label: 'Order Received' },
  { value: 'low_stock', label: 'Low Stock' },
] as const;

export function toNotificationFormValues(): NotificationFormValues {
  return {
    title: '',
    message: '',
    type: 'task_due',
  };
}

export function toReadAtNow(): string {
  return new Date().toISOString();
}
