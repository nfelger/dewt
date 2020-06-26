import React from 'react';

export default class Notifications extends React.Component {
  constructor(props) {
    super(props);

    this.clickHandler = this.clickHandler.bind(this);

    this.state = { hidden: new Set() };
  }

  clickHandler(key, e) {
    e.stopPropagation();

    this.setState(state => {
      const hidden = new Set(state.hidden);
      hidden.add(key);
      return { hidden };
    });

    setTimeout(() => {
      this.props.removeNotification(key);
      this.setState(state => {
        const hidden = new Set(state.hidden);
        hidden.delete(key);
        return { hidden };
      });
    }, 200);
  }

  render() {
    const className = (key, level) => {
      if (this.state.hidden.has(key)) {
        return ['notification', level, 'hide'].join(' ');
      } else {
        return ['notification', level].join(' ');
      }
    }

    return (
      <div className="notifications">
        {Array.from(this.props.messages, ([key, msg]) => {
          return (
            <div key={ key }
                 className={ className(key, msg.level) }
                 onClick={ this.clickHandler.bind(this, key) }>
              <p>{ msg.message }</p>
            </div>
          );
        })}
      </div>
    )
  }
}
