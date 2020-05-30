// Calendar layout

const agendaElement = document.querySelector('.agenda');
const hoursToDraw = 14;
const totalMinutes = hoursToDraw * 60;
const dayStartsAtMin = 420;

function drawCalendarDate(calendarDate) {
  const dateFmtOptions = { month: 'short', weekday: 'short' };
  const [weekday, month] = new Intl.DateTimeFormat('en-US', dateFmtOptions)
    .formatToParts(calendarDate)
    .filter(({type}) => Object.keys(dateFmtOptions).includes(type))
    .map(({value}) => value);
  const date = calendarDate.getDate();

  const dayElements = document.querySelectorAll('.day p');
  dayElements[0].textContent = weekday;
  dayElements[1].textContent = date;
  dayElements[2].textContent = month;
}

function drawTimeHints() {

  function drawHours() {
    const firstFullHour = 60 - dayStartsAtMin % 60;

    for (let min = firstFullHour; min < totalMinutes; min += 60) {
      const hour = document.createElement('h3');
      hour.className = 'time-hint';
      hour.style.setProperty('--start-minute', min);
      hour.style.setProperty('--end-minute', min + 59);
      hour.textContent = (dayStartsAtMin + min) / 60;

      const minute = document.createElement('sup');
      minute.textContent = '00';
      hour.appendChild(minute);

      agendaElement.appendChild(hour);
    }
  }

  function drawLinesEvery60Min(className, firstLineAfter) {
    for (let min = firstLineAfter; min < totalMinutes; min += 60) {
      const line = document.createElement('div');
      line.className = className;
      line.style.setProperty('--start-minute', min);
      agendaElement.appendChild(line);
    }
  }

  function drawMajorLines() {
    const firstLineAfter = 60 - dayStartsAtMin % 60;
    drawLinesEvery60Min('rule-major', firstLineAfter)
  }

  function drawMinorLines() {
    let firstLineAfter;

    if (dayStartsAtMin % 60 < 30) {
      firstLineAfter = 30 - dayStartsAtMin % 30;
    } else {
      firstLineAfter = 60 - (dayStartsAtMin - 30) % 60;
    }

    drawLinesEvery60Min('rule-minor', firstLineAfter);
  }

  function drawNowRule() {
    const nowRule = document.createElement('div');
    nowRule.className = 'rule-now';
    agendaElement.appendChild(nowRule);

    function updateNowRulePosition() {
      const now = new Date();
      const nowInMinutes = now.getHours() * 60 + now.getMinutes() - dayStartsAtMin;

      if (nowInMinutes >= totalMinutes) {
        nowRule.remove();
        return;
      }

      nowRule.style.setProperty('--start-minute', nowInMinutes);

      setTimeout(updateNowRulePosition, 60000);
    }
    updateNowRulePosition();
  }

  drawHours();
  drawMajorLines();
  drawMinorLines();
  drawNowRule();
}

function parseLocationForCalendarDate() {
  const location = new URL(window.location.href);
  const dateStr = location.searchParams.get('date');

  if (dateStr === null) {
    return new Date();
  } else if (dateStr.match(/\d{4}-\d{2}-\d{2}/)) {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  } else {
    document.querySelector('body').innerHTML = '<h1>Page not found</h1><p>You really shouldn\'t be here…</p>';
    throw Error(`Malformed date! ${dateStr}`);
  }
}

function drawView() {
  agendaElement.style.setProperty('--total-minutes', totalMinutes);
  drawCalendarDate(parseLocationForCalendarDate());
  drawTimeHints();
}

drawView();

// Timeboxes

import { openDB } from 'https://unpkg.com/idb@5.0.3?module';

async function setUpDatabase() {
  const db = await openDB('dewt', 1, {
    upgrade(db, oldVersion, newVersion, transaction) {
      const objStore = db.createObjectStore('timeboxes', { keyPath: 'id', autoIncrement: true });

      for (let field of ['project', 'details', 'themeColor', 'startMinute', 'endMinute', 'date']) {
        objStore.createIndex(field, field, {unique: false});
      }
    }
  });

  return db;
}

function iso8601date(date) {
  const zeroPad = value => value < 10 ? '0' + value : value;
  return `${date.getFullYear()}-${zeroPad(date.getMonth() + 1)}-${zeroPad(date.getDate())}`;
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
      project: null,
      details: 'Email',
      themeColor: 1,
      date: todayStr,
      startMinute: 12*60 + 45,
      endMinute: 15*60,
      id: 3
    },
    {
      project: 'I SHOULD',
      details: 'NOT APPEAR',
      themeColor: 3,
      date: tomorrowStr,
      startMinute: 9*60,
      endMinute: 15*60,
      id: 4
    }
  ];

  for (let item of testData) {
    if (await db.get('timeboxes', item.id)){
      await db.delete('timeboxes', item.id);
    }
    await db.put('timeboxes', item);
  }
}

async function allTimeboxesOnDate(db, date) {
  return await db.getAllFromIndex('timeboxes', 'date', iso8601date(date));
}

async function validateTimebox(db, timebox) {
  const errors = [];
  const allTimeboxes = await allTimeboxesOnDate(db, new Date());
  for (let tb of allTimeboxes) {
    if (
      (timebox.startMinute >= tb.startMinute && timebox.startMinute < tb.endMinute) ||
      (timebox.endMinute >= tb.startMinute && timebox.endMinute < tb.endMinute)
    ) {
      errors.push('Timeboxes may not overlap. Please adjust the times.');
    }
  }
  return errors;
}

async function loadTimebox(db, id) {
  return await db.get('timeboxes', Number(id));
}

async function createTimebox(db, timebox) {
  const validationErrors = await validateTimebox(db, timebox);
  if (validationErrors.length > 0) {
    for (let error of validationErrors) {
      notifyUser(error, notificationLevel.error);
    }
    throw new Error('Timebox validation failed.');
  }
  const timeboxId = await db.put('timeboxes', timebox);
  timebox.id = timeboxId;
  addTimeboxToDocument(timebox);
}

function removeModalBoxFromDocument() {
  modalBox.remove();
  modalBox = null;
}

async function loadAndDrawTimeboxes(db) {
  const timeboxes = await allTimeboxesOnDate(db, new Date());

  for (let timebox of timeboxes) {
    addTimeboxToDocument(timebox);
  }
}

const dbPromise = setUpDatabase();
dbPromise.then(addTestData);
dbPromise.then(loadAndDrawTimeboxes);

function addTimeboxToDocument(timebox) {
  const timeboxElement = document.createElement('article');
  timeboxElement.classList.add('timebox', `theme-color-${timebox.themeColor}`);
  timeboxElement.style.setProperty('--start-minute', timebox.startMinute - dayStartsAtMin);
  timeboxElement.style.setProperty('--end-minute', timebox.endMinute - dayStartsAtMin);

  const details = document.createElement('h4');
  details.textContent = timebox.details;
  timeboxElement.appendChild(details);

  const project = document.createElement('h5');
  project.textContent = timebox.project;
  timeboxElement.appendChild(project);

  timeboxElement.dataset.timeboxId = timebox.id;

  timeboxElement.addEventListener('click', openTimeboxEditModal);

  agendaElement.appendChild(timeboxElement);
}

function openTimeboxEditModal(e) {
  // Stop clicks from bubbling to the agenda.
  e.stopPropagation();

  if(!maybeRemoveModalBox()) { return; }

  const timeboxElement = e.currentTarget;
  const timeboxId = timeboxElement.dataset.timeboxId;
  dbPromise.then(db => loadTimebox(db, timeboxId)).then(timebox => {
    modalBox = document.createElement('div');
    modalBox.className = 'timebox-edit';
    const form = document.createElement('form');
    form.insertAdjacentHTML('beforeend', `
      <fieldset>
        <ul>
          <li class="project">
            <label for="project">Project</label>
            <input type="text" name="project" value="${timebox.project || ""}">
          </li>
          <li class="details">
            <label for="details">Details</label>
            <input type="text" name="details" value="${timebox.details}">
          </li>
        </ul>
      </fieldset>
      <fieldset>
        <ul>
          <li class="start-minute">
            <label for="start-minute">Start</label>
            <input type="text" name="start-minute" value="${timebox.startMinute}">
          </li>
          <li class="end-minute">
            <label for="end-minute">End</label>
            <input type="text" name="end-minute" value="${timebox.endMinute}">
          </li>
          <li class="date">
            <label for="date">Date</label>
            <input type="text" name="date" value="${timebox.date}">
          </li>
        </ul>
      </fieldset>
      <fieldset>
        <ul>
          <li class="theme-color">
            <label for="theme-color">Color</label>
            <input type="text" name="theme-color" value="${timebox.themeColor}">
          </li>
        </ul>
      </fieldset>
      <fieldset>
        <ul>
          <li><a href="#">Cancel</a></li>
          <li><button type="submit">Save</button></li>
        </ul>
      </fieldset>`);
    modalBox.appendChild(form);
    form.querySelector('a').addEventListener('click', e => {
      e.preventDefault();
      removeModalBoxFromDocument()
    });
    modalBox.addEventListener('click', e => e.stopPropagation());
    timeboxElement.appendChild(modalBox);
  });
}

// Adding timeboxes

let modalBox;

function addDraftTimeboxToDocument(startMinute) {
  startMinute = startMinute - dayStartsAtMin;
  const endMinute = startMinute + 45;

  // Timebox outer container.
  modalBox = document.createElement('article');
  modalBox.classList.add('timebox', 'timebox-draft');
  modalBox.style.setProperty('--start-minute', startMinute);
  modalBox.style.setProperty('--end-minute', endMinute);
  agendaElement.appendChild(modalBox);

  // Form.
  const form = document.createElement('form');
  form.addEventListener('submit', draftTimeboxSubmitHandler);
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
    removeModalBoxFromDocument();
  });
  modalBox.appendChild(closeBtn);

  // Abort by hitting esc
  modalBox.addEventListener('keydown', e => {
    if (e.key == "Escape") {
      removeModalBoxFromDocument();
    }
  });

  // Stop clicks into the box from moving the box to a new time.
  modalBox.addEventListener('click', e => e.stopPropagation());
}

function draftTimeboxSubmitHandler(e) {
  e.preventDefault();

  let project = null;
  let details = new FormData(e.target).get('details');

  const firstColonLocation = details.indexOf(':');
  if (firstColonLocation !== -1) {
    project = details.slice(0, firstColonLocation);
    details = details.slice(firstColonLocation + 1);
  }

  dbPromise.then(db => {
    createTimebox(db, {
      project: project,
      details: details,
      themeColor: 1,
      date: iso8601date(new Date()),
      startMinute: Number(modalBox.style.getPropertyValue('--start-minute')) + dayStartsAtMin,
      endMinute: Number(modalBox.style.getPropertyValue('--end-minute')) + dayStartsAtMin
    })
    .then(removeModalBoxFromDocument)
    .catch(flashModalBox);
  });
}

function setUpListenersForAddingTimeboxes() {
  let mouseY;
  agendaElement.addEventListener('mousemove', e => {
    mouseY = e.clientY;
  });

  agendaElement.addEventListener('click', e => {
    if(!maybeRemoveModalBox()) { return; }

    // Use the fact that 1min == 1px.
    const agendaOffset = agendaElement.getBoundingClientRect().y;
    const mousePosition = mouseY;
    const mouseAtMinute = mousePosition - agendaOffset + dayStartsAtMin;

    addDraftTimeboxToDocument(mouseAtMinute);
  });
}

setUpListenersForAddingTimeboxes();

// Returns false if a box exists but couldn't be removed.
function maybeRemoveModalBox() {
  if (!modalBox) { return true; }

  if (clickMayDiscardModalBox()) {
    removeModalBoxFromDocument();
    return true;
  } else {
    flashModalBox()
    return false;
  }
}

function clickMayDiscardModalBox() {
  if (!modalBox) {
    throw new Error('Cannot discard a non-existent modalBox.');
  }

  if (modalBox.classList.contains('timebox-draft')) {
    const details = modalBox.querySelector('textarea');
    if (details.value !== '') {
      return false;
    }
  } else if (modalBox.classList.contains('timebox-edit')) {
    const inputs = modalBox.querySelectorAll('input');
    const dirty = Array.from(inputs).some(i => i.defaultValue !== i.value);
    if (dirty) {
      return false;
    }
  }

  return true;
}

function flashModalBox() {
  modalBox.classList.add('box-flash');
  setTimeout(() => {
    modalBox.classList.remove('box-flash');
  }, 1000);
}

// User notifications
const notificationLevel = {
  error: 'error',
  info: 'info',
  success: 'success'
}
const notificationsElement = document.querySelector('.notifications');
function notifyUser(message, level) {
  const notification = document.createElement('div');
  notification.classList.add('notification', level);
  notificationsElement.appendChild(notification);
  const messageElement = document.createElement('p');
  messageElement.textContent = message;
  notification.appendChild(messageElement);
  notification.addEventListener('click', () => {
    notification.classList.add('hide');
    setTimeout(function() {
      notification.remove();
    }, 200);
  });
}
