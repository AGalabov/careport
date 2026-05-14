import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  getDocs,
  serverTimestamp,
  Timestamp,
  limit,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { fuelRecordFromFirestore } from '../lib/firestoreMappers';
import { useAuth } from '../contexts/AuthContext';
import { useAsync } from './use-async';
import type { FuelRecord } from '../types';
import type { AddRecordInput } from './useFuelRecords';

export function useFuelLog(carId: string | null) {
  const { user } = useAuth();
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  const [currentYearRecords, setCurrentYearRecords] = useState<FuelRecord[]>([]);
  const [pastRecords, setPastRecords] = useState<Map<number, FuelRecord[]>>(new Map());
  const pastRecordsRef = useRef<Map<number, FuelRecord[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [yearLoading, setYearLoading] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!user || !carId) {
      setLoading(false);
      return;
    }
    const start = Timestamp.fromDate(new Date(currentYear, 0, 1));
    const q = query(
      collection(db, 'users', user.uid, 'fuelRecords'),
      where('carId', '==', carId),
      where('date', '>=', start),
      orderBy('date', 'desc'),
    );
    return onSnapshot(q, (snap) => {
      setCurrentYearRecords(
        snap.docs.map((d) => fuelRecordFromFirestore(d.id, d.data() as Record<string, unknown>)),
      );
      setLoading(false);
    });
  }, [user, carId, currentYear]);

  const { data: oldestYear } = useAsync(async () => {
    if (!user || !carId) return undefined;
    const snap = await getDocs(
      query(
        collection(db, 'users', user.uid, 'fuelRecords'),
        where('carId', '==', carId),
        orderBy('date', 'asc'),
        limit(1),
      ),
    );
    if (!snap.empty) {
      return (snap.docs[0].data().date as Timestamp).toDate().getFullYear();
    }
    return undefined;
  }, [user, carId, currentYear]);

  const availableYears = useMemo(
    () =>
      oldestYear
        ? Array.from({ length: currentYear - oldestYear + 1 }, (_, i) => currentYear - i)
        : [currentYear],
    [oldestYear, currentYear],
  );

  const loadYear = useCallback(
    async (year: number) => {
      if (!user || !carId || year === currentYear || pastRecordsRef.current.has(year)) return;
      setYearLoading((prev) => new Set(prev).add(year));
      try {
        const snap = await getDocs(
          query(
            collection(db, 'users', user.uid, 'fuelRecords'),
            where('carId', '==', carId),
            where('date', '>=', Timestamp.fromDate(new Date(year, 0, 1))),
            where('date', '<', Timestamp.fromDate(new Date(year + 1, 0, 1))),
            orderBy('date', 'desc'),
          ),
        );
        const recs = snap.docs.map((d) =>
          fuelRecordFromFirestore(d.id, d.data() as Record<string, unknown>),
        );
        pastRecordsRef.current.set(year, recs);
        setPastRecords(new Map(pastRecordsRef.current));
      } finally {
        setYearLoading((prev) => {
          const s = new Set(prev);
          s.delete(year);
          return s;
        });
      }
    },
    [user, carId, currentYear],
  );

  function getYear(year: number): FuelRecord[] {
    return year === currentYear ? currentYearRecords : (pastRecords.get(year) ?? []);
  }

  function isYearLoaded(year: number): boolean {
    return year === currentYear ? !loading : pastRecords.has(year);
  }

  const allRecords = useMemo(
    () => [currentYearRecords, ...Array.from(pastRecords.values())].flat(),
    [currentYearRecords, pastRecords],
  );

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
      if (
        data.liters !== undefined ||
        data.priceLpg !== undefined ||
        data.pricePetrol !== undefined ||
        data.fuelType !== undefined
      ) {
        const existing = allRecords.find((r) => r.id === id);
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
      // Patch past year cache optimistically
      setPastRecords((prev) => {
        for (const [year, recs] of prev) {
          const idx = recs.findIndex((r) => r.id === id);
          if (idx >= 0) {
            const patched: FuelRecord = {
              ...recs[idx],
              ...(data.kilometersPassed !== undefined && {
                kilometersPassed: data.kilometersPassed,
              }),
              ...(data.fuelType !== undefined && { fuelType: data.fuelType }),
              ...(data.liters !== undefined && { liters: data.liters }),
              ...(data.priceLpg !== undefined && { priceLpg: data.priceLpg }),
              ...(data.pricePetrol !== undefined && { pricePetrol: data.pricePetrol }),
              ...(data.notes !== undefined && { notes: data.notes }),
              ...(data.date && { date: Timestamp.fromDate(data.date) }),
              ...(payload.totalCost !== undefined && {
                totalCost: payload.totalCost as number,
              }),
            };
            const updated = [...recs];
            updated[idx] = patched;
            const next = new Map(prev);
            next.set(year, updated);
            pastRecordsRef.current = next;
            return next;
          }
        }
        return prev;
      });
    },
    [user, allRecords],
  );

  const deleteRecord = useCallback(
    async (id: string) => {
      if (!user) return;
      await deleteDoc(doc(db, 'users', user.uid, 'fuelRecords', id));
      setPastRecords((prev) => {
        const next = new Map(prev);
        for (const [year, recs] of next) {
          const filtered = recs.filter((r) => r.id !== id);
          if (filtered.length !== recs.length) next.set(year, filtered);
        }
        pastRecordsRef.current = next;
        return next;
      });
    },
    [user],
  );

  return {
    availableYears,
    getYear,
    loadYear,
    isYearLoaded,
    yearLoading,
    loading,
    addRecord,
    updateRecord,
    deleteRecord,
  };
}
