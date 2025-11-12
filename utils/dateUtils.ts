
export const addBusinessDays = (startDate: Date, days: number): Date => {
  let currentDate = new Date(startDate);
  let addedDays = 0;
  while (addedDays < days) {
    currentDate.setDate(currentDate.getDate() + 1);
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // 0 = Sunday, 6 = Saturday
      addedDays++;
    }
  }
  return currentDate;
};
