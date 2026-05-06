import { useState } from 'react';
import { X } from 'lucide-react';
import { useAsyncAction } from '../../hooks/use-async-action';
import type { Car } from '../../types';

interface Props {
  onClose: () => void;
  onSubmit: (data: Omit<Car, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  initial?: Car;
}

export default function CarForm({ onClose, onSubmit, initial }: Props) {
  const [name, setName] = useState(initial?.name ?? '');
  const [make, setMake] = useState(initial?.make ?? '');
  const [model, setModel] = useState(initial?.model ?? '');
  const [year, setYear] = useState(initial?.year?.toString() ?? '');
  const [odometer, setOdometer] = useState(initial?.initialOdometer?.toString() ?? '');

  const { loading: saving, error, trigger } = useAsyncAction(async () => {
    if (!name.trim()) throw new Error('Name is required');
    if (!odometer || isNaN(Number(odometer))) throw new Error('Valid odometer reading is required');
    await onSubmit({
      name: name.trim(),
      make: make.trim() || undefined,
      model: model.trim() || undefined,
      year: year ? Number(year) : undefined,
      initialOdometer: Number(odometer),
    });
    onClose();
  });

  const errorMessage = error instanceof Error ? error.message : error ? String(error) : '';

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    trigger();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <h2 className="text-base font-semibold text-gray-900">
            {initial ? 'Edit Car' : 'Add Your Car'}
          </h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-4 pb-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Car name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. My Skoda, Daily Driver"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Make</label>
              <input
                type="text"
                value={make}
                onChange={(e) => setMake(e.target.value)}
                placeholder="e.g. Skoda"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="e.g. Octavia"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="2020"
                min="1980"
                max="2030"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current odometer (km) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={odometer}
                onChange={(e) => setOdometer(e.target.value)}
                placeholder="45000"
                min="0"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium rounded-lg py-2.5 text-sm transition-colors"
          >
            {saving ? 'Saving…' : initial ? 'Save Changes' : 'Add Car'}
          </button>
        </form>
      </div>
    </div>
  );
}
