import React, { useState, useEffect, useRef } from 'react';
import { range, iso8601date, timeStrToMinutes, minutesToTimeStr } from './helpers';
import { dbPromise } from './database';
import { loadWorkhours, saveWorkhours } from './workhours_data';
import { isPristine, flash } from './modal_box';
import { validatesStartBeforeEnd } from './form_validations';
import { createTimebox, ValidationError } from './timebox_data';

class DayWidget extends React.Component {
  constructor(props) {
    super(props);

    const dateFmtOptions = { month: 'short', weekday: 'short' };
    [this.weekday, this.month] = new Intl.DateTimeFormat('en-US', dateFmtOptions)
      .formatToParts(this.props.date)
      .filter(({ type }) => Object.keys(dateFmtOptions).includes(type))
      .map(({ value }) => value);

    this.dayNum = this.props.date.getDate();
  }

  render() {
    return (
      <div className="day">
        <p>{this.weekday}</p>
        <p className="day-number">{this.dayNum}</p>
        <p>{this.month}</p>
      </div>
    )
  }
}

class NowRule extends React.Component {
  constructor(props) {
    super(props);

    this.state = {currentMinute: 0};
  }

  componentDidMount() {
    const now = new Date();
    this.setState({currentMinute: now.getHours() * 60 + now.getMinutes() - this.props.offset});

    this.timeout = setTimeout(() => {
      const now = new Date();
      this.setState({currentMinute: now.getHours() * 60 + now.getMinutes() - this.props.offset});

    }, 60000);
  }

  componentWillUnmount() {
    clearTimeout(this.timeout);
  }

  render() {
    if (this.state.currentMinute >= this.props.maxMinute) { return null; }

    return <div className='rule-now' style={{'--start-minute': this.state.currentMinute}}/>;
  }
}

class Hours extends React.Component {
  render() {
    const start = 60 - this.props.dayStartsAtMin % 60;
    const end = this.props.totalMinutes;
    const step = 60;

    const renderHour = (min) => {
      return (
        <h3 key={min}
            className='time-hint'
            style={{'--start-minute': min, '--end-minute': min + 59}}>
          {(this.props.dayStartsAtMin + min) / 60}<sup>00</sup>
        </h3>
      )
    };

    return (
      <div className="hours">
        {range(start, end, step).map(renderHour)}
      </div>
    )
  }
}

function _renderLines(start, end, className) {
  const step = 60;

  const renderLine = (min) => { return <div className={className} key={min} style={{'--start-minute': min}} /> };

  return range(start, end, step).map(renderLine);
}

class MajorLines extends React.Component {
  render() {
    const start = 60 - this.props.dayStartsAtMin % 60;
    const end = this.props.totalMinutes;

    return _renderLines(start, end, 'rule-major');
  }
}

class MinorLines extends React.Component {
  render() {
    let start;
    const end = this.props.totalMinutes;

    if (this.props.dayStartsAtMin % 60 < 30) {
      start = 30 - this.props.dayStartsAtMin % 30;
    } else {
      start = 60 - (this.props.dayStartsAtMin - 30) % 60;
    }

    return _renderLines(start, end, 'rule-minor');
  }
}

function SetWorkhours(props) {
  const [showForm, setShowForm] = useState(false);
  const modalBoxElement = useRef();

  const clickHandler = (e) => {
    e.stopPropagation();
    if(!props.modalBoxMaybeRemove()) { return; }

    setShowForm(true);

    props.setModalBoxMaybeRemove(() => {
      if (!modalBoxElement.current) { return true; }

      if (isPristine(modalBoxElement.current)) {
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
    props.setModalBoxMaybeRemove(() => { return true; });
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

function Workhours(props) {
  return (
    <div className="work-hours"
         style={{'--start-minute': props.workhours.startMinute - props.dayStartsAtMin,
                 '--end-minute': props.workhours.endMinute - props.dayStartsAtMin}} />
  )
}

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
        date: iso8601date(props.date),
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
