import { format } from 'date-fns';
import { Trash2, Pencil } from 'lucide-react';
import type { FuelRecord } from '../../types';

interface Props {
  record: FuelRecord;
  previousOdometer?: number;
  onEdit: () => void;
  onDelete: () => void;
}

export default function FuelRecordItem({ record, previousOdometer, onEdit, onDelete }: Props) {
  const kmDriven =
    previousOdometer !== undefined ? record.odometer - previousOdometer : null;
  const consumption =
    kmDriven !== null && kmDriven > 0
      ? (record.liters / kmDriven) * 100
      : null;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-400 mb-0.5">
            {format(record.date.toDate(), 'dd MMM yyyy')}
          </p>
          <p className="text-base font-semibold text-gray-900">
            {record.odometer.toLocaleString()} km
          </p>
        </div>
        <div className="flex gap-1">
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

      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
        <span>{record.liters.toFixed(2)} L</span>
        <span>€{record.pricePerLiter.toFixed(3)}/L</span>
        <span className="font-medium text-gray-900">€{record.totalCost.toFixed(2)}</span>
        {consumption !== null && (
          <span className="text-indigo-600 font-medium">
            {consumption.toFixed(2)} L/100km
          </span>
        )}
        {kmDriven !== null && kmDriven > 0 && (
          <span className="text-gray-400">{kmDriven.toLocaleString()} km driven</span>
        )}
      </div>

      {record.notes && (
        <p className="mt-2 text-xs text-gray-400 italic">{record.notes}</p>
      )}
    </div>
  );
}
