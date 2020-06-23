import React from 'react';
import ReactDOM from 'react-dom';

import AgendaView from './agenda_view';
import DraftTimeboxModal from './draft_timebox_modal';
import EditTimeboxModal from './edit_timebox_modal';
import WorkhoursModalBox from './workhours_modal';
import { timeStrToMinutes, iso8601date, kebabToCamel } from './helpers';
import { dbPromise, addTestData, wipeAllDataAndReAddTestData } from './database';
import { ValidationError, allTimeboxesOnDate, loadTimebox, createTimebox, updateTimebox, deleteTimebox } from './timebox_data';

function parseCalendarDateFromLocation() {
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

/* Routing */
let date = parseCalendarDateFromLocation();
let url = new URL(window.location.href);
if (url.searchParams.get('wipeDbAndSeedTestData') !== null) {
  dbPromise
    .then(wipeAllDataAndReAddTestData)
    .then(() => {
      url.searchParams.delete('wipeDbAndSeedTestData');
      window.location.href = url.href;
    });
} else if (url.searchParams.get('addTestData') !== null) {
  dbPromise
    .then(addTestData)
    .then(() => {
      url.searchParams.delete('addTestData');
      window.location.href = url.href;
    });
}

class Notifications extends React.Component {
  constructor(props) {
    super(props);

    this.clickHandler = this.clickHandler.bind(this);

    this.state = { hidden: new Set() };
  }

  clickHandler(key, e) {
    e.stopPropagation();

    this.setState(state => {
      const hidden = new Set(state.hidden);
      hidden.add(key);
      return { hidden };
    });

    setTimeout(() => {
      this.props.removeNotification(key);
      this.setState(state => {
        const hidden = new Set(state.hidden);
        hidden.delete(key);
        return { hidden };
      });
    }, 200);
  }

  render() {
    const className = (key, level) => {
      if (this.state.hidden.has(key)) {
        return ['notification', level, 'hide'].join(' ');
      } else {
        return ['notification', level].join(' ');
      }
    }

    return (
      <div className="notifications">
        {Array.from(this.props.messages, ([key, msg]) => {
          return (
            <div key={ key }
                 className={ className(key, msg.level) }
                 onClick={ this.clickHandler.bind(this, key) }>
              <p>{ msg.message }</p>
            </div>
          );
        })}
      </div>
    )
  }
}

let modalBox;
const mainElement = document.querySelector('main');
const totalMinutes = 16 * 60;
const dayStartsAtMin = 6 * 60;
const setWorkhoursHandler = (e) => { e.stopPropagation(); openWorkHoursModal(); };

/* Work hours */
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

async function openWorkHoursModal() {
  if(modalBox && !modalBox.maybeRemove()) { return; }

  const db = await dbPromise;
  const workhours = await loadWorkhours(db, iso8601date(date));
  modalBox = new WorkhoursModalBox(document.querySelector('.agenda .main'), workhours.startMinute, workhours.endMinute);
  modalBox.constructor.element.querySelector('form').addEventListener('submit', submitWorkHours);
  modalBox.constructor.element.querySelector('input').focus();
}

async function submitWorkHours(e) {
  e.preventDefault();

  const formData = new FormData(e.target);
  const workhours = {
    date: iso8601date(date),
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

async function drawWorkhours(db) {
  const workhours = await loadWorkhours(db, iso8601date(date));

  const workhoursElement = document.querySelector('.work-hours');
  workhoursElement.style.setProperty('--start-minute', workhours.startMinute - dayStartsAtMin);
  workhoursElement.style.setProperty('--end-minute', workhours.endMinute - dayStartsAtMin);
}

dbPromise.then(drawWorkhours);

class Dewt extends React.Component {
  constructor(props) {
    super(props);

    this.state = { notifications: new Map() };

    this.addNotification = this.addNotification.bind(this);
    this.removeNotification = this.removeNotification.bind(this);
  }

  addNotification(message, level) {
    this.setState((state) => {
      const notifications = new Map(state.notifications);
      notifications.set(Number(new Date()), {message, level});
      return { notifications };
    })
  }

  removeNotification(key) {
    this.setState((state) => {
      const notifications = new Map(state.notifications);
      notifications.delete(key);
      return { notifications };
    });
  }

  componentDidMount() {
    const this_dewt = this;

    // Timebox UI
    async function drawAllTimeboxes(db) {
      const timeboxes = await allTimeboxesOnDate(db, iso8601date(date));

      for (let timebox of timeboxes) {
        drawTimebox(timebox);
      }
    }

    function drawTimebox(timebox) {
      const existingTimebox = document.querySelector(`article[data-timebox-id="${timebox.id}"]`);
      if (existingTimebox) {
        existingTimebox.remove();
      }

      if (timebox.date !== iso8601date(date)
        || timebox.startMinute < dayStartsAtMin
        || timebox.endMinute > dayStartsAtMin + totalMinutes
      ) {
        return;
      }

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

      document.querySelector('.timeboxes').appendChild(timeboxElement);
    }

    function openDraftTimeboxModal(startMinute) {
      if(modalBox && !modalBox.maybeRemove()) { return; }

      startMinute = startMinute - dayStartsAtMin;
      const endMinute = startMinute + 45;
      modalBox = new DraftTimeboxModal(document.querySelector('.timeboxes'), startMinute, endMinute);
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
          date: iso8601date(date),
          startMinute: Number(modalBox.constructor.element.style.getPropertyValue('--start-minute')) + dayStartsAtMin,
          endMinute: Number(modalBox.constructor.element.style.getPropertyValue('--end-minute')) + dayStartsAtMin
        });
        drawTimebox(timebox);
        modalBox.remove();
      } catch (e) {
        if (e instanceof ValidationError) {
          modalBox.flash();
          for (const error of e.errors) {
            this_dewt.addNotification(error, 'error');
          }
        } else {
          throw e;
        }
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
      } catch (e) {
        if (e instanceof ValidationError) {
          modalBox.flash();
          for (const error of e.errors) {
            this_dewt.addNotification(error, 'error');
          }
        } else {
          throw e;
        }
      }
    }

    function setUpAgendaListeners() {
      let mouseY;
      mainElement.addEventListener('mousemove', e => {
        mouseY = e.clientY;
      });

      mainElement.addEventListener('click', e => {
        // Use the fact that 1min == 1px.
        const agendaOffset = mainElement.getBoundingClientRect().y;
        const mousePosition = mouseY;
        const mouseAtMinute = mousePosition - agendaOffset + dayStartsAtMin;

        openDraftTimeboxModal(mouseAtMinute);
      });
    }
    dbPromise.then(drawAllTimeboxes);
    setUpAgendaListeners();
  }

  render() {
    return (
      <React.Fragment>
        <Notifications messages={this.state.notifications}
                       removeNotification={this.removeNotification} />
        <AgendaView totalMinutes={16 * 60}
                    dayStartsAtMin={6 * 60}
                    date={date}
                    setWorkhoursHandler={setWorkhoursHandler} />
      </React.Fragment>
    )
  }
}

ReactDOM.render(<Dewt/>, mainElement);
