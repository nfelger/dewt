import { timeStrToMinutes } from './helpers';

export function validatesStartBeforeEnd(startElement, endElement) {
  return () => {
    const start = timeStrToMinutes(startElement.value);
    const end = timeStrToMinutes(endElement.value);

    let msg;
    if (start >= end) {
      msg = "Start can't be after end.";
    } else {
      msg = ""
    }

    startElement.setCustomValidity(msg);
    endElement.setCustomValidity(msg);
  };
}
