import type { Timestamp } from 'firebase/firestore';
import type { Car, FuelRecord } from '../types';

type Raw = Record<string, unknown>;

/** Maps legacy `odometer` / optional `kilometersPassed` Firestore fields to app model. */
export function fuelRecordFromFirestore(id: string, raw: Raw): FuelRecord {
  const kilometersPassed =
    typeof raw.kilometersPassed === 'number'
      ? raw.kilometersPassed
      : typeof raw.odometer === 'number'
        ? raw.odometer
        : 0;
  return {
    id,
    carId: String(raw.carId),
    userId: String(raw.userId),
    date: raw.date as Timestamp,
    kilometersPassed,
    fuelType: raw.fuelType as FuelRecord['fuelType'],
    liters: Number(raw.liters),
    priceLpg: Number(raw.priceLpg),
    pricePetrol: Number(raw.pricePetrol),
    totalCost: Number(raw.totalCost),
    notes: raw.notes ? String(raw.notes) : undefined,
    createdAt: raw.createdAt as Timestamp,
  };
}

/** Maps legacy `initialOdometer` / optional `initialKilometersPassed` Firestore fields. */
export function carFromFirestore(id: string, raw: Raw): Car {
  const initialKilometersPassed =
    typeof raw.initialKilometersPassed === 'number'
      ? raw.initialKilometersPassed
      : typeof raw.initialOdometer === 'number'
        ? raw.initialOdometer
        : 0;
  return {
    id,
    name: String(raw.name),
    make: raw.make ? String(raw.make) : undefined,
    model: raw.model ? String(raw.model) : undefined,
    year: raw.year !== undefined ? Number(raw.year) : undefined,
    initialKilometersPassed,
    userId: String(raw.userId),
    createdAt: raw.createdAt as Timestamp,
  };
}
