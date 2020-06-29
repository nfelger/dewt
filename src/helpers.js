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

export function dateFromISO8601Str(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function kebabToCamel(name) {
  return name.replace(/-(\w|$)/g, (_, next) => next.toUpperCase())
}

export function range(start, stop, step) {
  return Array.from({ length: (stop - start) / step + 1 }, (_, i) => start + (i * step));
}

export function getDirtyFormControls(formElement) {
  const formControls = Array.from(formElement.querySelectorAll('input, textarea'));
  const dirtyControls = formControls.filter(c => c.value !== c.defaultValue);
  return dirtyControls;
}

export function isFormPristine(formElement) {
  return getDirtyFormControls(formElement).length === 0;
}
