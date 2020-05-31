export function divmod(num, base) {
  return [Math.floor(num / base), num % base];
}

export function zeroPad(value) {
  if (value < 10) {
    return '0' + value;
  } else {
    return '' + value;
  }
}

export function minutesToTimeStr(minutes) {
  const parts = divmod(minutes, 60);
  return parts.map(zeroPad).join(':');
}

export function timeStrToMinutes(timeString) {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
}

export function iso8601date(date) {
  return `${date.getFullYear()}-${zeroPad(date.getMonth() + 1)}-${zeroPad(date.getDate())}`;
}

export function kebabToCamel(name) {
  return name.replace(/-(\w|$)/g, (_, next) => next.toUpperCase())
}
