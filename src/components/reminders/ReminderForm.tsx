import { useState } from 'react';
import { format } from 'date-fns';
import { X } from 'lucide-react';
import { useAsyncAction, getErrorMessage } from '../../hooks/use-async-action';
import { useTranslation } from '../../contexts/I18nContext';
import { getIntlLocale } from '../../lib/date-locale';
import type { Reminder } from '../../types';

interface Props {
  onClose: () => void;
  onSubmit: (data: Omit<Reminder, 'id' | 'userId' | 'carId' | 'createdAt'>) => Promise<void>;
  initial?: Reminder;
  currentOdometer?: number;
}

const KM_PRESETS = [2000, 1000, 500, 100];
const DAY_PRESETS = [30, 14, 7, 1];

function ThresholdSelector({
  presets,
  selected,
  onChange,
  unit,
  intlLocale,
}: {
  presets: number[];
  selected: number[];
  onChange: (vals: number[]) => void;
  unit: string;
  intlLocale: string;
}) {
  function toggle(val: number) {
    onChange(
      selected.includes(val) ? selected.filter((v) => v !== val) : [...selected, val].sort((a, b) => b - a),
    );
  }
  return (
    <div className="flex flex-wrap gap-2">
      {presets.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => toggle(p)}
          className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
            selected.includes(p)
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-400'
          }`}
        >
          {p.toLocaleString(intlLocale)} {unit}
        </button>
      ))}
    </div>
  );
}

export default function ReminderForm({ onClose, onSubmit, initial, currentOdometer }: Props) {
  const { t, localeKey } = useTranslation();
  const intlLocale = getIntlLocale(localeKey);

  const [name, setName] = useState(initial?.name ?? '');
  const [type, setType] = useState<'km' | 'date'>(initial?.type ?? 'km');
  const [intervalKm, setIntervalKm] = useState(initial?.intervalKm?.toString() ?? '10000');
  const [lastServiceKm, setLastServiceKm] = useState(
    initial?.lastServiceKm?.toString() ?? currentOdometer?.toString() ?? '',
  );
  const [alertBeforeKm, setAlertBeforeKm] = useState<number[]>(
    initial?.alertBeforeKm ?? [1000, 500, 100],
  );
  const [dueDate, setDueDate] = useState(
    initial?.dueDate ? format(initial.dueDate.toDate(), 'yyyy-MM-dd') : '',
  );
  const [alertBeforeDays, setAlertBeforeDays] = useState<number[]>(
    initial?.alertBeforeDays ?? [30, 7, 1],
  );
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);

  const { loading: saving, error, trigger } = useAsyncAction(async () => {
    if (!name.trim()) throw new Error(t('reminders.form.errors.nameRequired'));
    if (type === 'km') {
      if (!intervalKm || isNaN(Number(intervalKm)) || Number(intervalKm) <= 0) {
        throw new Error(t('reminders.form.errors.intervalRequired'));
      }
    } else {
      if (!dueDate) throw new Error(t('reminders.form.errors.dueDateRequired'));
    }
    const base = { name: name.trim(), type, isActive };
    if (type === 'km') {
      await onSubmit({
        ...base,
        intervalKm: Number(intervalKm),
        lastServiceKm: Number(lastServiceKm) || 0,
        alertBeforeKm,
        notifiedKmThresholds: initial?.notifiedKmThresholds ?? [],
      });
    } else {
      await onSubmit({
        ...base,
        dueDate: new Date(dueDate) as unknown as Reminder['dueDate'],
        alertBeforeDays,
        notifiedDayThresholds: initial?.notifiedDayThresholds ?? [],
      });
    }
    onClose();
  });

  const errorMessage = getErrorMessage(error);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    trigger();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <h2 className="text-base font-semibold text-gray-900">
            {initial ? t('reminders.form.editTitle') : t('reminders.form.addTitle')}
          </h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-4 pb-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('reminders.form.nameLabel')}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('reminders.form.namePlaceholder')}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('reminders.form.typeLabel')}
            </label>
            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
              {(['km', 'date'] as const).map((ty) => (
                <button
                  key={ty}
                  type="button"
                  onClick={() => setType(ty)}
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${
                    type === ty
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {ty === 'km' ? t('reminders.form.typeKm') : t('reminders.form.typeDate')}
                </button>
              ))}
            </div>
          </div>

          {type === 'km' ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('reminders.form.everyKmLabel')}
                  </label>
                  <input
                    type="number"
                    value={intervalKm}
                    onChange={(e) => setIntervalKm(e.target.value)}
                    placeholder="10000"
                    min="1"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('reminders.form.lastServiceKmLabel')}
                  </label>
                  <input
                    type="number"
                    value={lastServiceKm}
                    onChange={(e) => setLastServiceKm(e.target.value)}
                    placeholder={currentOdometer?.toString() ?? '0'}
                    min="0"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('reminders.form.alertKmLabel')}
                </label>
                <ThresholdSelector
                  presets={KM_PRESETS}
                  selected={alertBeforeKm}
                  onChange={setAlertBeforeKm}
                  unit={t('reminders.form.unitKm')}
                  intlLocale={intlLocale}
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('reminders.form.dueDateLabel')}
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('reminders.form.alertDaysLabel')}
                </label>
                <ThresholdSelector
                  presets={DAY_PRESETS}
                  selected={alertBeforeDays}
                  onChange={setAlertBeforeDays}
                  unit={t('reminders.form.unitDays')}
                  intlLocale={intlLocale}
                />
              </div>
            </>
          )}

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">{t('reminders.form.activeLabel')}</span>
            <button
              type="button"
              onClick={() => setIsActive((v) => !v)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isActive ? 'bg-indigo-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isActive ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium rounded-lg py-2.5 text-sm transition-colors"
          >
            {saving
              ? t('reminders.form.saving')
              : initial
                ? t('reminders.form.saveChanges')
                : t('reminders.form.addReminder')}
          </button>
        </form>
      </div>
    </div>
  );
}
