import { useState, useRef } from 'react';
import { LogOut, Bell, BellOff, Car as CarIcon, Download, Upload, Plus } from 'lucide-react';
import { useCar } from '../contexts/CarContext';
import { useFuelRecords } from '../hooks/useFuelRecords';
import { useAuth } from '../contexts/AuthContext';
import CarForm from '../components/cars/CarForm';
import { requestNotificationPermission } from '../lib/notifications';
import type { Car } from '../types';

function parseCSV(content: string): string[][] {
  return content
    .trim()
    .split('\n')
    .map((line) =>
      line.split(',').map((cell) => cell.trim().replace(/^"|"$/g, '')),
    );
}

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const { cars, activeCar, addCar, updateCar, deleteCar } = useCar();
  const { records, addRecord } = useFuelRecords(activeCar?.id ?? null);
  const [showCarForm, setShowCarForm] = useState(false);
  const [editingCar, setEditingCar] = useState<Car | null>(null);
  const [notifGranted, setNotifGranted] = useState(
    'Notification' in window ? Notification.permission === 'granted' : false,
  );
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

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

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !activeCar) return;
    setImporting(true);
    setImportResult('');
    try {
      const text = await file.text();
      const rows = parseCSV(text);
      const firstCell = rows[0][0].toLowerCase();
      const dataRows = firstCell.includes('date') || firstCell.includes('km') || firstCell.includes('odo')
        ? rows.slice(1)
        : rows;

      let imported = 0;
      let skipped = 0;
      for (const row of dataRows) {
        // Columns: date, odometer, fuel_type, liters, price_lpg, price_petrol, [total_cost], [notes]
        const [dateStr, odoStr, fuelTypeRaw, litersStr, priceLpgStr, pricePetrolStr, , notes] = row;
        const odometer = Number(odoStr);
        const liters = Number(litersStr);
        const priceLpg = Number(priceLpgStr);
        const pricePetrol = Number(pricePetrolStr);
        const fuelType = fuelTypeRaw?.toLowerCase().trim() === 'petrol' ? 'petrol' : 'lpg';

        // Date is optional — default to Jan 1 of current year if missing/invalid
        let date = new Date(dateStr);
        if (isNaN(date.getTime())) date = new Date(`${new Date().getFullYear()}-01-01`);

        if (isNaN(odometer) || isNaN(liters) || liters <= 0 || isNaN(priceLpg) || isNaN(pricePetrol)) {
          skipped++;
          continue;
        }
        await addRecord({ date, odometer, fuelType, liters, priceLpg, pricePetrol, notes: notes?.trim() });
        imported++;
      }
      setImportResult(`Imported ${imported} records${skipped > 0 ? `, skipped ${skipped} invalid rows` : ''}.`);
    } catch {
      setImportResult('Import failed. Check the file format.');
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <div className="px-4 pt-4 pb-6 max-w-lg mx-auto space-y-6">
      {/* Cars */}
      <section>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
          My Cars
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
                  Edit
                </button>
                {cars.length > 1 && (
                  <button
                    onClick={() => deleteCar(car.id)}
                    className="text-xs text-red-500 hover:text-red-600 font-medium"
                  >
                    Delete
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
            Add another car
          </button>
        </div>
      </section>

      {/* Notifications */}
      <section>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
          Notifications
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
                  {notifGranted ? 'Notifications enabled' : 'Notifications disabled'}
                </p>
                <p className="text-xs text-gray-400">
                  {notifGranted
                    ? 'You will be alerted for upcoming reminders'
                    : 'Enable to get fuel & maintenance alerts'}
                </p>
              </div>
            </div>
            {!notifGranted && (
              <button
                onClick={handleEnableNotifications}
                className="text-sm text-indigo-600 font-medium hover:text-indigo-700 ml-2"
              >
                Enable
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Data */}
      {activeCar && (
        <section>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Data
          </h3>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-100">
            <button
              onClick={exportCSV}
              disabled={records.length === 0}
              className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              <Download size={16} className="text-indigo-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Export fuel log</p>
                <p className="text-xs text-gray-400">{records.length} records as CSV</p>
              </div>
            </button>

            <label className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 cursor-pointer transition-colors">
              <Upload size={16} className="text-indigo-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Import from CSV</p>
                <p className="text-xs text-gray-400">
                  Columns: date, odometer, fuel_type, liters, price_lpg, price_petrol, …
                </p>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleImport}
                disabled={importing}
              />
            </label>

            {importResult && (
              <div className="px-4 py-2 text-xs text-gray-600 bg-gray-50">{importResult}</div>
            )}
          </div>
        </section>
      )}

      {/* Account */}
      <section>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
          Account
        </h3>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-sm text-gray-600 mb-3">{user?.email}</p>
          <button
            onClick={signOut}
            className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 font-medium"
          >
            <LogOut size={15} />
            Sign out
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
