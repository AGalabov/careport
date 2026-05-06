export const cars = {
  form: {
    editTitle: 'Edit Car',
    addTitle: 'Add Your Car',
    nameLabel: 'Car name',
    namePlaceholder: 'e.g. My Skoda, Daily Driver',
    makeLabel: 'Make',
    makePlaceholder: 'e.g. Skoda',
    modelLabel: 'Model',
    modelPlaceholder: 'e.g. Octavia',
    yearLabel: 'Year',
    yearPlaceholder: '2020',
    odometerLabel: 'Current odometer (km)',
    odometerPlaceholder: '45000',
    saving: 'Saving…',
    saveChanges: 'Save Changes',
    addCar: 'Add Car',
    errors: {
      nameRequired: 'Name is required',
      odometerRequired: 'Valid odometer reading is required',
    },
  },
} as const;
