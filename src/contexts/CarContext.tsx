import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { carFromFirestore } from '../lib/firestoreMappers';
import { useAuth } from './AuthContext';
import type { Car } from '../types';

interface CarContextValue {
  cars: Car[];
  activeCar: Car | null;
  selectCar: (id: string) => void;
  loading: boolean;
  addCar: (data: Omit<Car, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  updateCar: (id: string, data: Partial<Omit<Car, 'id' | 'userId' | 'createdAt'>>) => Promise<void>;
  deleteCar: (id: string) => Promise<void>;
}

const CarContext = createContext<CarContextValue | null>(null);

export function CarProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [cars, setCars] = useState<Car[]>([]);
  const [activeCarId, setActiveCarId] = useState<string | null>(
    () => localStorage.getItem('activeCarId'),
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setCars([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    return onSnapshot(collection(db, 'users', user.uid, 'cars'), (snap) => {
      const loaded = snap.docs.map((d) =>
        carFromFirestore(d.id, d.data() as Record<string, unknown>),
      );
      setCars(loaded);
      setLoading(false);
      if (loaded.length === 1 && !activeCarId) {
        setActiveCarId(loaded[0].id);
        localStorage.setItem('activeCarId', loaded[0].id);
      }
    });
  }, [user]);

  function selectCar(id: string) {
    setActiveCarId(id);
    localStorage.setItem('activeCarId', id);
  }

  const activeCar = cars.find((c) => c.id === activeCarId) ?? (cars.length === 1 ? cars[0] : null);

  async function addCar(data: Omit<Car, 'id' | 'userId' | 'createdAt'>) {
    if (!user) return;
    const { initialKilometersPassed, ...rest } = data;
    const ref = await addDoc(collection(db, 'users', user.uid, 'cars'), {
      ...rest,
      initialOdometer: initialKilometersPassed,
      userId: user.uid,
      createdAt: serverTimestamp(),
    });
    setActiveCarId(ref.id);
    localStorage.setItem('activeCarId', ref.id);
  }

  async function updateCar(
    id: string,
    data: Partial<Omit<Car, 'id' | 'userId' | 'createdAt'>>,
  ) {
    if (!user) return;
    const payload: Record<string, unknown> = { ...data };
    if (data.initialKilometersPassed !== undefined) {
      payload.initialOdometer = data.initialKilometersPassed;
      delete payload.initialKilometersPassed;
    }
    await updateDoc(doc(db, 'users', user.uid, 'cars', id), payload);
  }

  async function deleteCar(id: string) {
    if (!user) return;
    await deleteDoc(doc(db, 'users', user.uid, 'cars', id));
    if (activeCarId === id) {
      setActiveCarId(null);
      localStorage.removeItem('activeCarId');
    }
  }

  return (
    <CarContext.Provider
      value={{ cars, activeCar, selectCar, loading, addCar, updateCar, deleteCar }}
    >
      {children}
    </CarContext.Provider>
  );
}

export function useCar() {
  const ctx = useContext(CarContext);
  if (!ctx) throw new Error('useCar must be used within CarProvider');
  return ctx;
}
