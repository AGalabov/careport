import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  where,
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
import type { Reminder } from '../types';

export function useReminders(carId: string | null) {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !carId) {
      setReminders([]);
      setLoading(false);
      return;
    }
    const q = query(
      collection(db, 'users', user.uid, 'reminders'),
      where('carId', '==', carId),
    );
    return onSnapshot(q, (snap) => {
      setReminders(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Reminder)));
      setLoading(false);
    });
  }, [user, carId]);

  const addReminder = useCallback(
    async (data: Omit<Reminder, 'id' | 'userId' | 'carId' | 'createdAt'>) => {
      if (!user || !carId) return;
      const payload: Record<string, unknown> = { ...data, carId, userId: user.uid, createdAt: serverTimestamp() };
      if (data.dueDate && data.dueDate instanceof Date) {
        payload.dueDate = Timestamp.fromDate(data.dueDate as unknown as Date);
      }
      await addDoc(collection(db, 'users', user.uid, 'reminders'), payload);
    },
    [user, carId],
  );

  const updateReminder = useCallback(
    async (id: string, data: Partial<Omit<Reminder, 'id'>>) => {
      if (!user) return;
      const payload: Record<string, unknown> = { ...data };
      if (data.dueDate && data.dueDate instanceof Date) {
        payload.dueDate = Timestamp.fromDate(data.dueDate as unknown as Date);
      }
      await updateDoc(doc(db, 'users', user.uid, 'reminders', id), payload);
    },
    [user],
  );

  const deleteReminder = useCallback(
    async (id: string) => {
      if (!user) return;
      await deleteDoc(doc(db, 'users', user.uid, 'reminders', id));
    },
    [user],
  );

  const markServiced = useCallback(
    async (id: string, currentOdometer: number) => {
      if (!user) return;
      await updateDoc(doc(db, 'users', user.uid, 'reminders', id), {
        lastServiceKm: currentOdometer,
        notifiedKmThresholds: [],
      });
    },
    [user],
  );

  return { reminders, loading, addReminder, updateReminder, deleteReminder, markServiced };
}
