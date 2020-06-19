import AgendaView from './agenda_view';
import DraftTimeboxModal from './draft_timebox_modal';
import EditTimeboxModal from './edit_timebox_modal';
import WorkhoursModalBox from './workhours_modal';
import { timeStrToMinutes, iso8601date, kebabToCamel } from './helpers';
import { dbPromise, addTestData, wipeAllDataAndReAddTestData } from './database';
import { allTimeboxesOnDate, loadTimebox, createTimebox, updateTimebox, deleteTimebox } from './timebox_data';

const calendarView = new AgendaView(document.querySelector('.agenda'), 16 * 60, 6 * 60);
calendarView.draw();

let modalBox;

let url = new URL(window.location.href);
if (url.searchParams.get('wipeDbAndSeedTestData') !== null) {
  dbPromise
    .then(wipeAllDataAndReAddTestData)
    .then(() => {
      url.searchParams.delete('wipeDbAndSeedTestData');
      window.location.href = url.href;
    });
}
if (url.searchParams.get('addTestData') !== null) {
  dbPromise
    .then(addTestData)
    .then(() => {
      url.searchParams.delete('addTestData');
      window.location.href = url.href;
    });
}

// Timebox UI
async function drawAllTimeboxes(db) {
  const timeboxes = await allTimeboxesOnDate(db, iso8601date(calendarView.date));

  for (let timebox of timeboxes) {
    drawTimebox(timebox);
  }
}

function drawTimebox(timebox) {
  const existingTimebox = document.querySelector(`article[data-timebox-id="${timebox.id}"]`);
  if (existingTimebox) {
    existingTimebox.remove();
  }

  if (timebox.date !== iso8601date(calendarView.date)) {
    return;
  }

  const timeboxElement = document.createElement('article');
  timeboxElement.classList.add('timebox', `theme-color-${timebox.themeColor}`);
  timeboxElement.style.setProperty('--start-minute', timebox.startMinute - calendarView.dayStartsAtMin);
  timeboxElement.style.setProperty('--end-minute', timebox.endMinute - calendarView.dayStartsAtMin);

  const details = document.createElement('h4');
  details.textContent = timebox.details;
  timeboxElement.appendChild(details);

  const project = document.createElement('h5');
  project.textContent = timebox.project;
  timeboxElement.appendChild(project);

  timeboxElement.dataset.timeboxId = timebox.id;

  timeboxElement.addEventListener('click', openTimeboxEditModal);

  calendarView.agendaElement.appendChild(timeboxElement);
}

function openDraftTimeboxModal(startMinute) {
  if(modalBox && !modalBox.maybeRemove()) { return; }

  startMinute = startMinute - calendarView.dayStartsAtMin;
  const endMinute = startMinute + 45;
  modalBox = new DraftTimeboxModal(calendarView.agendaElement, startMinute, endMinute);
  modalBox.constructor.element.querySelector('form').addEventListener('submit', submitDraftTimebox);
  modalBox.constructor.element.querySelector('textarea').focus();
}

async function openTimeboxEditModal(e) {
  // Stop clicks from bubbling to the agenda.
  e.stopPropagation();

  if(modalBox && !modalBox.maybeRemove()) { return; }

  const timeboxElement = e.currentTarget;
  const timeboxId = timeboxElement.dataset.timeboxId;

  const db = await dbPromise;
  const timebox = await loadTimebox(db, timeboxId);

  modalBox = new EditTimeboxModal(timeboxElement, timeboxId, timebox);
  modalBox.constructor.element.querySelector('.delete-timebox a').addEventListener('click', async e => {
    e.preventDefault();
    await deleteTimebox(db, timeboxId);
    modalBox.remove();
    timeboxElement.remove();
  });
  modalBox.constructor.element.querySelector('form').addEventListener('submit', submitEditTimebox);
}

async function submitDraftTimebox(e) {
  e.preventDefault();

  let project = null;
  let details = new FormData(e.target).get('details');

  const firstColonLocation = details.indexOf(':');
  if (firstColonLocation !== -1) {
    project = details.slice(0, firstColonLocation);
    details = details.slice(firstColonLocation + 1);
  }

  const db = await dbPromise;
  try {
    const timebox = await createTimebox(db, {
      project: project,
      details: details,
      themeColor: 1,
      date: iso8601date(calendarView.date),
      startMinute: Number(modalBox.constructor.element.style.getPropertyValue('--start-minute')) + calendarView.dayStartsAtMin,
      endMinute: Number(modalBox.constructor.element.style.getPropertyValue('--end-minute')) + calendarView.dayStartsAtMin
    });
    drawTimebox(timebox);
    modalBox.remove();
  } catch {
    modalBox.flash();
  }
}

async function submitEditTimebox(e) {
  e.preventDefault();

  const form = modalBox.constructor.element.querySelector('form');
  if (!form.reportValidity()) {
    return;
  }

  const formControls = Array.from(modalBox.constructor.element.querySelectorAll('input'));
  const dirtyControls = formControls.filter(c => c.value !== c.defaultValue);

  let changedValues = {};
  for (let control of dirtyControls) {
    let value = control.value;
    let name = kebabToCamel(control.name);
    // Transform data where necessary.
    switch(name) {
      case 'startMinute':
      case 'endMinute':
        value = timeStrToMinutes(value);
        break;
      case 'date':
        const [year, month, day] = value.split('-').map(Number);
        value = iso8601date(new Date(year, month - 1, day));
        break;
    }
    changedValues[name] = value;
  }

  const timeboxId = modalBox.constructor.element.dataset.timeboxId;
  const db = await dbPromise;
  try {
    const timebox = await updateTimebox(db, timeboxId, changedValues);
    drawTimebox(timebox);
    modalBox.remove();
  } catch {
    modalBox.flash();
  }
}

function setUpAgendaListeners(calendarView) {
  let mouseY;
  calendarView.agendaElement.addEventListener('mousemove', e => {
    mouseY = e.clientY;
  });

  calendarView.agendaElement.addEventListener('click', e => {
    // Use the fact that 1min == 1px.
    const agendaOffset = calendarView.agendaElement.getBoundingClientRect().y;
    const mousePosition = mouseY;
    const mouseAtMinute = mousePosition - agendaOffset + calendarView.dayStartsAtMin;

    openDraftTimeboxModal(mouseAtMinute);
  });
}
dbPromise.then(drawAllTimeboxes);
setUpAgendaListeners(calendarView);


// Work hours.
async function openWorkHoursModal() {
  if(modalBox && !modalBox.maybeRemove()) { return; }

  const db = await dbPromise;
  const workhours = await loadWorkhours(db, iso8601date(calendarView.date));
  modalBox = new WorkhoursModalBox(calendarView.agendaElement, workhours.startMinute, workhours.endMinute);
  modalBox.constructor.element.querySelector('form').addEventListener('submit', submitWorkHours);
  modalBox.constructor.element.querySelector('input').focus();
}

async function submitWorkHours(e) {
  e.preventDefault();

  const formData = new FormData(e.target);
  const workhours = {
    date: iso8601date(calendarView.date),
    startMinute: timeStrToMinutes(formData.get('start')),
    endMinute: timeStrToMinutes(formData.get('end'))
  };
  const db = await dbPromise;
  await saveWorkhours(db, workhours);
  modalBox.remove();
  drawWorkhours(db);
}

async function saveWorkhours(db, workhours) {
  const existingWorkhours = await db.getFromIndex('workhours', 'date', workhours.date);
  if (existingWorkhours) {
    workhours.id = existingWorkhours.id;
  }
  await db.put('workhours', workhours);
}

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

async function drawWorkhours(db) {
  const workhours = await loadWorkhours(db, iso8601date(calendarView.date));

  const workhoursElement = document.querySelector('.work-hours');
  workhoursElement.style.setProperty('--start-minute', workhours.startMinute - calendarView.dayStartsAtMin);
  workhoursElement.style.setProperty('--end-minute', workhours.endMinute - calendarView.dayStartsAtMin);
  calendarView.agendaElement.appendChild(workhoursElement);
}

function setUpSetWorkhoursListener() {
  const setWorkhoursLink = calendarView.agendaElement.querySelector('.set-work-hours a');
  setWorkhoursLink.addEventListener('click', e => {
    e.stopPropagation();
    openWorkHoursModal();
  });
}
dbPromise.then(drawWorkhours);
setUpSetWorkhoursListener();
