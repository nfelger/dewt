import React, { useState, useRef, useEffect } from 'react';
import { timeStrToMinutes, minutesToTimeStr, isFormPristine, flash } from '../helpers';
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
      <SetWorkhoursLink modalBoxMaybeRemoveRef={ props.modalBoxMaybeRemoveRef }
                    setModalBoxMaybeRemove={ props.setModalBoxMaybeRemove }
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
  const [showForm, setShowForm] = useState(false);
  const modalBoxElement = useRef();

  const clickHandler = (e) => {
    e.stopPropagation();
    if(!props.modalBoxMaybeRemoveRef.current()) { return; }

    setShowForm(true);

    props.setModalBoxMaybeRemove(() => () => {
      if (!modalBoxElement.current) { return true; }

      if (isFormPristine(modalBoxElement.current)) {
        hideForm();
        return true;
      } else {
        flash(modalBoxElement.current);
        return false;
      }
    });
  };

  const hideForm = () => {
    setShowForm(false);
    props.setModalBoxMaybeRemove(() => () => true);
  };

  return (
    <React.Fragment>
      <div className="set-work-hours">
        <a href="#" onClick={clickHandler}>Set work hours</a>
      </div>
      { showForm && <WorkhoursModal ref={ modalBoxElement }
                                    workhours={ props.workhours }
                                    setWorkhours={ props.setWorkhours }
                                    hideForm={ hideForm } /> }
    </React.Fragment>
  )
}

const WorkhoursModal = React.forwardRef((props, ref) => {
  const cancelHandler = (e) => {
    e.preventDefault();
    props.hideForm();
  };

  const escapeHandler = (e) => {
    if (e.key == "Escape") {
      props.hideForm();
    }
  };

  const submitHandler = async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const workhours = {
      date: props.workhours.date,
      startMinute: timeStrToMinutes(formData.get('start')),
      endMinute: timeStrToMinutes(formData.get('end'))
    };
    const db = await dbPromise;
    await saveWorkhours(db, workhours);
    props.hideForm();
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
    <div ref={ ref } className='work-hours-modal' onClick={ (e) => e.stopPropagation() } onKeyDown={ escapeHandler } >
      <p>Set your working hours:</p>
      <form action="" onSubmit={ submitHandler }>
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
            <li><a href="#" onClick={ cancelHandler }>Cancel</a></li>
            <li><button type="submit">Save</button></li>
          </ul>
        </fieldset>
      </form>
    </div>
  );
});
