import { openDB, deleteDB } from 'idb';
import { iso8601date } from './helpers';

async function setUpDatabase() {
  const db = await openDB('dewt', 1, {
    upgrade(db) {
      const timeboxesStore = db.createObjectStore('timeboxes', { keyPath: 'id', autoIncrement: true });

      for (let field of ['project', 'details', 'themeColor', 'startMinute', 'endMinute', 'date']) {
        timeboxesStore.createIndex(field, field, {unique: false});
      }

      const workhoursStore = db.createObjectStore('workhours', { keyPath: 'id', autoIncrement: true });
      workhoursStore.createIndex('date', 'date');
    }
  });

  return db;
}

async function addTestData(db) {
  const today = new Date();
  const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  const todayStr = iso8601date(today);
  const tomorrowStr = iso8601date(tomorrow);

  const testData = [
    {
      project: 'writing',
      details: 'Aufsatz zur Verwandlung von Pangolinen',
      themeColor: 1,
      date: todayStr,
      startMinute: 9*60 + 30,
      endMinute: 11*60 + 10,
      id: 1
    },
    {
      project: 'Dewt',
      details: 'Dewt Namen finden',
      themeColor: 2,
      date: todayStr,
      startMinute: 11*60 + 23,
      endMinute: 12*60 + 45,
      id: 2
    },
    {
      project: 'I SHOULD',
      details: 'NOT APPEAR',
      themeColor: 3,
      date: tomorrowStr,
      startMinute: 9*60,
      endMinute: 15*60,
      id: 3
    },
    {
      project: null,
      details: 'Email',
      themeColor: 1,
      date: todayStr,
      startMinute: 12*60 + 45,
      endMinute: 15*60,
      id: 4
    },
  ];

  for (let item of testData) {
    if (await db.get('timeboxes', item.id)){
      await db.delete('timeboxes', item.id);
    }
    await db.put('timeboxes', item);
  }
}

async function wipeAllDataAndReAddTestData(db) {
  db.close();
  await deleteDB('dewt');
  db = await setUpDatabase();
  await addTestData(db);
  return db
}

const dbPromise = setUpDatabase();

export { dbPromise, addTestData, wipeAllDataAndReAddTestData };
