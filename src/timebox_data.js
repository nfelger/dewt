import { iso8601date } from "./helpers";
import { notifyUser, notificationLevel } from "./notify";

async function allTimeboxesOnDate(db, date) {
  return await db.getAllFromIndex('timeboxes', 'date', iso8601date(date));
}

async function loadTimebox(db, id) {
  return await db.get('timeboxes', Number(id));
}

async function createTimebox(db, timebox) {
  await validateTimebox(db, timebox);
  const timeboxId = await db.put('timeboxes', timebox);
  timebox.id = timeboxId;
  return timebox;
}

async function updateTimebox(db, timeboxId, attributes) {
  const timebox = await loadTimebox(db, timeboxId);
  for (let [name, value] of Object.entries(attributes)) {
    timebox[name] = value;
  }
  await validateTimebox(db, timebox);
  await db.put('timeboxes', timebox);
  return timebox;
}

async function deleteTimebox(db, timeboxId) {
  await db.delete('timeboxes', Number(timeboxId));
}

const validationMessages = {
  overlap: 'Timeboxes can\'t overlap. Try adjusting start / end times.'
}

async function validateTimebox(db, timebox) {
  const errors = [];

  const allTimeboxes = await allTimeboxesOnDate(db, new Date());
  for (let tb of allTimeboxes) {
    // Don't compare to self.
    if (tb.id === timebox.id) { continue; }

    // Timebox overlap.
    if (
      (timebox.startMinute >= tb.startMinute && timebox.startMinute < tb.endMinute) ||
      (timebox.endMinute >= tb.startMinute && timebox.endMinute < tb.endMinute)
    ) {
      if (!errors.includes(validationMessages.overlap)) {
        errors.push(validationMessages.overlap);
      }
    }
  }

  if (errors.length > 0) {
    for (let error of errors) {
      notifyUser(error, notificationLevel.error);
    }
    throw new Error('Timebox validation failed.');
  }

  return errors === [];
}

export { allTimeboxesOnDate, loadTimebox, createTimebox, updateTimebox, deleteTimebox };
