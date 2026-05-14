import { useState } from 'react';
import { Plus, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { useCar } from '../contexts/CarContext';
import { useFuelLog } from '../hooks/useFuelLog';
import { useReminders } from '../hooks/useReminders';
import FuelRecordForm from '../components/fuel/FuelRecordForm';
import FuelRecordItem from '../components/fuel/FuelRecordItem';
import { checkKmReminders } from '../lib/notifications';
import type { FuelRecord, FuelType } from '../types';
import type { AddRecordInput } from '../hooks/useFuelRecords';

export default function FuelLogPage() {
  const { activeCar } = useCar();
  const {
    availableYears,
    getYear,
    loadYear,
    isYearLoaded,
    yearLoading,
    loading,
    addRecord,
    updateRecord,
    deleteRecord,
  } = useFuelLog(activeCar?.id ?? null);
  const { reminders, updateReminder } = useReminders(activeCar?.id ?? null);

  const currentYear = new Date().getFullYear();
  const [expandedYears, setExpandedYears] = useState<Set<number>>(new Set([currentYear]));
  const [fuelType, setFuelType] = useState<FuelType>('lpg');
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<FuelRecord | null>(null);

  function toggleYear(year: number) {
    setExpandedYears((prev) => {
      const next = new Set(prev);
      if (next.has(year)) {
        next.delete(year);
      } else {
        next.add(year);
        if (!isYearLoaded(year)) loadYear(year);
      }
      return next;
    });
  }

  function prevSameTypeKilometersPassed(
    record: FuelRecord,
    yearRecords: FuelRecord[],
  ): number | undefined {
    const sameType = yearRecords.filter((r) => r.fuelType === record.fuelType);
    const idx = sameType.findIndex((r) => r.id === record.id);
    return sameType[idx + 1]?.kilometersPassed;
  }

  function latestKilometersPassedFor(ft: FuelType): number | undefined {
    for (const year of availableYears) {
      if (!isYearLoaded(year)) continue;
      const recs = getYear(year).filter((r) => r.fuelType === ft);
      if (recs.length > 0) return recs[0].kilometersPassed;
    }
    return undefined;
  }

  function prevKilometersPassedForEdit(record: FuelRecord, ft: FuelType): number | undefined {
    for (const year of availableYears) {
      if (!isYearLoaded(year)) continue;
      const sameType = getYear(year).filter((r) => r.fuelType === ft);
      const idx = sameType.findIndex((r) => r.id === record.id);
      if (idx >= 0) return sameType[idx + 1]?.kilometersPassed;
    }
    return undefined;
  }

  async function handleAdd(data: AddRecordInput) {
    await addRecord(data);
    if (activeCar) {
      await checkKmReminders(data.kilometersPassed, activeCar.id, reminders, updateReminder);
    }
    setShowAdd(false);
  }

  async function handleEdit(id: string, data: AddRecordInput) {
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
      <h2 className="text-base font-semibold text-gray-900 mb-4">Fuel Log</h2>

      {/* Fuel type toggle */}
      <div className="flex rounded-lg border border-gray-200 overflow-hidden mb-4">
        {(['lpg', 'petrol'] as FuelType[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setFuelType(t)}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              fuelType === t
                ? t === 'lpg'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-amber-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {t === 'lpg' ? 'LPG' : 'Petrol'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 size={24} className="text-indigo-500 animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {availableYears.map((year) => {
            const isExpanded = expandedYears.has(year);
            const loaded = isYearLoaded(year);
            const isLoadingYear = yearLoading.has(year);
            const yearRecords = isExpanded && loaded
              ? getYear(year).filter((r) => r.fuelType === fuelType)
              : [];

            return (
              <div key={year}>
                <button
                  type="button"
                  onClick={() => toggleYear(year)}
                  className="w-full flex items-center gap-3 py-2 group"
                >
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    {year}
                  </span>
                  <div className="flex-1 h-px bg-gray-200 group-hover:bg-gray-300 transition-colors" />
                  {isLoadingYear ? (
                    <Loader2 size={14} className="text-indigo-500 animate-spin" />
                  ) : isExpanded ? (
                    <ChevronDown size={14} className="text-gray-400" />
                  ) : (
                    <ChevronRight size={14} className="text-gray-400" />
                  )}
                </button>

                {isExpanded && !isLoadingYear && (
                  <div className="space-y-2 mb-2">
                    {yearRecords.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-4">
                        No {fuelType.toUpperCase()} fill-ups for {year}
                      </p>
                    ) : (
                      yearRecords.map((record) => (
                        <FuelRecordItem
                          key={record.id}
                          record={record}
                          previousSameTypeKilometersPassed={prevSameTypeKilometersPassed(
                            record,
                            getYear(year),
                          )}
                          onEdit={() => setEditing(record)}
                          onDelete={() => handleDelete(record.id)}
                        />
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

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
          previousLpgKilometersPassed={latestKilometersPassedFor('lpg')}
          previousPetrolKilometersPassed={latestKilometersPassedFor('petrol')}
        />
      )}

      {editing && (
        <FuelRecordForm
          initial={editing}
          onClose={() => setEditing(null)}
          onSubmit={(data) => handleEdit(editing.id, data)}
          previousLpgKilometersPassed={prevKilometersPassedForEdit(editing, 'lpg')}
          previousPetrolKilometersPassed={prevKilometersPassedForEdit(editing, 'petrol')}
        />
      )}
    </div>
  );
}
