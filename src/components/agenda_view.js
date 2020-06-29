import React, { useState, useEffect, useRef } from 'react';
import { Hours, DayWidget, MajorLines, MinorLines, NowRule } from './calendar_scaffolding';
import Workhours from './workhours';
import Timebox from './timebox';
import DraftTimebox from './draft_timebox';
import { dbPromise } from '../database';
import { allTimeboxesOnDate } from '../timebox_data';

export default function AgendaView(props) {
  /* Modals */
  const [modalIsDirty, setModalIsDirty] = useState(false);
  const [modalIsFlashing, setModalIsFlashing] = useState(false);
  const [visibleModal, setVisibleModal] = useState(null);

	const handleModalOpenRequest = (modalIdentifier) => {
  	if (modalIsDirty) {
      setModalIsFlashing(true);
	    return false;
    } else {
      setVisibleModal(modalIdentifier);
      return true;
    }
  }

  const handleModalClose = () => {
    setVisibleModal(null);
    setModalIsDirty(false);
  }

  /* Draft Timeboxes */
  const dayStartsAtMin = props.dayStartsAtMin;
  const totalMinutes = props.totalMinutes;

  const mouseAtMinute = useRef();
  const handleMouseMove = (e) => {
    // Use the fact that 1min == 1px.
    const agendaOffset = e.currentTarget.getBoundingClientRect().y;
    const mousePosition = e.clientY;
    mouseAtMinute.current = mousePosition - agendaOffset + dayStartsAtMin;
  };

  const [draftTimeboxAtMinute, setDraftTimeboxAtMinute] = useState(null);
  const handleClick = () => {
    if(handleModalOpenRequest('draft-timebox')) {
      setDraftTimeboxAtMinute(mouseAtMinute.current);
    }
  }

  /* Timeboxes */
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
                     visibleModal={ visibleModal }
                     modalIsFlashing={ modalIsFlashing }
                     onModalFlashingDone={ () => setModalIsFlashing(false) }
                     onModalOpenRequest={ handleModalOpenRequest }
                     onModalDirtyChange={ setModalIsDirty }
                     onModalClose={ handleModalClose } />
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
                       onTimeboxCreateOrUpdate={ handleTimeboxCreateOrUpdate }
                       onTimeboxRemove={ handleTimeboxRemove }
                       visibleModal={ visibleModal }
                       modalIsFlashing={ modalIsFlashing }
                       onModalFlashingDone={ () => setModalIsFlashing(false) }
                       onModalOpenRequest={ handleModalOpenRequest }
                       onModalDirtyChange={ setModalIsDirty }
                       onModalClose={ handleModalClose } />)
          }
          { visibleModal === 'draft-timebox' && <DraftTimebox atMinute={ draftTimeboxAtMinute }
                                                              date={ props.date }
                                                              dayStartsAtMin={ dayStartsAtMin }
                                                              addNotification={ props.addNotification }
                                                              onTimeboxCreateOrUpdate={ handleTimeboxCreateOrUpdate }
                                                              flashing={ modalIsFlashing }
                                                              onFlashingDone={ () => setModalIsFlashing(false) }
                                                              onDirtyChange={ setModalIsDirty }
                                                              onClose={ handleModalClose } />
          }
        </div>
      </div>
    </div>
  )
}
