import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { fuelRecordFromFirestore } from '../lib/firestoreMappers';
import { useAuth } from '../contexts/AuthContext';
import type { FuelRecord, FuelType } from '../types';

export interface AddRecordInput {
  date: Date;
  kilometersPassed: number;
  fuelType: FuelType;
  liters: number;
  priceLpg: number;
  pricePetrol: number;
  notes?: string;
}

export function useFuelRecords(carId: string | null) {
  const { user } = useAuth();
  const [records, setRecords] = useState<FuelRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !carId) {
      setRecords([]);
      setLoading(false);
      return;
    }
    const q = query(
      collection(db, 'users', user.uid, 'fuelRecords'),
      where('carId', '==', carId),
      orderBy('date', 'desc'),
    );
    return onSnapshot(q, (snap) => {
      setRecords(snap.docs.map((d) => fuelRecordFromFirestore(d.id, d.data() as Record<string, unknown>)));
      setLoading(false);
    });
  }, [user, carId]);

  const addRecord = useCallback(
    async (data: AddRecordInput) => {
      if (!user || !carId) return;
      const price = data.fuelType === 'lpg' ? data.priceLpg : data.pricePetrol;
      await addDoc(collection(db, 'users', user.uid, 'fuelRecords'), {
        carId,
        userId: user.uid,
        date: Timestamp.fromDate(data.date),
        odometer: data.kilometersPassed,
        fuelType: data.fuelType,
        liters: data.liters,
        priceLpg: data.priceLpg,
        pricePetrol: data.pricePetrol,
        totalCost: Math.round(data.liters * price * 100) / 100,
        notes: data.notes ?? '',
        createdAt: serverTimestamp(),
      });
    },
    [user, carId],
  );

  const updateRecord = useCallback(
    async (id: string, data: Partial<AddRecordInput>) => {
      if (!user) return;
      const payload: Record<string, unknown> = { ...data };
      if (data.kilometersPassed !== undefined) {
        payload.odometer = data.kilometersPassed;
        delete payload.kilometersPassed;
      }
      if (data.date) payload.date = Timestamp.fromDate(data.date);
      if (data.liters !== undefined || data.priceLpg !== undefined || data.pricePetrol !== undefined || data.fuelType !== undefined) {
        const existing = records.find((r) => r.id === id);
        if (existing) {
          const liters = data.liters ?? existing.liters;
          const fuelType = data.fuelType ?? existing.fuelType;
          const priceLpg = data.priceLpg ?? existing.priceLpg;
          const pricePetrol = data.pricePetrol ?? existing.pricePetrol;
          const price = fuelType === 'lpg' ? priceLpg : pricePetrol;
          payload.totalCost = Math.round(liters * price * 100) / 100;
        }
      }
      await updateDoc(doc(db, 'users', user.uid, 'fuelRecords', id), payload);
    },
    [user, records],
  );

  const deleteRecord = useCallback(
    async (id: string) => {
      if (!user) return;
      await deleteDoc(doc(db, 'users', user.uid, 'fuelRecords', id));
    },
    [user],
  );

  const deleteAllRecords = useCallback(async () => {
    if (!user || !carId || records.length === 0) return;
    const batch = writeBatch(db);
    records.forEach((r) => batch.delete(doc(db, 'users', user.uid, 'fuelRecords', r.id)));
    await batch.commit();
  }, [user, carId, records]);

  return { records, loading, addRecord, updateRecord, deleteRecord, deleteAllRecords };
}
