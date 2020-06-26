import React from 'react';
import ReactDOM from 'react-dom';

import AgendaView from './agenda_view';
import EditTimeboxModal from './edit_timebox_modal';
import { flash } from './modal_box';
import { timeStrToMinutes, iso8601date, kebabToCamel } from './helpers';
import { dbPromise, addTestData, wipeAllDataAndReAddTestData } from './database';
import { ValidationError, allTimeboxesOnDate, loadTimebox, updateTimebox, deleteTimebox } from './timebox_data';

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

const mainElement = document.querySelector('main');
const totalMinutes = 16 * 60;
const dayStartsAtMin = 6 * 60;

class Dewt extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      notifications: new Map(),
      modalBox: null,  // only used for timeboxes
      modalBoxMaybeRemove: () => { return true }
    };

    this.addNotification = this.addNotification.bind(this);
    this.removeNotification = this.removeNotification.bind(this);

    this.setModalBoxMaybeRemove = this.setModalBoxMaybeRemove.bind(this);
    this.removeModalBox = this.removeModalBox.bind(this);

    this.timeboxAddedCallback = this.timeboxAddedCallback.bind(this);
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

  setModalBoxMaybeRemove(modalBoxMaybeRemove) {
    this.setState(() => { return { modalBoxMaybeRemove }; });
  }

  removeModalBox() {
    this.state.modalBox.remove();
    this.setState(() => { return {
      modalBox: null,
      modalBoxMaybeRemove: () => { return true; }
    }; });
  }

  timeboxAddedCallback(timebox) {
    this.drawTimebox(timebox);
  }

  drawTimebox(timebox) {
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

    timeboxElement.addEventListener('click', e => this.openTimeboxEditModal(e));

    document.querySelector('.timeboxes').appendChild(timeboxElement);
  }

  async openTimeboxEditModal(e) {
    // Stop clicks from bubbling to the agenda.
    e.stopPropagation();

    if(!this.state.modalBoxMaybeRemove()) { return; }

    const timeboxElement = e.currentTarget;
    const timeboxId = timeboxElement.dataset.timeboxId;

    const db = await dbPromise;
    const timebox = await loadTimebox(db, timeboxId);

    let modalBox = new EditTimeboxModal(timeboxElement, timeboxId, timebox);
    modalBox.constructor.element.querySelector('.delete-timebox a').addEventListener('click', async e => {
      e.preventDefault();
      await deleteTimebox(db, timeboxId);
      this.removeModalBox();
      timeboxElement.remove();
    });
    modalBox.constructor.element.querySelector('form').addEventListener('submit', e => this.submitEditTimebox(e));
    this.setState(() => {
      return {
        modalBox,
        modalBoxMaybeRemove: modalBox.maybeRemove.bind(modalBox)
      };
    });
  }


  async submitEditTimebox(e) {
    e.preventDefault();

    const form = this.state.modalBox.constructor.element.querySelector('form');
    if (!form.reportValidity()) {
      return;
    }

    const formControls = Array.from(this.state.modalBox.constructor.element.querySelectorAll('input'));
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

    const timeboxId = this.state.modalBox.constructor.element.dataset.timeboxId;
    const db = await dbPromise;
    try {
      const timebox = await updateTimebox(db, timeboxId, changedValues);
      this.drawTimebox(timebox);
      this.removeModalBox();
    } catch (e) {
      if (e instanceof ValidationError) {
        flash(this.state.modalBox.constructor.element);
        for (const error of e.errors) {
          this.addNotification(error, 'error');
        }
      } else {
        throw e;
      }
    }
  }

  componentDidMount() {
    const drawAllTimeboxes = async (db) => {
      const timeboxes = await allTimeboxesOnDate(db, iso8601date(date));

      for (let timebox of timeboxes) {
        this.drawTimebox(timebox);
      }
    };

    dbPromise.then(drawAllTimeboxes);
  }

  render() {
    return (
      <React.Fragment>
        <Notifications messages={ this.state.notifications }
                       removeNotification={ this.removeNotification } />
        <AgendaView totalMinutes={ 16 * 60 }
                    dayStartsAtMin={ 6 * 60 }
                    date={ date }
                    addNotification={ this.addNotification }
                    modalBoxMaybeRemove={ this.state.modalBoxMaybeRemove }
                    setModalBoxMaybeRemove={ this.setModalBoxMaybeRemove }
                    timeboxAddedCallback={ this.timeboxAddedCallback } />
      </React.Fragment>
    )
  }
}

ReactDOM.render(<Dewt/>, mainElement);
