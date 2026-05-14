import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Plus, Fuel, Bell } from 'lucide-react';
import { useCar } from '../contexts/CarContext';
import { useFuelRecords } from '../hooks/useFuelRecords';
import { useReminders } from '../hooks/useReminders';
import FuelRecordForm from '../components/fuel/FuelRecordForm';
import { checkKmReminders, checkDateReminders, requestNotificationPermission } from '../lib/notifications';
import type { Reminder, FuelRecord } from '../types';
import type { AddRecordInput } from '../hooks/useFuelRecords';

function getReminderUrgency(
  r: Reminder,
  kilometersPassed?: number,
): 'ok' | 'warn' | 'danger' | 'inactive' {
  if (!r.isActive) return 'inactive';
  if (r.type === 'km' && kilometersPassed !== undefined) {
    const nextDue = (r.lastServiceKm ?? 0) + (r.intervalKm ?? 0);
    const remaining = nextDue - kilometersPassed;
    const minThreshold = r.alertBeforeKm?.length ? Math.max(...r.alertBeforeKm) : 0;
    if (remaining <= 0) return 'danger';
    if (remaining <= minThreshold) return 'warn';
    return 'ok';
  }
  if (r.type === 'date' && r.dueDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = r.dueDate.toDate();
    due.setHours(0, 0, 0, 0);
    const days = Math.ceil((due.getTime() - today.getTime()) / 86400000);
    const minThreshold = r.alertBeforeDays?.length ? Math.max(...r.alertBeforeDays) : 0;
    if (days <= 0) return 'danger';
    if (days <= minThreshold) return 'warn';
    return 'ok';
  }
  return 'ok';
}

const urgencyDot: Record<string, string> = {
  ok: 'bg-green-500',
  warn: 'bg-amber-500',
  danger: 'bg-red-500',
  inactive: 'bg-gray-300',
};

function LastFillCard({ record, prev }: { record: FuelRecord; prev?: FuelRecord }) {
  const kmDriven = prev ? record.kilometersPassed - prev.kilometersPassed : null;
  const consumption = kmDriven && kmDriven > 0 ? (record.liters / kmDriven) * 100 : null;
  const equivalent =
    consumption !== null && record.priceLpg > 0 && record.pricePetrol > 0
      ? record.fuelType === 'lpg'
        ? consumption * (record.priceLpg / record.pricePetrol)
        : consumption * (record.pricePetrol / record.priceLpg)
      : null;
  const typeLabel = record.fuelType.toUpperCase();
  const equivLabel = record.fuelType === 'lpg' ? 'Petrol equiv.' : 'LPG equiv.';

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-center gap-2 mb-3">
        <Fuel size={16} className="text-indigo-600" />
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          Last {typeLabel} Fill-Up
        </span>
        <span
          className={`ml-auto text-xs font-semibold px-1.5 py-0.5 rounded ${
            record.fuelType === 'lpg'
              ? 'bg-indigo-100 text-indigo-700'
              : 'bg-amber-100 text-amber-700'
          }`}
        >
          {typeLabel}
        </span>
      </div>
      <p className="text-2xl font-bold text-gray-900 mb-0.5">
        {record.kilometersPassed.toLocaleString()} km
      </p>
      <p className="text-xs text-gray-400 mb-3">{format(record.date.toDate(), 'dd MMM yyyy')}</p>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
        <div>
          <span className="text-gray-400">Filled </span>
          <span className="font-medium text-gray-700">{record.liters.toFixed(2)} L</span>
        </div>
        <div>
          <span className="text-gray-400">Cost </span>
          <span className="font-medium text-gray-700">€{record.totalCost.toFixed(2)}</span>
        </div>
        {consumption !== null && (
          <div>
            <span className="text-gray-400">Consumption </span>
            <span className="font-medium text-indigo-600">{consumption.toFixed(2)} L/100km</span>
          </div>
        )}
        {equivalent !== null && (
          <div>
            <span className="text-gray-400">{equivLabel} </span>
            <span className="font-medium text-gray-500">{equivalent.toFixed(2)} L/100km</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { activeCar, cars } = useCar();
  const { records, addRecord } = useFuelRecords(activeCar?.id ?? null);
  const { reminders, updateReminder } = useReminders(activeCar?.id ?? null);
  const [showForm, setShowForm] = useState(false);

  const lpgRecords = records.filter((r) => r.fuelType === 'lpg');
  const petrolRecords = records.filter((r) => r.fuelType === 'petrol');
  const latestLpg = lpgRecords[0];
  const latestPetrol = petrolRecords[0];
  const latestKilometersPassed = records[0]?.kilometersPassed;

  useEffect(() => {
    if (reminders.length > 0) {
      checkDateReminders(reminders, updateReminder);
    }
  }, [reminders.length]);

  async function handleAddRecord(data: AddRecordInput) {
    await addRecord(data);
    await checkKmReminders(data.kilometersPassed, activeCar!.id, reminders, updateReminder);
    setShowForm(false);
  }

  if (cars.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] px-4 text-center">
        <p className="text-gray-500 mb-4">Add your car to get started</p>
        <button
          onClick={() => navigate('/settings')}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          Go to Settings
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 pt-4 pb-6 max-w-lg mx-auto space-y-4">
      {latestLpg ? (
        <LastFillCard record={latestLpg} prev={lpgRecords[1]} />
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center text-sm text-gray-400">
          No LPG fill-ups yet — log your first one below
        </div>
      )}

      {latestPetrol && (
        <LastFillCard record={latestPetrol} prev={petrolRecords[1]} />
      )}

      {reminders.filter((r) => r.isActive).length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Bell size={16} className="text-indigo-600" />
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Reminders
              </span>
            </div>
            <button
              onClick={() => navigate('/reminders')}
              className="text-xs text-indigo-600 hover:text-indigo-700"
            >
              View all
            </button>
          </div>
          <div className="space-y-2">
            {reminders
              .filter((r) => r.isActive)
              .sort((a, b) => {
                const order = { danger: 0, warn: 1, ok: 2, inactive: 3 };
                return (
                  order[getReminderUrgency(a, latestKilometersPassed)] -
                  order[getReminderUrgency(b, latestKilometersPassed)]
                );
              })
              .slice(0, 4)
              .map((r) => {
                const urg = getReminderUrgency(r, latestKilometersPassed);
                return (
                  <div key={r.id} className="flex items-center gap-2.5">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${urgencyDot[urg]}`} />
                    <span className="text-sm text-gray-700 truncate">{r.name}</span>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      <button
        onClick={async () => {
          await requestNotificationPermission();
          setShowForm(true);
        }}
        className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl py-3.5 shadow-sm transition-colors"
      >
        <Plus size={18} />
        Log Fill-Up
      </button>

      {showForm && (
        <FuelRecordForm
          onClose={() => setShowForm(false)}
          onSubmit={handleAddRecord}
          previousLpgKilometersPassed={latestLpg?.kilometersPassed}
          previousPetrolKilometersPassed={latestPetrol?.kilometersPassed}
        />
      )}
    </div>
  );
}
