import { minutesToTimeStr, timeStrToMinutes, iso8601date, kebabToCamel } from './helpers';
import AgendaView from './agenda_view';
import { validatesStartBeforeEnd } from './form_validations';
import { dbPromise, addTestData } from './database';
import { allTimeboxesOnDate, loadTimebox, createTimebox, updateTimebox, deleteTimebox } from './timebox_data';

const calendarView = new AgendaView(document.querySelector('.agenda'), 14 * 60, 7 * 60);
calendarView.draw();

if (new URL(window.location.href).searchParams.get('test') === 'true') {
  dbPromise.then(addTestData);
}

// Timebox UI

let modalBox;

async function drawAllTimeboxes(db) {
  const timeboxes = await allTimeboxesOnDate(db, new Date());

  for (let timebox of timeboxes) {
    drawTimebox(timebox);
  }
}

function drawTimebox(timebox) {
  const existingTimebox = document.querySelector(`article[data-timebox-id="${timebox.id}"]`);
  if (existingTimebox) {
    existingTimebox.remove();
  }

  if (timebox.date !== iso8601date(new Date())) {
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
  startMinute = startMinute - calendarView.dayStartsAtMin;
  const endMinute = startMinute + 45;

  // Timebox outer container.
  modalBox = document.createElement('article');
  modalBox.classList.add('timebox', 'timebox-draft');
  modalBox.style.setProperty('--start-minute', startMinute);
  modalBox.style.setProperty('--end-minute', endMinute);
  calendarView.agendaElement.appendChild(modalBox);

  // Form.
  const form = document.createElement('form');
  form.addEventListener('submit', submitDraftTimebox);
  modalBox.appendChild(form);

  // Details input.
  const details = document.createElement('textarea');
  details.name = 'details';
  details.placeholder = 'Work on something deeply';
  // Prevent adding line breaks (incl. from copy&paste).
  details.addEventListener('input', e => {
    e.target.value = e.target.value.replace(/\n/g, '');
  });
  form.appendChild(details);
  details.focus();

  // Submit button.
  const submitBtn = document.createElement('button');
  submitBtn.type = 'submit';
  // Wire hitting 'enter' in the textarea to clicking submit.
  details.addEventListener('keydown', e => {
    if (e.key == "Enter" && details.value !== "") {
      form.requestSubmit();
    }
  });
  form.appendChild(submitBtn);

  // Abort (x) button.
  const closeBtn = document.createElement('div');
  closeBtn.className = 'closeBtn';
  closeBtn.textContent = '×';
  closeBtn.addEventListener('click', e => {
    e.stopPropagation();  // Avoid opening a new timebox underneath.
    removeModalBox();
  });
  modalBox.appendChild(closeBtn);

  // Abort by hitting esc
  modalBox.addEventListener('keydown', e => {
    if (e.key == "Escape") {
      removeModalBox();
    }
  });

  // Stop clicks into the box from moving the box to a new time.
  modalBox.addEventListener('click', e => e.stopPropagation());
}

async function openTimeboxEditModal(e) {
  // Stop clicks from bubbling to the agenda.
  e.stopPropagation();

  if(!maybeRemoveModalBox()) { return; }

  const timeboxElement = e.currentTarget;
  const timeboxId = timeboxElement.dataset.timeboxId;

  const db = await dbPromise;
  const timebox = await loadTimebox(db, timeboxId);
  modalBox = document.createElement('div');
  modalBox.className = 'timebox-edit';
  modalBox.dataset.timeboxId = timeboxId;
  modalBox.insertAdjacentHTML('beforeend', `
    <form>
      <fieldset>
        <ul>
          <li class="project">
            <label for="project">Project</label>
            <input type="text" name="project" value="${timebox.project || ""}">
          </li>
          <li class="details">
            <label for="details">Details</label>
            <input type="text" name="details" required value="${timebox.details}">
          </li>
        </ul>
      </fieldset>
      <fieldset>
        <ul>
          <li class="start-minute">
            <label for="start-minute">Start</label>
            <input type="text" name="start-minute" required pattern="(2[0-3]|[0-1]?\\d):[0-5]\\d" title="hh:mm (24h time)" value="${minutesToTimeStr(timebox.startMinute)}">
          </li>
          <li class="end-minute">
            <label for="end-minute">End</label>
            <input type="text" name="end-minute" required pattern="(2[0-3]|[0-1]?\\d):[0-5]\\d" title="hh:mm (24h time)" value="${minutesToTimeStr(timebox.endMinute)}">
          </li>
          <li class="date">
            <label for="date">Date</label>
            <input type="text" name="date" required pattern="\\d{4}-\\d{2}-\\d{2}" title="yyyy-mm-dd" value="${timebox.date}">
          </li>
        </ul>
      </fieldset>
      <fieldset>
        <ul>
          <li class="theme-color">
            <label for="theme-color">Color</label>
            <input type="text" name="theme-color" required pattern="[1-7]" title="any number from 1 to 7" value="${timebox.themeColor}">
          </li>
        </ul>
      </fieldset>
      <fieldset>
        <ul>
          <li class="delete-timebox"><a href="#">Delete</a></li>
          <li class="cancel"><a href="#">Cancel</a></li>
          <li><button type="submit">Save</button></li>
        </ul>
      </fieldset>
    </form>`);
  modalBox.querySelector('.cancel a').addEventListener('click', e => {
    e.preventDefault();
    removeModalBox();
  });
  modalBox.querySelector('.delete-timebox a').addEventListener('click', async e => {
    e.preventDefault();
    await deleteTimebox(db, timeboxId);
    removeModalBox();
    timeboxElement.remove();
  });
  modalBox.querySelector('form').addEventListener('submit', submitEditTimebox);
  modalBox.addEventListener('click', e => e.stopPropagation());

  const form = modalBox.querySelector('form');
  const [startElement, endElement] = form.querySelectorAll('input[name=start-minute], input[name=end-minute]');
  startElement.addEventListener('input', validatesStartBeforeEnd(startElement, endElement));
  endElement.addEventListener('input', validatesStartBeforeEnd(startElement, endElement));

  timeboxElement.appendChild(modalBox);
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
      date: iso8601date(new Date()),
      startMinute: Number(modalBox.style.getPropertyValue('--start-minute')) + calendarView.dayStartsAtMin,
      endMinute: Number(modalBox.style.getPropertyValue('--end-minute')) + calendarView.dayStartsAtMin
    });
    drawTimebox(timebox);
    removeModalBox();
  } catch {
    flashModalBox();
  }
}

async function submitEditTimebox(e) {
  e.preventDefault();

  const form = modalBox.querySelector('form');
  if (!form.reportValidity()) {
    return;
  }

  const formControls = Array.from(modalBox.querySelectorAll('input'));
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

  const timeboxId = modalBox.dataset.timeboxId;
  const db = await dbPromise;
  try {
    const timebox = await updateTimebox(db, timeboxId, changedValues);
    drawTimebox(timebox);
    removeModalBox();
  } catch {
    flashModalBox();
  }
}

function setUpAgendaListeners(calendarView) {
  let mouseY;
  calendarView.agendaElement.addEventListener('mousemove', e => {
    mouseY = e.clientY;
  });

  calendarView.agendaElement.addEventListener('click', e => {
    if(!maybeRemoveModalBox()) { return; }

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
  if(!maybeRemoveModalBox()) { return; }

  const db = await dbPromise;
  const workhours = await loadWorkhours(db, iso8601date(new Date()));
  modalBox = document.createElement('div');
  modalBox.className = 'work-hours-modal';
  modalBox.insertAdjacentHTML('beforeend', `
    <p>Set your working hours:</p>
    <form>
      <fieldset>
        <ul>
          <li class="work-start">
            <label for="start">Start</label>
            <input type="text" name="start" required pattern="(2[0-3]|[0-1]?\\d):[0-5]\\d" title="hh:mm (24h time)" value="${minutesToTimeStr(workhours.startMinute)}">
          </li>
          <li class="work-end">
            <label for="end">End</label>
            <input type="text" name="end" required pattern="(2[0-3]|[0-1]?\\d):[0-5]\\d" title="hh:mm (24h time)" value="${minutesToTimeStr(workhours.endMinute)}">
          </li>
        </ul>
      </fieldset>
      <fieldset>
        <ul>
          <li><a href="#">Cancel</a></li>
          <li><button type="submit">Save</button></li>
        </ul>
      </fieldset>
    </form>`);
  calendarView.agendaElement.appendChild(modalBox);

  modalBox.addEventListener('click', e => e.stopPropagation());

  modalBox.querySelector('a').addEventListener('click', e => {
    e.preventDefault();
    removeModalBox();
  });

  const form = modalBox.querySelector('form');
  form.addEventListener('submit', submitWorkHours);

  const [startElement, endElement] = form.querySelectorAll('input[name=start], input[name=end]');
  startElement.addEventListener('input', validatesStartBeforeEnd(startElement, endElement));
  endElement.addEventListener('input', validatesStartBeforeEnd(startElement, endElement));
}

async function submitWorkHours(e) {
  e.preventDefault();

  const formData = new FormData(e.target);
  const workhours = {
    date: iso8601date(new Date()),
    startMinute: timeStrToMinutes(formData.get('start')),
    endMinute: timeStrToMinutes(formData.get('end'))
  };
  const db = await dbPromise;
  await saveWorkhours(db, workhours);
  removeModalBox();
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
  const workhours = await loadWorkhours(db, iso8601date(new Date()));

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


// Modal box handling.

/**
 * Returns false if a box exists but couldn't be removed.
 */
function maybeRemoveModalBox() {
  if (!modalBox) { return true; }

  if (isModalBoxPristine()) {
    removeModalBox();
    return true;
  } else {
    flashModalBox()
    return false;
  }
}

function removeModalBox() {
  modalBox.remove();
  modalBox = null;
}

function isModalBoxPristine() {
  if (!modalBox) {
    throw new Error('Cannot discard a non-existent modalBox.');
  }

  let formControls = [];
  if (modalBox.classList.contains('timebox-draft')) {
    formControls = [modalBox.querySelector('textarea')];
  } else if (modalBox.classList.contains('timebox-edit')) {
    formControls = Array.from(modalBox.querySelectorAll('input'));
  }

  return formControls.every(i => i.defaultValue === i.value);
}

function flashModalBox() {
  modalBox.classList.add('box-flash');
  setTimeout(() => {
    if (modalBox) {  // User may have closed it already.
      modalBox.classList.remove('box-flash');
    }
  }, 800);
}
