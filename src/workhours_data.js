async function loadWorkhours(db, date) {
  let workhours = await db.getFromIndex('workhours', 'date', date);
  if (!workhours) {
    workhours = {
      date: date,
      startMinute: 8*60,
      endMinute: 18*60
    };
  }
  return workhours;
}

async function saveWorkhours(db, workhours) {
  const existingWorkhours = await db.getFromIndex('workhours', 'date', workhours.date);
  if (existingWorkhours) {
    workhours.id = existingWorkhours.id;
  }
  await db.put('workhours', workhours);
}

export { loadWorkhours, saveWorkhours };
