import React from 'react';
import { range, dateFromISO8601Str } from "../helpers";

export class DayWidget extends React.Component {
  constructor(props) {
    super(props);

    const date = dateFromISO8601Str(props.date);

    const dateFmtOptions = { month: 'short', weekday: 'short' };
    [this.weekday, this.month] = new Intl.DateTimeFormat('en-US', dateFmtOptions)
      .formatToParts(date)
      .filter(({ type }) => Object.keys(dateFmtOptions).includes(type))
      .map(({ value }) => value);

    this.dayNum = date.getDate();
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

export class NowRule extends React.Component {
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

export class Hours extends React.Component {
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

export class MajorLines extends React.Component {
  render() {
    const start = 60 - this.props.dayStartsAtMin % 60;
    const end = this.props.totalMinutes;

    return _renderLines(start, end, 'rule-major');
  }
}

export class MinorLines extends React.Component {
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
