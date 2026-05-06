import { common } from './common';
import { auth } from './auth';
import { layout } from './layout';
import { dashboard } from './dashboard';
import { fuel } from './fuel';
import { reminders } from './reminders';
import { settings } from './settings';
import { cars } from './cars';
import { notifications } from './notifications';

export const translations = {
  common,
  auth,
  layout,
  dashboard,
  fuel,
  reminders,
  settings,
  cars,
  notifications,
} as const;

export type Translations = typeof translations;
