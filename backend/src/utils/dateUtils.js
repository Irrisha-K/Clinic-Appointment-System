const DATE_FORMAT_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const DAY_ORDER = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export const isValidCalendarDate = (dateString) => {
  if (typeof dateString !== "string" || !DATE_FORMAT_REGEX.test(dateString)) {
    return false;
  }

  const [year, month, day] = dateString.split("-").map(Number);
  const reconstructed = new Date(Date.UTC(year, month - 1, day));

  return (
    reconstructed.getUTCFullYear() === year &&
    reconstructed.getUTCMonth() === month - 1 &&
    reconstructed.getUTCDate() === day
  );
};

export const toUTCMidnight = (dateString) =>
  new Date(`${dateString}T00:00:00.000Z`);

export const getDayOfWeekFromDateString = (dateString) => {
  return DAY_ORDER[toUTCMidnight(dateString).getUTCDay()];
};
