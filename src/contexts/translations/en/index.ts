import common from './common';
import auth from './auth';
import dashboard from './dashboard';
import fuel from './fuel';
import reminders from './reminders';
import settings from './settings';
import notifications from './notifications';

export const translations = {
  common,
  auth,
  dashboard,
  fuel,
  reminders,
  settings,
  notifications,
} as const;
