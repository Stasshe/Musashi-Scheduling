export const TIME_SLOTS: string[] = [];
for (let hour = 8; hour <= 22; hour++) {
  const timeString = `${hour.toString().padStart(2, '0')}:00`;
  TIME_SLOTS.push(timeString);
}
