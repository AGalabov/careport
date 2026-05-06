import { format } from 'date-fns';
import { Pencil, Trash2, CheckCircle2 } from 'lucide-react';
import { useTranslation } from '../../contexts/I18nContext';
import { getDateFnsLocale, getIntlLocale } from '../../lib/date-locale';
import type { Reminder } from '../../types';

interface Props {
  reminder: Reminder;
  currentOdometer?: number;
  onEdit: () => void;
  onDelete: () => void;
  onMarkServiced?: () => void;
}

const colorMap = {
  green: 'bg-green-50 text-green-700 border-green-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  red: 'bg-red-50 text-red-700 border-red-200',
  gray: 'bg-gray-50 text-gray-500 border-gray-200',
};

export default function ReminderItem({ reminder, currentOdometer, onEdit, onDelete, onMarkServiced }: Props) {
  const { t, localeKey } = useTranslation();
  const dateLocale = getDateFnsLocale(localeKey);
  const intlLocale = getIntlLocale(localeKey);

  let status: { label: string; color: keyof typeof colorMap };

  if (!reminder.isActive) {
    status = { label: t('reminders.item.inactive'), color: 'gray' };
  } else if (reminder.type === 'km' && currentOdometer !== undefined) {
    const { intervalKm = 0, lastServiceKm = 0, alertBeforeKm = [] } = reminder;
    if (!intervalKm) {
      status = { label: t('reminders.item.configured'), color: 'gray' };
    } else {
      const nextDueKm = lastServiceKm + intervalKm;
      const kmRemaining = nextDueKm - currentOdometer;
      const minThreshold = Math.max(...alertBeforeKm);
      if (kmRemaining <= 0) {
        status = { label: t('reminders.item.overdue'), color: 'red' };
      } else if (kmRemaining <= minThreshold) {
        status = {
          label: t('reminders.item.kmRemainingApprox', {
            km: Math.round(kmRemaining).toLocaleString(intlLocale),
          }),
          color: 'amber',
        };
      } else {
        status = {
          label: t('reminders.item.kmRemaining', {
            km: Math.round(kmRemaining).toLocaleString(intlLocale),
          }),
          color: 'green',
        };
      }
    }
  } else if (reminder.type === 'date' && reminder.dueDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = reminder.dueDate.toDate();
    due.setHours(0, 0, 0, 0);
    const days = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const minThreshold = Math.max(...(reminder.alertBeforeDays ?? []));
    if (days < 0) {
      status = { label: t('reminders.item.overdue'), color: 'red' };
    } else if (days === 0) {
      status = { label: t('reminders.item.dueToday'), color: 'red' };
    } else if (days <= minThreshold) {
      status = { label: t('reminders.item.daysShort', { days }), color: 'amber' };
    } else {
      status = { label: t('reminders.item.daysShort', { days }), color: 'green' };
    }
  } else {
    status = { label: t('reminders.item.active'), color: 'green' };
  }

  const kmDetail =
    reminder.type === 'km' ? (
      <>
        {t('reminders.item.everyKm', {
          interval: (reminder.intervalKm ?? 0).toLocaleString(intlLocale),
        })}
        {reminder.lastServiceKm !== undefined
          ? t('reminders.item.lastAtKm', {
              km: reminder.lastServiceKm.toLocaleString(intlLocale),
            })
          : null}
      </>
    ) : reminder.dueDate ? (
      `${t('reminders.item.duePrefix')}${format(reminder.dueDate.toDate(), 'dd MMM yyyy', { locale: dateLocale })}`
    ) : null;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-gray-900 truncate">{reminder.name}</p>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${colorMap[status.color]}`}
            >
              {status.label}
            </span>
          </div>

          {kmDetail && <p className="text-xs text-gray-400 mt-0.5">{kmDetail}</p>}
        </div>

        <div className="flex gap-1 ml-2">
          {reminder.type === 'km' && onMarkServiced && (
            <button
              onClick={onMarkServiced}
              title={t('reminders.item.markServicedTitle')}
              className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            >
              <CheckCircle2 size={15} />
            </button>
          )}
          <button
            onClick={onEdit}
            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
