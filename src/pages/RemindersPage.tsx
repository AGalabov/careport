import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useCar } from '../contexts/CarContext';
import { useFuelRecords } from '../hooks/useFuelRecords';
import { useReminders } from '../hooks/useReminders';
import { useTranslation } from '../contexts/I18nContext';
import ReminderForm from '../components/reminders/ReminderForm';
import ReminderItem from '../components/reminders/ReminderItem';
import type { Reminder } from '../types';

export default function RemindersPage() {
  const { t } = useTranslation();
  const { activeCar } = useCar();
  const { records } = useFuelRecords(activeCar?.id ?? null);
  const { reminders, loading, addReminder, updateReminder, deleteReminder, markServiced } =
    useReminders(activeCar?.id ?? null);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Reminder | null>(null);

  const latestOdometer = records[0]?.odometer;

  async function handleDelete(id: string) {
    if (confirm(t('reminders.deleteConfirm'))) {
      await deleteReminder(id);
    }
  }

  return (
    <div className="px-4 pt-4 pb-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-900">{t('reminders.pageTitle')}</h2>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-400 text-sm">{t('reminders.loading')}</div>
      ) : reminders.length === 0 ? (
        <div className="text-center py-10 text-gray-400 text-sm">{t('reminders.empty')}</div>
      ) : (
        <div className="space-y-3">
          {reminders.map((reminder) => (
            <ReminderItem
              key={reminder.id}
              reminder={reminder}
              currentOdometer={latestOdometer}
              onEdit={() => setEditing(reminder)}
              onDelete={() => handleDelete(reminder.id)}
              onMarkServiced={
                reminder.type === 'km' && latestOdometer !== undefined
                  ? () => markServiced(reminder.id, latestOdometer)
                  : undefined
              }
            />
          ))}
        </div>
      )}

      <button
        onClick={() => setShowAdd(true)}
        className="fixed bottom-20 right-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-4 shadow-lg transition-colors z-30"
        aria-label={t('reminders.fabAddLabel')}
      >
        <Plus size={22} />
      </button>

      {showAdd && (
        <ReminderForm
          onClose={() => setShowAdd(false)}
          onSubmit={addReminder}
          currentOdometer={latestOdometer}
        />
      )}

      {editing && (
        <ReminderForm
          initial={editing}
          onClose={() => setEditing(null)}
          onSubmit={(data) => updateReminder(editing.id, data).then(() => setEditing(null))}
          currentOdometer={latestOdometer}
        />
      )}
    </div>
  );
}
