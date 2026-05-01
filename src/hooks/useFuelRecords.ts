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
  Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import type { FuelRecord } from '../types';

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
      setRecords(snap.docs.map((d) => ({ id: d.id, ...d.data() } as FuelRecord)));
      setLoading(false);
    });
  }, [user, carId]);

  const addRecord = useCallback(
    async (data: {
      date: Date;
      odometer: number;
      liters: number;
      pricePerLiter: number;
      notes?: string;
    }) => {
      if (!user || !carId) return;
      await addDoc(collection(db, 'users', user.uid, 'fuelRecords'), {
        carId,
        userId: user.uid,
        date: Timestamp.fromDate(data.date),
        odometer: data.odometer,
        liters: data.liters,
        pricePerLiter: data.pricePerLiter,
        totalCost: Math.round(data.liters * data.pricePerLiter * 100) / 100,
        notes: data.notes ?? '',
        createdAt: serverTimestamp(),
      });
    },
    [user, carId],
  );

  const updateRecord = useCallback(
    async (
      id: string,
      data: {
        date?: Date;
        odometer?: number;
        liters?: number;
        pricePerLiter?: number;
        notes?: string;
      },
    ) => {
      if (!user) return;
      const payload: Record<string, unknown> = { ...data };
      if (data.date) payload.date = Timestamp.fromDate(data.date);
      if (data.liters !== undefined && data.pricePerLiter !== undefined) {
        payload.totalCost = Math.round(data.liters * data.pricePerLiter * 100) / 100;
      }
      await updateDoc(doc(db, 'users', user.uid, 'fuelRecords', id), payload);
    },
    [user],
  );

  const deleteRecord = useCallback(
    async (id: string) => {
      if (!user) return;
      await deleteDoc(doc(db, 'users', user.uid, 'fuelRecords', id));
    },
    [user],
  );

  return { records, loading, addRecord, updateRecord, deleteRecord };
}
