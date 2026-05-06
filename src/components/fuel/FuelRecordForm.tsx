import { useState, useRef } from 'react';
import { format } from 'date-fns';
import { X, Calendar } from 'lucide-react';
import { useAsyncAction, getErrorMessage } from '../../hooks/use-async-action';
import { useTranslation } from '../../contexts/I18nContext';
import { getDateFnsLocale, getIntlLocale } from '../../lib/date-locale';
import type { FuelRecord, FuelType } from '../../types';
import type { AddRecordInput } from '../../hooks/useFuelRecords';

interface Props {
  onClose: () => void;
  onSubmit: (data: AddRecordInput) => Promise<void>;
  previousLpgOdometer?: number;
  previousPetrolOdometer?: number;
  initial?: FuelRecord;
}

export default function FuelRecordForm({
  onClose,
  onSubmit,
  previousLpgOdometer,
  previousPetrolOdometer,
  initial,
}: Props) {
  const { t, localeKey } = useTranslation();
  const dateLocale = getDateFnsLocale(localeKey);
  const intlLocale = getIntlLocale(localeKey);

  const fuelLabel = (ft: FuelType) =>
    ft === 'lpg' ? t('fuel.toggleLpg') : t('fuel.togglePetrol');

  const [date, setDate] = useState(
    initial
      ? format(initial.date.toDate(), 'yyyy-MM-dd')
      : format(new Date(), 'yyyy-MM-dd'),
  );
  const [fuelType, setFuelType] = useState<FuelType>(
    initial?.fuelType ?? 'lpg',
  );
  const [odometer, setOdometer] = useState(initial?.odometer?.toString() ?? '');
  const [liters, setLiters] = useState(initial?.liters?.toString() ?? '');
  const [priceLpg, setPriceLpg] = useState(initial?.priceLpg?.toString() ?? '');
  const [pricePetrol, setPricePetrol] = useState(
    initial?.pricePetrol?.toString() ?? '',
  );
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const dateInputRef = useRef<HTMLInputElement>(null);

  const prevOdometer =
    fuelType === 'lpg' ? previousLpgOdometer : previousPetrolOdometer;
  const kmDriven =
    prevOdometer && odometer ? Number(odometer) - prevOdometer : null;
  const lpg = parseFloat(priceLpg) || 0;
  const petrol = parseFloat(pricePetrol) || 0;
  const litersNum = parseFloat(liters) || 0;
  const filledPrice = fuelType === 'lpg' ? lpg : petrol;
  const totalCost = litersNum * filledPrice;
  const consumption =
    kmDriven && kmDriven > 0 && litersNum ? (litersNum / kmDriven) * 100 : null;
  const equivalent =
    consumption !== null && lpg > 0 && petrol > 0
      ? fuelType === 'lpg'
        ? consumption * (lpg / petrol)
        : consumption * (petrol / lpg)
      : null;
  const equivalentLabel =
    fuelType === 'lpg'
      ? t('fuel.form.equivalentLabelLpg')
      : t('fuel.form.equivalentLabelPetrol');

  const { loading: saving, error, trigger } = useAsyncAction(async () => {
    if (!date) throw new Error(t('fuel.form.errors.dateRequired'));
    if (!odometer || isNaN(Number(odometer))) {
      throw new Error(t('fuel.form.errors.odometerRequired'));
    }
    if (!liters || isNaN(Number(liters)) || Number(liters) <= 0) {
      throw new Error(t('fuel.form.errors.litersRequired'));
    }
    if (!priceLpg || isNaN(Number(priceLpg)) || Number(priceLpg) <= 0) {
      throw new Error(t('fuel.form.errors.priceLpgRequired'));
    }
    if (!pricePetrol || isNaN(Number(pricePetrol)) || Number(pricePetrol) <= 0) {
      throw new Error(t('fuel.form.errors.pricePetrolRequired'));
    }
    await onSubmit({
      date: new Date(date),
      odometer: Number(odometer),
      fuelType,
      liters: Number(liters),
      priceLpg: Number(priceLpg),
      pricePetrol: Number(pricePetrol),
      notes: notes.trim(),
    });
    onClose();
  });

  const errorMessage = getErrorMessage(error);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    trigger();
  }

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <h2 className="text-base font-semibold text-gray-900">
            {initial ? t('fuel.form.editTitle') : t('fuel.form.addTitle')}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-4 pb-6 space-y-4">
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            {(['lpg', 'petrol'] as FuelType[]).map((ft) => (
              <button
                key={ft}
                type="button"
                onClick={() => setFuelType(ft)}
                className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                  fuelType === ft
                    ? ft === 'lpg'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-amber-500 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {fuelLabel(ft)}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('fuel.form.dateLabel')}
            </label>
            <div
              onClick={() => {
                try {
                  dateInputRef.current?.showPicker();
                } catch {
                  dateInputRef.current?.focus();
                }
              }}
              className="relative flex items-center w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus-within:ring-2 focus-within:ring-indigo-500 cursor-pointer bg-white"
            >
              <span className="pointer-events-none text-gray-900 flex-1">
                {date === todayStr
                  ? t('common.today')
                  : (() => {
                      const [y, m, d] = date.split('-').map(Number);
                      return format(new Date(y, m - 1, d), 'dd MMM yyyy', { locale: dateLocale });
                    })()}
              </span>
              <Calendar size={18} className="text-gray-400 pointer-events-none" />
              <input
                ref={dateInputRef}
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('fuel.form.odometerLabel')}
            </label>
            {prevOdometer !== undefined && (
              <p className="text-xs text-gray-400 mb-1">
                {t('fuel.form.previousFill', { type: fuelLabel(fuelType) })}{' '}
                {prevOdometer.toLocaleString(intlLocale)} km
              </p>
            )}
            <input
              type="number"
              value={odometer}
              onChange={(e) => setOdometer(e.target.value)}
              placeholder={t('fuel.form.odometerPlaceholder')}
              min="0"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {kmDriven !== null && kmDriven > 0 && (
              <p className="text-xs text-indigo-600 mt-1">
                {t('fuel.form.kmSinceLast', {
                  km: kmDriven.toLocaleString(intlLocale),
                  type: fuelLabel(fuelType),
                })}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('fuel.form.litersLabel', { type: fuelLabel(fuelType) })}
            </label>
            <input
              type="number"
              value={liters}
              onChange={(e) => setLiters(e.target.value)}
              placeholder={t('fuel.form.literPlaceholder')}
              min="0"
              step="0.01"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('fuel.form.priceLpgLabel')}
              </label>
              <input
                type="number"
                value={priceLpg}
                onChange={(e) => setPriceLpg(e.target.value)}
                placeholder="0.80"
                min="0"
                step="0.001"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('fuel.form.pricePetrolLabel')}
              </label>
              <input
                type="number"
                value={pricePetrol}
                onChange={(e) => setPricePetrol(e.target.value)}
                placeholder="1.85"
                min="0"
                step="0.001"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {(totalCost > 0 || consumption !== null) && (
            <div className="bg-indigo-50 rounded-lg p-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              {totalCost > 0 && (
                <div>
                  <p className="text-xs text-gray-500">{t('fuel.form.totalCost')}</p>
                  <p className="font-semibold text-gray-900">
                    €{totalCost.toFixed(2)}
                  </p>
                </div>
              )}
              {consumption !== null && (
                <div>
                  <p className="text-xs text-gray-500">{t('fuel.form.consumption')}</p>
                  <p className="font-semibold text-gray-900">
                    {consumption.toFixed(2)}
                    {t('dashboard.consumptionUnit')}
                  </p>
                </div>
              )}
              {equivalent !== null && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-500">{equivalentLabel}</p>
                  <p className="font-semibold text-indigo-600">
                    {equivalent.toFixed(2)}
                    {t('dashboard.consumptionUnit')}
                  </p>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('fuel.form.notesLabel')}
              <span className="text-gray-400 font-normal">{t('fuel.form.notesOptional')}</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder={t('fuel.form.notesPlaceholder')}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium rounded-lg py-2.5 text-sm transition-colors"
          >
            {saving
              ? t('fuel.form.saving')
              : initial
                ? t('fuel.form.saveChanges')
                : t('fuel.form.logFillUp')}
          </button>
        </form>
      </div>
    </div>
  );
}
