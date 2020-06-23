import React from 'react';

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

export default class AgendaView extends React.Component {
  _renderHours() {
    let hours = [];
    const firstFullHour = 60 - this.props.dayStartsAtMin % 60;
    for (let min = firstFullHour; min < this.props.totalMinutes; min += 60) {
      hours.push(
        <h3 className='time-hint'
            style={{'--start-minute': min, '--end-minute': min + 59}}
            key={min}>
          {(this.props.dayStartsAtMin + min) / 60}
          <sup>00</sup>
        </h3>)
    }
    return hours;
  }

  _renderLinesEvery60Min(className, firstLineAfter) {
    let lines = [];
    for (let min = firstLineAfter; min < this.props.totalMinutes; min += 60) {
      lines.push(<div className={className} style={{'--start-minute': min}} key={min} />);
    }
    return lines;
  }

  _renderMajorLines() {
    const firstLineAfter = 60 - this.props.dayStartsAtMin % 60;
    return this._renderLinesEvery60Min('rule-major', firstLineAfter);
  }

  _renderMinorLines() {
    let firstLineAfter;

    if (this.props.dayStartsAtMin % 60 < 30) {
      firstLineAfter = 30 - this.props.dayStartsAtMin % 30;
    } else {
      firstLineAfter = 60 - (this.props.dayStartsAtMin - 30) % 60;
    }

    return this._renderLinesEvery60Min('rule-minor', firstLineAfter);
  }

  render() {
    return (
      <div className='agenda' style={{'--total-minutes': this.props.totalMinutes}} >
        <div className="left">
          <div className="hours">
            {this._renderHours()}
          </div>
          <DayWidget date={this.props.date} />
        </div>
        <div className="main">
          <div className="set-work-hours">
            <a href="#" onClick={this.props.setWorkhoursHandler}>Set work hours</a>
          </div>
          <div className="agenda-backdrop">
            <div className="work-hours"></div>
            {this._renderMajorLines()}
            {this._renderMinorLines()}
            <NowRule maxMinute={this.props.totalMinutes}
                     offset={this.props.dayStartsAtMin} />
          </div>
          <div className="timeboxes"></div>
        </div>
      </div>)
  }
}
