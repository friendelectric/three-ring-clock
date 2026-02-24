let dimension = 800;
let canvasMargin, x, y;

const NUM_HOURS = 12;
const NUM_MINUTES = 60;

let sliderMinSize;    // min size
let sliderMaxSize;    // max size
let sliderOrbit;      // orbit
let sliderRingRatio;  // ring ratio: how far the middle ring sits inside the outer ring
let checkboxSeconds;  // show/hide the inner ring
let selectFillColor;  // dropdown to pick active circle fill color

function setup() {
  createCanvas(dimension, dimension);
  angleMode(DEGREES);
  textAlign(CENTER, CENTER);
  textFont('Courier New');

  // min size: range 4-40, default 18.
  sliderMinSize   = createSlider(4, 40, 18, 1);
  // max size: range 20-120, default 70.
  sliderMaxSize   = createSlider(20, 120, 70, 5);
  sliderOrbit     = createSlider(dimension * 0.1, dimension * 0.5, dimension * 0.38, 1);

  // ring ratio: fraction of orbit at which the middle ring is placed.
  // Range 0.20 to 0.95, default 0.58, step 0.01.
  // Stored as integers 20-95, divided by 100 in draw().
  sliderRingRatio = createSlider(20, 95, 58, 1);

  // Checkbox: show or hide the inner ring
  checkboxSeconds = createCheckbox('SHOW INNER RING', true);

  // Dropdown: fill color for active circles
  selectFillColor = createSelect();
  selectFillColor.option('#FFFFFF');
  selectFillColor.option('#FC5800');
  selectFillColor.selected('#FC5800');
}

function draw() {
  background('#2A2A2A');

  let hr  = hour() % 12; // convert 24h -> 12h
  let min = minute();
  let sec = second();

  // min size: the diameter of all inactive circles, and the fixed size of the inner ring indicator
  let minSize   = sliderMinSize.value();
  // max size: the diameter an active circle reaches at the end of its cycle
  let maxSize   = sliderMaxSize.value();
  // orbit: the radius of the outer ring (hours)
  let orbit     = sliderOrbit.value();
  // ring ratio: fraction of orbit at which the middle ring sits (e.g. 0.58 = 58% of orbit)
  let ringRatio = sliderRingRatio.value() / 100; // convert integer slider back to 0.20-0.95

  // Middle ring radius = orbit * ring ratio.
  // Inner ring radius = orbit * ring ratio / 2, always the innermost.
  let middleRingR = orbit * ringRatio;
  let innerRingR  = orbit * ringRatio / 2;

  // Parse the chosen hex color into r, g, b components for use with fill().
  // unhex() is p5's built-in that converts a hex string (e.g. "FC") to an integer (252).
  let hexColor = selectFillColor.value();
  let fillR    = unhex(hexColor.slice(1, 3));
  let fillG    = unhex(hexColor.slice(3, 5));
  let fillB    = unhex(hexColor.slice(5, 7));

  // Center X/Y position - in the middle of the canvas
  let cx = dimension / 2;
  let cy = dimension / 2;

  // --- ORBIT GUIDE RINGS ---
  noFill();
  stroke('#373737');
  strokeWeight(0.6);
  ellipse(cx, cy, orbit       * 2, orbit       * 2);
  ellipse(cx, cy, middleRingR * 2, middleRingR * 2);
  // Only draw the inner ring guide if the inner ring is visible
  if (checkboxSeconds.checked()) {
    ellipse(cx, cy, innerRingR * 2, innerRingR * 2);
  }

  // Center dot
  noStroke();
  fill('#464646');
  ellipse(cx, cy, 5, 5);

  // --- OUTER RING: hours (radius = orbit) ---
  // 12 circles evenly spaced: 360 / 12 = 30 degrees apart.
  // We subtract 90 so that hour 0 (12 o'clock) starts at the top
  // rather than the right (p5's default 0-degree direction is right).
  // The active circle grows from min size to max size as minutes pass,
  // using lerp() to interpolate: t=0.0 at min=0, t=1.0 at min=59.
  for (let i = 0; i < NUM_HOURS; i++) {
    let angle = i * 30 - 90; // 30 deg per hour, offset so 12 is at top
    x = cx + orbit * cos(angle);
    y = cy + orbit * sin(angle);
    let isCurrent = (i === hr);

    if (isCurrent) {
      let t = min / 59;                    // 0.0 at start of hour, 1.0 at 59 min
      let d = lerp(minSize, maxSize, t);   // size grows linearly from min size to max size
      noStroke();
      fill(fillR, fillG, fillB);
      ellipse(x, y, d, d);
    } else {
      stroke('#B9B9B9');
      strokeWeight(1.2);
      fill('#2A2A2A');
      ellipse(x, y, minSize, minSize);
      noStroke();
    }
  }

  // --- MIDDLE RING: minutes (radius = orbit * ring ratio) ---
  // 60 circles evenly spaced: 360 / 60 = 6 degrees apart.
  // Same -90 offset so minute 0 starts at the top.
  // The active circle grows from min size to max size as seconds pass,
  // using lerp() to interpolate: t=0.0 at sec=0, t=1.0 at sec=59.
  for (let i = 0; i < NUM_MINUTES; i++) {
    let angle = i * (360 / NUM_MINUTES) - 90; // 6 deg per minute, top-aligned
    x = cx + middleRingR * cos(angle);
    y = cy + middleRingR * sin(angle);
    let isCurrent = (i === min);

    if (isCurrent) {
      let t = sec / 59;                    // 0.0 at start of minute, 1.0 at 59 sec
      let d = lerp(minSize, maxSize, t);   // size grows linearly from min size to max size
      noStroke();
      fill(fillR, fillG, fillB);
      ellipse(x, y, d, d);
    } else {
      noStroke();
      noFill();
      ellipse(x, y, minSize, minSize);
    }
  }

  // --- INNER RING: seconds (radius = orbit * ring ratio / 2) ---
  // A single circle travels the full 360 degrees in 60 seconds:
  // 360 / 60 = 6 degrees per second.
  // Same -90 offset so second 0 starts at the top.
  // It stays fixed at min size and does not grow.
  if (checkboxSeconds.checked()) {
    let secAngle = sec * 6 - 90; // 6 deg per second, top-aligned
    x = cx + innerRingR * cos(secAngle);
    y = cy + innerRingR * sin(secAngle);
    noStroke();
    fill(fillR, fillG, fillB);
    ellipse(x, y, minSize, minSize);
  }

  // --- HEADER & FOOTER (drawn last so they sit on top of all circles) ---
  noStroke();
  fill('#FFFFFF');
  textSize(20);
  text('// THREE RINGS //', cx, 38);

  textSize(12);
  fill('#646464');
  let ts = pad(hour()) + ':' + pad(min) + ':' + pad(sec);
  text(ts + ' // min size: ' + minSize + 'px   max size: ' + maxSize + 'px   orbit: ' + orbit + 'px   ring ratio: ' + ringRatio.toFixed(2), cx, dimension - 26);
}


function pad(n) {
  return String(n).padStart(2, '0');
}