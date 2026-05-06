import type { Reminder } from '../types';

export type ReminderNotificationCopy = {
  kmOverdueBody: string;
  kmRemainingBody: (km: number) => string;
  dateDueTodayBody: string;
  dateDueInOneDayBody: string;
  dateDueInDaysBody: (days: number) => string;
};

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

async function showNotification(title: string, body: string): Promise<void> {
  if (Notification.permission !== 'granted') return;
  if ('serviceWorker' in navigator) {
    const reg = await navigator.serviceWorker.getRegistration();
    if (reg) {
      await reg.showNotification(title, { body, icon: '/icon.svg' });
      return;
    }
  }
  new Notification(title, { body, icon: '/icon.svg' });
}

export async function checkKmReminders(
  currentOdometer: number,
  carId: string,
  reminders: Reminder[],
  updateReminder: (id: string, data: Partial<Omit<Reminder, 'id'>>) => Promise<void>,
  copy: ReminderNotificationCopy,
): Promise<void> {
  const kmReminders = reminders.filter(
    (r) => r.isActive && r.type === 'km' && r.carId === carId,
  );

  for (const reminder of kmReminders) {
    const {
      intervalKm = 0,
      lastServiceKm = 0,
      alertBeforeKm = [],
      notifiedKmThresholds = [],
    } = reminder;
    if (!intervalKm) continue;

    const nextDueKm = lastServiceKm + intervalKm;
    const kmRemaining = nextDueKm - currentOdometer;
    const newlyNotified: number[] = [];

    for (const threshold of alertBeforeKm) {
      if (!notifiedKmThresholds.includes(threshold) && kmRemaining <= threshold) {
        const body =
          kmRemaining <= 0
            ? copy.kmOverdueBody
            : copy.kmRemainingBody(Math.round(kmRemaining));
        await showNotification(reminder.name, body);
        newlyNotified.push(threshold);
      }
    }

    if (newlyNotified.length > 0) {
      await updateReminder(reminder.id, {
        notifiedKmThresholds: [...notifiedKmThresholds, ...newlyNotified],
      });
    }
  }
}

export async function checkDateReminders(
  reminders: Reminder[],
  updateReminder: (id: string, data: Partial<Omit<Reminder, 'id'>>) => Promise<void>,
  copy: ReminderNotificationCopy,
): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const msPerDay = 1000 * 60 * 60 * 24;

  const dateReminders = reminders.filter(
    (r) => r.isActive && r.type === 'date' && r.dueDate,
  );

  for (const reminder of dateReminders) {
    const dueDate = reminder.dueDate!.toDate();
    dueDate.setHours(0, 0, 0, 0);
    const daysRemaining = Math.ceil((dueDate.getTime() - today.getTime()) / msPerDay);
    if (daysRemaining < 0) continue;

    const thresholds = reminder.alertBeforeDays ?? [];
    const notified = reminder.notifiedDayThresholds ?? [];
    const newlyNotified: number[] = [];

    for (const threshold of thresholds) {
      if (!notified.includes(threshold) && daysRemaining <= threshold) {
        const body =
          daysRemaining === 0
            ? copy.dateDueTodayBody
            : daysRemaining === 1
              ? copy.dateDueInOneDayBody
              : copy.dateDueInDaysBody(daysRemaining);
        await showNotification(reminder.name, body);
        newlyNotified.push(threshold);
      }
    }

    if (newlyNotified.length > 0) {
      await updateReminder(reminder.id, {
        notifiedDayThresholds: [...notified, ...newlyNotified],
      });
    }
  }
}
