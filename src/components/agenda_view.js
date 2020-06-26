import React, { useState, useEffect, useRef } from 'react';
import { Hours, DayWidget, MajorLines, MinorLines, NowRule } from './calendar_scaffolding';
import { Workhours, SetWorkhours } from './workhours';
import DraftTimebox from './draft_timebox';
import { dbPromise } from '../database';
import { ValidationError, allTimeboxesOnDate, deleteTimebox, loadTimebox, updateTimebox } from '../timebox_data';
import { loadWorkhours } from '../workhours_data';
import { iso8601date, kebabToCamel, timeStrToMinutes } from '../helpers';
import { isPristine, flash } from '../modal_box';
import EditTimeboxModal from '../edit_timebox_modal';

export default function AgendaView(props) {
  const dayStartsAtMin = props.dayStartsAtMin;
  const totalMinutes = props.totalMinutes;

  const [workhours, setWorkhours] = useState({ startMinute: 8 * 60, endMinute: 18 * 60 });
  useEffect(() => {
    dbPromise.then((db) => {
      loadWorkhours(db, iso8601date(props.date)).then(setWorkhours);
    });
  }, [props.date]);

  const [mouseAtMinute, setMouseAtMinute] = useState(0);
  const mouseMoveHandler = (e) => {
    // Use the fact that 1min == 1px.
    const agendaOffset = e.currentTarget.getBoundingClientRect().y;
    const mousePosition = e.clientY;
    const mouseAtMinute = mousePosition - agendaOffset + dayStartsAtMin;

    setMouseAtMinute(mouseAtMinute);
  };

  const [draftTimeboxAtMinute, setDraftTimeboxAtMinute] = useState(null);
  const clickHandler = () => {
    if(!modalBoxMaybeRemoveRef.current()) { return; }

    setDraftTimeboxAtMinute(mouseAtMinute);
  };

  const clearDraftTimebox = () => {
    setDraftTimeboxAtMinute(null);
    setModalBoxMaybeRemove(() => () => true);
  };

  const draftTimeboxElement = useRef();
  useEffect(() => {
    if (!draftTimeboxAtMinute) { return; }

    setModalBoxMaybeRemove(() => () => {
      if (!draftTimeboxAtMinute) { return true; }

      if (isPristine(draftTimeboxElement.current)) {
        clearDraftTimebox();
        return true;
      } else {
        flash(draftTimeboxElement.current);
        return false;
      }
    });
  }, [draftTimeboxAtMinute]);

  const [editModal, setEditModal] = useState(null);
  const editModalRef = useRef(null);
  editModalRef.current = editModal;
  const [modalBoxMaybeRemove, setModalBoxMaybeRemove] = useState(() => () => true);
  const modalBoxMaybeRemoveRef = useRef(null);
  modalBoxMaybeRemoveRef.current = modalBoxMaybeRemove;

  const removeModalBox = () => {
    editModalRef.current.remove();
    setEditModal(null);
    setModalBoxMaybeRemove(() => () => true);
  };

  const timeboxAddedCallback = (timebox) => {
    drawTimebox(timebox);
  };

  const drawTimebox = (timebox) => {
    const existingTimebox = document.querySelector(`article[data-timebox-id="${timebox.id}"]`);
    if (existingTimebox) {
      existingTimebox.remove();
    }

    if (timebox.date !== iso8601date(props.date)
      || timebox.startMinute < props.dayStartsAtMin
      || timebox.endMinute > props.dayStartsAtMin + props.totalMinutes
    ) {
      return;
    }

    const timeboxElement = document.createElement('article');
    timeboxElement.classList.add('timebox', `theme-color-${timebox.themeColor}`);
    timeboxElement.style.setProperty('--start-minute', timebox.startMinute - props.dayStartsAtMin);
    timeboxElement.style.setProperty('--end-minute', timebox.endMinute - props.dayStartsAtMin);

    const details = document.createElement('h4');
    details.textContent = timebox.details;
    timeboxElement.appendChild(details);

    const project = document.createElement('h5');
    project.textContent = timebox.project;
    timeboxElement.appendChild(project);

    timeboxElement.dataset.timeboxId = timebox.id;

    timeboxElement.addEventListener('click', openTimeboxEditModal);

    document.querySelector('.timeboxes').appendChild(timeboxElement);
  };

  const openTimeboxEditModal = async (e) => {
    // Stop clicks from bubbling to the agenda.
    e.stopPropagation();

    if(!modalBoxMaybeRemoveRef.current()) { return; }

    const timeboxElement = e.currentTarget;
    const timeboxId = timeboxElement.dataset.timeboxId;

    const db = await dbPromise;
    const timebox = await loadTimebox(db, timeboxId);

    let modalBox = new EditTimeboxModal(timeboxElement, timeboxId, timebox);
    modalBox.constructor.element.querySelector('.delete-timebox a').addEventListener('click', async e => {
      e.preventDefault();
      await deleteTimebox(db, timeboxId);
      removeModalBox();
      timeboxElement.remove();
    });
    modalBox.constructor.element.querySelector('form').addEventListener('submit', submitEditTimebox);
    setEditModal(modalBox);
    setModalBoxMaybeRemove(() => modalBox.maybeRemove.bind(modalBox));
  };

  const submitEditTimebox = async (e) =>{
    e.preventDefault();

    const form = editModalRef.current.constructor.element.querySelector('form');
    if (!form.reportValidity()) {
      return;
    }

    const formControls = Array.from(editModalRef.current.constructor.element.querySelectorAll('input'));
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

    const timeboxId = editModalRef.current.constructor.element.dataset.timeboxId;
    const db = await dbPromise;
    try {
      const timebox = await updateTimebox(db, timeboxId, changedValues);
      drawTimebox(timebox);
      removeModalBox();
    } catch (e) {
      if (e instanceof ValidationError) {
        flash(editModalRef.current.constructor.element);
        for (const error of e.errors) {
          props.addNotification(error, 'error');
        }
      } else {
        throw e;
      }
    }
  };

  useEffect(() => {
    dbPromise.then(async (db) => {
      const timeboxes = await allTimeboxesOnDate(db, iso8601date(props.date));

      for (let timebox of timeboxes) {
        drawTimebox(timebox);
      }
    });
  }, []);

  return (
    <div className='agenda'
         style={ {'--total-minutes': totalMinutes} }
         onMouseMove={ mouseMoveHandler }
         onClick={ clickHandler } >
      <div className="left">
        <Hours dayStartsAtMin={ dayStartsAtMin }
               totalMinutes={ totalMinutes }/>
        <DayWidget date={ props.date } />
      </div>
      <div className="main">
        <div className="agenda-backdrop">
          <Workhours workhours={ workhours }
                     dayStartsAtMin={ dayStartsAtMin } />
          <MajorLines dayStartsAtMin={ dayStartsAtMin }
                      totalMinutes={ totalMinutes } />
          <MinorLines dayStartsAtMin={ dayStartsAtMin }
                      totalMinutes={ totalMinutes } />
          <NowRule offset={ dayStartsAtMin }
                   maxMinute={ totalMinutes } />
        </div>
        <div className="timeboxes">
          <DraftTimebox ref={ draftTimeboxElement }
                        atMinute={ draftTimeboxAtMinute }
                        date={ props.date }
                        dayStartsAtMin={ dayStartsAtMin }
                        addNotification={ props.addNotification }
                        timeboxAddedCallback={ timeboxAddedCallback }
                        modalBoxMaybeRemoveRef={ modalBoxMaybeRemoveRef }
                        setModalBoxMaybeRemove={ setModalBoxMaybeRemove }
                        clearDraftTimebox={ clearDraftTimebox } />
        </div>
        <SetWorkhours modalBoxMaybeRemoveRef={ modalBoxMaybeRemoveRef }
                      setModalBoxMaybeRemove={ setModalBoxMaybeRemove }
                      workhours={ workhours }
                      setWorkhours={ setWorkhours } />
      </div>
    </div>
  )
}
