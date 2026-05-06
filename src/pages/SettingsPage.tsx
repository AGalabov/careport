import { useState, useRef, useMemo } from 'react';
import { LogOut, Bell, BellOff, Car as CarIcon, Download, Upload, Plus, Trash2 } from 'lucide-react';
import { useCar } from '../contexts/CarContext';
import { useFuelRecords } from '../hooks/useFuelRecords';
import { useAuth } from '../contexts/AuthContext';
import { useAsyncAction } from '../hooks/use-async-action';
import { useTranslation } from '../contexts/I18nContext';
import CarForm from '../components/cars/CarForm';
import { requestNotificationPermission } from '../lib/notifications';
import type { Car } from '../types';
import type { SupportedLocale } from '../contexts/I18nContext';

function parseCSV(content: string): string[][] {
  const lines = content.trim().split('\n');
  const sep = lines[0].includes(';') ? ';' : ',';
  return lines.map((line) =>
    line.split(sep).map((cell) => cell.trim().replace(/^"|"$/g, '')),
  );
}

function parseNum(val: string): number {
  return Number(val.replace(/,(?=\d{3})/g, '').replace(/\s/g, ''));
}

export default function SettingsPage() {
  const { t, localeKey, locales, setLocale } = useTranslation();
  const { user, signOut } = useAuth();
  const { cars, activeCar, addCar, updateCar, deleteCar } = useCar();
  const { records, addRecord, deleteAllRecords } = useFuelRecords(activeCar?.id ?? null);
  const [showCarForm, setShowCarForm] = useState(false);
  const [editingCar, setEditingCar] = useState<Car | null>(null);
  const [notifGranted, setNotifGranted] = useState(
    'Notification' in window ? Notification.permission === 'granted' : false,
  );
  const [importDate, setImportDate] = useState(`${new Date().getFullYear()}-01-01`);
  const [importFuelType, setImportFuelType] = useState<'lpg' | 'petrol'>('lpg');
  const fileRef = useRef<HTMLInputElement>(null);

  const {
    loading: importing,
    data: importData,
    error: importError,
    trigger: triggerImport,
  } = useAsyncAction(async (file: File) => {
    const text = await file.text();
    const rows = parseCSV(text);
    const firstCell = rows[0][0].toLowerCase();
    const dataRows = isNaN(Number(firstCell)) ? rows.slice(1) : rows;
    const baseDate = new Date(importDate);

    let imported = 0;
    let skipped = 0;
    for (const row of dataRows) {
      const [odoStr, litersStr, priceLpgStr, pricePetrolStr, notes] = row;
      const odometer = parseNum(odoStr);
      const liters = parseNum(litersStr);
      const priceLpg = parseNum(priceLpgStr);
      const pricePetrol = parseNum(pricePetrolStr);

      if (isNaN(odometer) || isNaN(liters) || liters <= 0 || isNaN(priceLpg) || isNaN(pricePetrol)) {
        skipped++;
        continue;
      }
      const date = new Date(baseDate);
      date.setDate(date.getDate() + imported);
      await addRecord({ date, odometer, fuelType: importFuelType, liters, priceLpg, pricePetrol, notes: notes?.trim() });
      imported++;
    }
    return { imported, skipped };
  });

  const importResultText = useMemo(() => {
    if (importData) {
      return t('settings.importResult', {
        imported: String(importData.imported),
        skipped:
          importData.skipped > 0
            ? t('settings.importSkippedPart', { skipped: String(importData.skipped) })
            : '',
      });
    }
    if (importError) return t('settings.importFailed');
    return '';
  }, [importData, importError, t]);

  async function handleEnableNotifications() {
    const granted = await requestNotificationPermission();
    setNotifGranted(granted);
  }

  function exportCSV() {
    const header = 'date,odometer,fuel_type,liters,price_lpg,price_petrol,total_cost,notes';
    const rows = records.map((r) => {
      const d = r.date.toDate();
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      return [dateStr, r.odometer, r.fuelType, r.liters, r.priceLpg, r.pricePetrol, r.totalCost, r.notes ?? ''].join(',');
    });
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `careport-fuel-${activeCar?.name ?? 'export'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !activeCar) return;
    triggerImport(file);
    if (fileRef.current) fileRef.current.value = '';
  }

  function handleLocaleChange(next: SupportedLocale['key']) {
    setLocale(next);
  }

  return (
    <div className="px-4 pt-4 pb-6 max-w-lg mx-auto space-y-6">
      <section>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
          {t('settings.myCars')}
        </h3>
        <div className="space-y-2">
          {cars.map((car) => (
            <div
              key={car.id}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center justify-between"
            >
              <div>
                <div className="flex items-center gap-2">
                  <CarIcon size={15} className="text-indigo-600" />
                  <p className="text-sm font-medium text-gray-900">{car.name}</p>
                </div>
                {(car.make || car.model || car.year) && (
                  <p className="text-xs text-gray-400 mt-0.5 ml-5">
                    {[car.year, car.make, car.model].filter(Boolean).join(' ')}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingCar(car)}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  {t('common.edit')}
                </button>
                {cars.length > 1 && (
                  <button
                    onClick={() => deleteCar(car.id)}
                    className="text-xs text-red-500 hover:text-red-600 font-medium"
                  >
                    {t('common.delete')}
                  </button>
                )}
              </div>
            </div>
          ))}

          <button
            onClick={() => setShowCarForm(true)}
            className="w-full flex items-center justify-center gap-2 border border-dashed border-gray-300 hover:border-indigo-400 text-gray-500 hover:text-indigo-600 rounded-xl py-3 text-sm transition-colors"
          >
            <Plus size={16} />
            {t('settings.addAnotherCar')}
          </button>
        </div>
      </section>

      <section>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
          {t('settings.notifications')}
        </h3>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {notifGranted ? (
                <Bell size={16} className="text-green-600" />
              ) : (
                <BellOff size={16} className="text-gray-400" />
              )}
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {notifGranted ? t('settings.notificationsEnabled') : t('settings.notificationsDisabled')}
                </p>
                <p className="text-xs text-gray-400">
                  {notifGranted
                    ? t('settings.notificationsEnabledHint')
                    : t('settings.notificationsDisabledHint')}
                </p>
              </div>
            </div>
            {!notifGranted && (
              <button
                onClick={handleEnableNotifications}
                className="text-sm text-indigo-600 font-medium hover:text-indigo-700 ml-2"
              >
                {t('common.enable')}
              </button>
            )}
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
          {t('settings.language')}
        </h3>
        <p className="text-xs text-gray-400 mb-2">{t('settings.languageHint')}</p>
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          {locales.map((loc) => (
            <button
              key={loc.key}
              type="button"
              onClick={() => handleLocaleChange(loc.key)}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                localeKey === loc.key
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {loc.label}
            </button>
          ))}
        </div>
      </section>

      {activeCar && (
        <section>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            {t('settings.data')}
          </h3>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-100">
            <button
              onClick={async () => {
                if (
                  confirm(
                    t('settings.clearFuelConfirm', {
                      count: String(records.length),
                    }),
                  )
                ) {
                  await deleteAllRecords();
                }
              }}
              disabled={records.length === 0}
              className="w-full flex items-center gap-3 p-4 text-left hover:bg-red-50 disabled:opacity-50 transition-colors"
            >
              <Trash2 size={16} className="text-red-500" />
              <div>
                <p className="text-sm font-medium text-red-600">{t('settings.clearFuelTitle')}</p>
                <p className="text-xs text-gray-400">
                  {t('settings.clearFuelSubtitle', { count: String(records.length) })}
                </p>
              </div>
            </button>

            <button
              onClick={exportCSV}
              disabled={records.length === 0}
              className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              <Download size={16} className="text-indigo-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">{t('settings.exportTitle')}</p>
                <p className="text-xs text-gray-400">
                  {t('settings.exportSubtitle', { count: String(records.length) })}
                </p>
              </div>
            </button>

            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Upload size={16} className="text-indigo-600" />
                <p className="text-sm font-medium text-gray-900">{t('settings.importTitle')}</p>
              </div>
              <p className="text-xs text-gray-400">{t('settings.importHint')}</p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {t('settings.importDateLabel')}
                  </label>
                  <input
                    type="date"
                    value={importDate}
                    onChange={(e) => setImportDate(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {t('settings.importFuelTypeLabel')}
                  </label>
                  <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                    {(['lpg', 'petrol'] as const).map((ft) => (
                      <button
                        key={ft}
                        type="button"
                        onClick={() => setImportFuelType(ft)}
                        className={`flex-1 py-2 text-xs font-medium transition-colors ${
                          importFuelType === ft
                            ? ft === 'lpg' ? 'bg-indigo-600 text-white' : 'bg-amber-500 text-white'
                            : 'bg-white text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {ft === 'lpg' ? t('settings.importFuelLpg') : t('settings.importFuelPetrol')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <label
                className={`w-full flex items-center justify-center gap-2 border border-dashed rounded-lg py-2.5 text-sm font-medium transition-colors cursor-pointer ${importing ? 'opacity-50 cursor-not-allowed border-gray-200 text-gray-400' : 'border-indigo-300 text-indigo-600 hover:bg-indigo-50'}`}
              >
                <Upload size={15} />
                {importing ? t('settings.importing') : t('settings.chooseCsv')}
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleImport}
                  disabled={importing}
                />
              </label>

              {importResultText && (
                <p className="text-xs text-gray-600">{importResultText}</p>
              )}
            </div>
          </div>
        </section>
      )}

      <section>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
          {t('settings.account')}
        </h3>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-sm text-gray-600 mb-3">{user?.email}</p>
          <button
            onClick={signOut}
            className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 font-medium"
          >
            <LogOut size={15} />
            {t('common.signOut')}
          </button>
        </div>
      </section>

      {(showCarForm || editingCar) && (
        <CarForm
          initial={editingCar ?? undefined}
          onClose={() => {
            setShowCarForm(false);
            setEditingCar(null);
          }}
          onSubmit={editingCar ? (data) => updateCar(editingCar.id, data) : addCar}
        />
      )}
    </div>
  );
}
