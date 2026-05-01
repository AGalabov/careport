import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useCar } from '../contexts/CarContext';
import { useFuelRecords } from '../hooks/useFuelRecords';
import { useReminders } from '../hooks/useReminders';
import FuelRecordForm from '../components/fuel/FuelRecordForm';
import FuelRecordItem from '../components/fuel/FuelRecordItem';
import { checkKmReminders } from '../lib/notifications';
import type { FuelRecord } from '../types';

export default function FuelLogPage() {
  const { activeCar } = useCar();
  const { records, loading, addRecord, updateRecord, deleteRecord } = useFuelRecords(
    activeCar?.id ?? null,
  );
  const { reminders, updateReminder } = useReminders(activeCar?.id ?? null);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<FuelRecord | null>(null);

  async function handleAdd(data: Parameters<typeof addRecord>[0]) {
    await addRecord(data);
    if (activeCar) {
      await checkKmReminders(data.odometer, activeCar.id, reminders, updateReminder);
    }
    setShowAdd(false);
  }

  async function handleEdit(id: string, data: Parameters<typeof updateRecord>[1]) {
    await updateRecord(id, data);
    setEditing(null);
  }

  async function handleDelete(id: string) {
    if (confirm('Delete this fill-up record?')) {
      await deleteRecord(id);
    }
  }

  return (
    <div className="px-4 pt-4 pb-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-900">
          Fuel Log
          {records.length > 0 && (
            <span className="ml-2 text-xs font-normal text-gray-400">{records.length} records</span>
          )}
        </h2>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-400 text-sm">Loading…</div>
      ) : records.length === 0 ? (
        <div className="text-center py-10 text-gray-400 text-sm">
          No records yet. Tap + to log your first fill-up.
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((record, i) => (
            <FuelRecordItem
              key={record.id}
              record={record}
              previousOdometer={records[i + 1]?.odometer}
              onEdit={() => setEditing(record)}
              onDelete={() => handleDelete(record.id)}
            />
          ))}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setShowAdd(true)}
        className="fixed bottom-20 right-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-4 shadow-lg transition-colors z-30"
        aria-label="Add fill-up"
      >
        <Plus size={22} />
      </button>

      {showAdd && (
        <FuelRecordForm
          onClose={() => setShowAdd(false)}
          onSubmit={handleAdd}
          previousOdometer={records[0]?.odometer}
        />
      )}

      {editing && (
        <FuelRecordForm
          initial={editing}
          onClose={() => setEditing(null)}
          onSubmit={(data) => handleEdit(editing.id, data)}
          previousOdometer={
            records[records.findIndex((r) => r.id === editing.id) + 1]?.odometer
          }
        />
      )}
    </div>
  );
}
