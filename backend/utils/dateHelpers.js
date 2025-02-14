// backend/utils/dateHelpers.js
const { format, parseISO, addMinutes, isValid: isDateValid } = require('date-fns');

exports.isValidDate = (dateString) => {
  try {
    return isDateValid(parseISO(dateString));
  } catch {
    return false;
  }
};

exports.formatDateToISO = (dateString) => {
  return format(parseISO(dateString), 'yyyy-MM-dd');
};

exports.generateTimeSlots = (date) => {
  const slots = [];
  let currentTime = new Date(`${date}T09:00:00`);
  const endTime = new Date(`${date}T17:00:00`);

  while (currentTime < endTime) {
    const start = format(currentTime, 'HH:mm');
    currentTime = addMinutes(currentTime, 30);
    const end = format(currentTime, 'HH:mm');
    slots.push({ start, end });
  }

  return slots;
};