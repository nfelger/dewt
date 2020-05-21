const agenda = document.querySelector('.agenda');
const hoursToDraw = Number.parseInt(agenda.style.getPropertyValue('--hours-to-draw'));

function drawCalendarDate(calendarDate) {
  const dateFmtOptions = { month:'short', weekday:'short' };
  const [weekday, month] = new Intl.DateTimeFormat('en-US', dateFmtOptions)
    .formatToParts(calendarDate)
    .filter(({type}) => Object.keys(dateFmtOptions).includes(type))
    .map(({value}) => value);
  const date = calendarDate.getDate();

  const dayElements = document.querySelectorAll('.day p');
  dayElements[0].textContent = weekday;
  dayElements[1].textContent = date;
  dayElements[2].textContent = month;
}

function drawTimeHints() {
  const startingPoint = Number.parseInt(
    agenda.style.getPropertyValue('--day-starts-at-minute'));
  const endPoint = startingPoint + hoursToDraw * 60;

  function drawHours() {

  }

  function drawLinesEvery60Min(className, firstLineAfter) {
    for (let min = startingPoint + firstLineAfter; min <= endPoint; min += 60) {
      const line = document.createElement('div');
      line.className = className;
      line.style.setProperty('--start-minute', min);
      agenda.appendChild(line);
    }
  }

  function drawMajorLines() {
    const firstLineAfter = 60 - startingPoint % 60;
    drawLinesEvery60Min('rule-major', firstLineAfter)
  }

  function drawMinorLines() {
    let firstLineAfter;

    if (startingPoint % 60 < 30) {
      firstLineAfter = 30 - startingPoint % 30;
    } else {
      firstLineAfter = 60 - (startingPoint - 30) % 60;
    }

    drawLinesEvery60Min('rule-minor', firstLineAfter);
  }

  function drawNowRule() {

  }

  drawHours();
  drawMajorLines();
  drawMinorLines();
  drawNowRule();
}

drawCalendarDate(new Date());
drawTimeHints();
