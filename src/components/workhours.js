import React, { useState, useRef, useEffect } from 'react';
import { timeStrToMinutes, minutesToTimeStr } from '../helpers';
import { dbPromise } from '../database';
import { loadWorkhours, saveWorkhours } from '../workhours_data';
import { validatesStartBeforeEnd } from '../form_validations';


export default function Workhours(props) {
  const [workhours, setWorkhours] = useState({ startMinute: 8 * 60, endMinute: 18 * 60 });
  useEffect(() => {
    dbPromise.then((db) => {
      loadWorkhours(db, props.date).then(setWorkhours);
    });
  }, [props.date]);

  return (
    <React.Fragment>
      <WorkhoursBackdrop workhours={ workhours }
                         dayStartsAtMin={ props.dayStartsAtMin } />
      <SetWorkhoursLink visibleModal={ props.visibleModal }
                        modalIsFlashing={ props.modalIsFlashing }
                        onModalFlashingDone={ props.onModalFlashingDone }
                        onModalOpenRequest={ props.onModalOpenRequest }
                        onModalDirtyChange={ props.onModalDirtyChange }
                        onModalClose={ props.onModalClose }
                        workhours={ workhours }
                        setWorkhours={ setWorkhours } />
    </React.Fragment>
  );
}

function WorkhoursBackdrop(props) {
  return (
    <div className="work-hours"
         style={{'--start-minute': props.workhours.startMinute - props.dayStartsAtMin,
                 '--end-minute': props.workhours.endMinute - props.dayStartsAtMin}} />
  )
}

function SetWorkhoursLink(props) {
  const modalIdentifier = 'set-work-hours';

  const handleClick = (e) => {
    e.stopPropagation();
    props.onModalOpenRequest(modalIdentifier);
  };

  return (
    <React.Fragment>
      <div className="set-work-hours">
        <a href="#" onClick={ handleClick }>Set work hours</a>
      </div>
      { props.visibleModal === modalIdentifier && <WorkhoursModal workhours={ props.workhours }
                                                                  setWorkhours={ props.setWorkhours }
                                                                  flashing={ props.modalIsFlashing }
                                                                  onDirtyChange={ props.onModalDirtyChange }
                                                                  onFlashingDone={ props.onModalFlashingDone }
                                                                  onClose={ props.onModalClose } /> }
    </React.Fragment>
  )
}

function WorkhoursModal(props) {
  useEffect(() => {
    if (props.flashing) {
      const timeout = setTimeout(() => props.onFlashingDone(), 800);
      return () => clearTimeout(timeout);
    }
  }, [props.flashing]);

  const handleChange = (e) => {
  	props.onDirtyChange(e.target.value !== e.target.defaultValue);
  };

  const className = `work-hours-modal${props.flashing ? ' box-flash' : ''}`;

  const handleCancel = (e) => {
    e.preventDefault();
    props.onClose();
  };

  const handleEscape = (e) => {
    if (e.key == "Escape") {
      props.onClose();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const workhours = {
      date: props.workhours.date,
      startMinute: timeStrToMinutes(formData.get('start')),
      endMinute: timeStrToMinutes(formData.get('end'))
    };
    const db = await dbPromise;
    await saveWorkhours(db, workhours);
    props.onClose();
    props.setWorkhours(workhours);
  };

  const startInput = useRef();
  const endInput = useRef();
  useEffect(() => {
    startInput.current.focus();
    startInput.current.addEventListener('input', validatesStartBeforeEnd(startInput.current, endInput.current));
    endInput.current.addEventListener('input', validatesStartBeforeEnd(startInput.current, endInput.current));
  }, []);

  const workhours = props.workhours;

  return (
    <div className={ className } onClick={ (e) => e.stopPropagation() } onKeyDown={ handleEscape } >
      <p>Set your working hours:</p>
      <form action="" onSubmit={ handleSubmit } onChange={ handleChange }>
        <fieldset>
          <ul>
            <li className="work-start">
              <label htmlFor="start">Start</label>
              <input ref={ startInput } type="text" name="start" required pattern="(2[0-3]|[0-1]?\d):[0-5]\d" title="hh:mm (24h time)" defaultValue={ minutesToTimeStr(workhours.startMinute) } />
            </li>
            <li className="work-end">
              <label htmlFor="end">End</label>
              <input ref={ endInput } type="text" name="end" required pattern="(2[0-3]|[0-1]?\d):[0-5]\d" title="hh:mm (24h time)" defaultValue={ minutesToTimeStr(workhours.endMinute) } />
            </li>
          </ul>
        </fieldset>
        <fieldset>
          <ul>
            <li><a href="#" onClick={ handleCancel }>Cancel</a></li>
            <li><button type="submit">Save</button></li>
          </ul>
        </fieldset>
      </form>
    </div>
  );
}
