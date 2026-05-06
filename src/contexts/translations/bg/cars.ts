export const cars = {
  form: {
    editTitle: 'Редакция на автомобил',
    addTitle: 'Добавете автомобил',
    nameLabel: 'Име на автомобила',
    namePlaceholder: 'напр. Моята Škoda, Ежедневен',
    makeLabel: 'Марка',
    makePlaceholder: 'напр. Škoda',
    modelLabel: 'Модел',
    modelPlaceholder: 'напр. Octavia',
    yearLabel: 'Година',
    yearPlaceholder: '2020',
    odometerLabel: 'Текущ километраж (км)',
    odometerPlaceholder: '45000',
    saving: 'Записване…',
    saveChanges: 'Запази промените',
    addCar: 'Добави автомобил',
    errors: {
      nameRequired: 'Името е задължително',
      odometerRequired: 'Невалиден километраж',
    },
  },
} as const;
