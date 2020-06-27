import React, { useRef, useEffect } from 'react';
import { dbPromise } from '../database';
import { createTimebox, ValidationError } from '../timebox_data';
import { flash } from '../helpers';

const DraftTimebox = React.forwardRef((props, ref) => {
  if (props.atMinute === null) { return null; }

  const startMinute = props.atMinute - props.dayStartsAtMin;
  const duration = 45;

  const detailsTextarea = useRef();
  useEffect(() => {
    detailsTextarea.current.focus();
  }, [props.atMinute]);

  const formElement = useRef();
  const changeHandler = (e) => {
    // Wire adding line breaks (from hitting enter but also from copy&paste) to a form submit.
    const endsInNewline = e.currentTarget.value.slice(-1) === '\n';
    e.currentTarget.value = e.currentTarget.value.replace(/\n/g, '');

    if (e.currentTarget.value !== "" && endsInNewline) {
      formElement.current.requestSubmit();
    }
  };

  const submitHandler = async (e) => {
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
        date: props.date,
        startMinute: props.atMinute,
        endMinute: props.atMinute + duration
      });

      props.timeboxAddedCallback(timebox);
      props.clearDraftTimebox();
    } catch (e) {
      if (e instanceof ValidationError) {
        flash(ref.current);
        for (const error of e.errors) {
          props.addNotification(error, 'error');
        }
      } else {
        throw e;
      }
    }
  };

  const escapeHandler = (e) => { if (e.key == "Escape") { props.clearDraftTimebox(); }};
  const closeBtnHandler = (e) => {
    e.stopPropagation();
    props.clearDraftTimebox();
  };

  return (
    <article ref={ ref }
             className="timebox timebox-draft"
             style={ {'--start-minute': startMinute, '--end-minute': startMinute + duration } }
             onKeyDown={ escapeHandler }
             onClick={ (e) => e.stopPropagation() } >
      <form ref={ formElement } action="" onSubmit={ submitHandler }>
        <textarea ref={ detailsTextarea }
                  name="details"
                  placeholder="Work on something deeply"
                  onChange={ changeHandler } />
        <button type="submit"></button>
      </form>
      <div className="closeBtn" onClick={ closeBtnHandler }>×</div>
    </article>
  )
});

export default DraftTimebox;
