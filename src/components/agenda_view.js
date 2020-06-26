import React, { useState, useEffect, useRef } from 'react';
import { iso8601date } from '../helpers';
import { dbPromise } from '../database';
import { loadWorkhours } from '../workhours_data';
import { isPristine, flash } from '../modal_box';
import { Hours, DayWidget, MajorLines, MinorLines, NowRule } from './calendar_scaffolding';
import { Workhours, SetWorkhours } from './workhours';
import DraftTimebox from './draft_timebox';

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
    if(!props.modalBoxMaybeRemove()) { return; }

    setDraftTimeboxAtMinute(mouseAtMinute);
  };

  const clearDraftTimebox = () => {
    setDraftTimeboxAtMinute(null);
    props.setModalBoxMaybeRemove(() => { return true; });
  };

  const draftTimeboxElement = useRef();
  useEffect(() => {
    if (!draftTimeboxAtMinute) { return; }

    props.setModalBoxMaybeRemove(() => {
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

  return (
    <div className='agenda'
         style={ {'--total-minutes': totalMinutes} }
         onMouseMove={ mouseMoveHandler }
         onClick={ clickHandler } >
      <div className="left">
        <Hours dayStartsAtMin={ dayStartsAtMin } totalMinutes={ totalMinutes }/>
        <DayWidget date={ props.date } />
      </div>
      <div className="main">
        <div className="agenda-backdrop">
          <Workhours workhours={ workhours } dayStartsAtMin={ dayStartsAtMin } />
          <MajorLines dayStartsAtMin={ dayStartsAtMin } totalMinutes={ totalMinutes } />
          <MinorLines dayStartsAtMin={ dayStartsAtMin } totalMinutes={ totalMinutes } />
          <NowRule offset={ dayStartsAtMin } maxMinute={ totalMinutes } />
        </div>
        <div className="timeboxes">
          <DraftTimebox ref={ draftTimeboxElement }
                        atMinute={ draftTimeboxAtMinute }
                        date={ props.date }
                        dayStartsAtMin={ dayStartsAtMin }
                        addNotification={ props.addNotification }
                        timeboxAddedCallback={ props.timeboxAddedCallback }
                        modalBoxMaybeRemove={ props.modalBoxMaybeRemove }
                        setModalBoxMaybeRemove={ props.setModalBoxMaybeRemove }
                        clearDraftTimebox={ clearDraftTimebox } />
        </div>
        <SetWorkhours modalBoxMaybeRemove={ props.modalBoxMaybeRemove }
                      setModalBoxMaybeRemove={ props.setModalBoxMaybeRemove }
                      workhours={ workhours }
                      setWorkhours={ setWorkhours } />
      </div>
    </div>
  )
}
