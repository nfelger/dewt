import React, { useState, useEffect, useRef } from 'react';
import { Hours, DayWidget, MajorLines, MinorLines, NowRule } from './calendar_scaffolding';
import Workhours from './workhours';
import Timebox from './timebox';
import DraftTimebox from './draft_timebox';
import { dbPromise } from '../database';
import { allTimeboxesOnDate } from '../timebox_data';
import { isFormPristine, flash } from '../helpers';

export default function AgendaView(props) {
  const dayStartsAtMin = props.dayStartsAtMin;
  const totalMinutes = props.totalMinutes;

  const mouseAtMinute = useRef();
  const handleMouseMove = (e) => {
    // Use the fact that 1min == 1px.
    const agendaOffset = e.currentTarget.getBoundingClientRect().y;
    const mousePosition = e.clientY;
    mouseAtMinute.current = mousePosition - agendaOffset + dayStartsAtMin;
  };

  const [requestModalBoxRemoval, setRequestModalBoxRemoval] = useState(() => () => true);
  const requestModalBoxRemovalRef = useRef(null);
  requestModalBoxRemovalRef.current = requestModalBoxRemoval;

  const [draftTimeboxAtMinute, setDraftTimeboxAtMinute] = useState(null);
  const handleClick = () => {
    if(!requestModalBoxRemovalRef.current()) { return; }

    setDraftTimeboxAtMinute(mouseAtMinute.current);
  };

  const removeDraftTimebox = () => {
    setDraftTimeboxAtMinute(null);
    setRequestModalBoxRemoval(() => () => true);
  };

  const draftTimeboxElement = useRef();
  useEffect(() => {
    if (!draftTimeboxAtMinute) { return; }

    setRequestModalBoxRemoval(() => () => {
      if (!draftTimeboxAtMinute) { return true; }

      if (isFormPristine(draftTimeboxElement.current)) {
        removeDraftTimebox();
        return true;
      } else {
        flash(draftTimeboxElement.current);
        return false;
      }
    });
  }, [draftTimeboxAtMinute]);

  const [timeboxes, setTimeboxes] = useState(new Map());

  const handleTimeboxCreateOrUpdate = timebox => setTimeboxes(timeboxes => {
    if (timebox.date === props.date) {
      return new Map(timeboxes).set(timebox.id, timebox);
    } else {
      const nextTimeboxes = new Map(timeboxes)
      nextTimeboxes.delete(timebox.id);
      return nextTimeboxes;
    }
  });

  const handleTimeboxRemove = (timeboxId) => {
    setTimeboxes(prevTimeboxes => {
      const timeboxes = new Map(prevTimeboxes)
      timeboxes.delete(timeboxId);
      return timeboxes;
    });
  };

  useEffect(() => {
    dbPromise.then(async (db) => {
      const dbTimeboxes = await allTimeboxesOnDate(db, props.date);
      const displayableTimeboxes = dbTimeboxes.filter(timebox => (
        timebox.startMinute >= props.dayStartsAtMin
        && timebox.endMinute < props.dayStartsAtMin + props.totalMinutes
      ));
      const timeboxes = new Map(displayableTimeboxes.map(timebox => [timebox.id, timebox]));
      setTimeboxes(timeboxes);
    });
  }, [props.date]);

  return (
    <div className='agenda'
         style={ {'--total-minutes': totalMinutes} }
         onMouseMove={ handleMouseMove }
         onClick={ handleClick } >
      <div className="left">
        <Hours dayStartsAtMin={ dayStartsAtMin }
               totalMinutes={ totalMinutes }/>
        <DayWidget date={ props.date } />
      </div>
      <div className="main">
        <div className="agenda-backdrop">
          <Workhours date={ props.date }
                     dayStartsAtMin={ dayStartsAtMin }
                     requestModalBoxRemovalRef={ requestModalBoxRemovalRef }
                     setRequestModalBoxRemoval={ setRequestModalBoxRemoval } />
          <MajorLines dayStartsAtMin={ dayStartsAtMin }
                      totalMinutes={ totalMinutes } />
          <MinorLines dayStartsAtMin={ dayStartsAtMin }
                      totalMinutes={ totalMinutes } />
          <NowRule offset={ dayStartsAtMin }
                   maxMinute={ totalMinutes } />
        </div>
        <div className="timeboxes">
          {
            Array.from(timeboxes.values(), timebox =>
              <Timebox key={ timebox.id }
                       timebox={ timebox }
                       dayStartsAtMin={ dayStartsAtMin }
                       addNotification={ props.addNotification }
                       handleTimeboxCreateOrUpdate={ handleTimeboxCreateOrUpdate } //
                       handleTimeboxRemove={ handleTimeboxRemove }//
                       requestModalBoxRemovalRef={ requestModalBoxRemovalRef }
                       setRequestModalBoxRemoval={ setRequestModalBoxRemoval } />)
          }
          <DraftTimebox ref={ draftTimeboxElement }
                        atMinute={ draftTimeboxAtMinute }
                        date={ props.date }
                        dayStartsAtMin={ dayStartsAtMin }
                        addNotification={ props.addNotification }
                        handleTimeboxCreateOrUpdate={ handleTimeboxCreateOrUpdate }
                        clearDraftTimebox={ removeDraftTimebox } />
        </div>
      </div>
    </div>
  )
}
