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

export const getNepalTodayDateString = () => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kathmandu",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(new Date()); // en-CA locale formats as YYYY-MM-DD
};

export const toDateString = (date) => date.toISOString().slice(0, 10);
