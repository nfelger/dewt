import React, { useState, useRef, useEffect } from 'react';
import { timeStrToMinutes, minutesToTimeStr, isFormPristine } from '../helpers';
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
      <SetWorkhoursLink requestModalBoxRemovalRef={ props.requestModalBoxRemovalRef }
                        setRequestModalBoxRemoval={ props.setRequestModalBoxRemoval }
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
  const [showModal, setShowModal] = useState(false);

  const handleClick = (e) => {
    e.stopPropagation();
    if(!props.requestModalBoxRemovalRef.current()) { return; }

    setShowModal(true);
  };

  return (
    <React.Fragment>
      <div className="set-work-hours">
        <a href="#" onClick={ handleClick }>Set work hours</a>
      </div>
      { showModal && <WorkhoursModal workhours={ props.workhours }
                                     setWorkhours={ props.setWorkhours }
                                     removeModal={ () => setShowModal(false) }
                                     setRequestModalBoxRemoval={ props.setRequestModalBoxRemoval } /> }
    </React.Fragment>
  )
}

function WorkhoursModal(props) {
  const dirtyRef = useRef(false);

  const [flashing, setFlashing] = useState(false);

  useEffect(() => {
    props.setRequestModalBoxRemoval(() => () => {
      if (!dirtyRef.current) {
        props.removeModal();
        return true;
      } else {
        setFlashing(true);
        return false;
      }
    });

    return () => {
      props.setRequestModalBoxRemoval(() => () => true);
    };
  }, []);

  useEffect(() => {
    if (flashing) {
      const timeout = setTimeout(() => setFlashing(false), 800);
      return () => clearTimeout(timeout);
    }
  }, [flashing]);

  const handleChange = (e) => {
    dirtyRef.current = !isFormPristine(e.currentTarget);
  };

  const handleCancel = (e) => {
    e.preventDefault();
    props.removeModal();
  };

  const handleEscape = (e) => {
    if (e.key == "Escape") {
      props.removeModal();
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
    props.removeModal();
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
  const className = `work-hours-modal${flashing ? ' box-flash' : ''}`;

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
