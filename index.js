let delayInterval = 20;
let pointsToShow = 100;
let noiseMax = 0;
const RAW_DATA = [
  2534,2531,2536,2532,2533,2535,2533,2533,2531,2533,2530,2533,2531,2531,2530,2535,
  2536,2531,2530,2532,2529,2536,2530,2533,2532,2531,2530,2533,2528,2533,2534,2536,
  2531,2535,2527,2541,2530,2530,2533,2535,2530,2531,2531,2533,2531,2531,2534,2531,
  2531,2533,2530,2535,2533,2530,2531,2533,2529,2530,2531,2528,2532,2532,2528,2530,
  2533,2528,2532,2540,2529,2534,2533,2531,2541,2535,2541,2536,2541,2537,2530,2540,
  2535,2544,2532,2533,2540,2533,2531,2530,2540,2533,2530,2535,2535,2542,2534,2540,
  2535,2534,2535,2540,2542,2536,2542,2535,2532,2535,2542,2531,2538,2535,2541,2535,
  2535,2531,2536,2531,2530,2532,2532,2529,2530,2530,2531,2534,2529,2531,2530,2530,
  2533,2528,2532,2533,2529,2534,2534,2528,2535,2532,2540,2535,2535,2532,2543,2535,
  2532,2535,2540,2532,2535,2535,2540,2532,2535,2532,2539,2535,2532,2532,2535,2536,
  2532,2660,2566,2532,2535,2532,2532,2535,2540,2653,2591,2532,2540,2535,2532,2532,
  2540,2535,2532,2535,2542,2637,2787,2625,2532,2532,2540,2535,2532,2764,2778,2538,
  2532,2535,2535,2540,2535,2535,2532,2540,2535,2532,2535,2535,2532,2535,2544,2532,
  2535,2535,2532,2540,2535,2532,2535,2543,2532,2535,2744,2767,2765,2543,2535,2532,
  2535,2544,2532,2582,2550,2535,2535,2532,2535,2532,2539,2535,2532,2596,2535,2724,
  2540,2535,2535,2532,2543,2535,2532,2535,2540,2532,2535,2535,2540,2532,2734,2558,
  2540,2535,2535,2532,2543,2535,2532,2535,2540,2532,2535,2535,2707,2565,2535,2532,
  2540,2535,2535,2532,2542,2535,2532,2535,2561,2532,2532,2535,2539,2532,2535,2532,
  2645,2532,2544,2535,2532,2535,2535,2539,2535,2601,2658,2616,2535,2543,2532,2535,
  2535,2532,2674,2689,2553,2540,2532,2535,2532,2535,2542,2532,2532,2535,2540,2532,
  2535,2712,2722,2562,2539,2535,2532,2535,2532,2532,2540,2535,2532,2582,2596,2575,
  2535,2532,2535,2542,2532,2535,2535,2540,2623,2654,2634,2540,2532,2535,2535,2532,
  2535,2586,2592,2594,2533,2535,2535,2532,2535,2532,2540,2535,2535,2532,2544,2535,
  2532,2535,2532,2540,2535,2535,2532,2543,2535,2532,2535,2540,2532,2535,2535,2540,
  2532,2535,2532,2541,2535,2532,2532,2540,2535,2532,2535,2542,2532,2535,2535,2540,
  2535,2535,2532,2540,2535,2532,2535,2535,2532,2543,2535,2532,2535,2543,2532,2535, 2532, 2532
];

const features = [
  {
    name: '> Threshold',
    graphProps: {
      axis: 'y2',
      drawPoints: true, 
      strokeWidth: 2.0,
      color: 'rgba(255, 0, 0, 1)',
    },
    context: {
      threshold: 50,
      buffer: new Array(16),
      bufferIndex: 0,
      rollingMean: 0,
    },
    onNewData: function(value) {
      let {buffer, bufferIndex, rollingMean} = this.context;
      buffer[bufferIndex] = value;
      bufferIndex = (bufferIndex + 1) % 16;
      rollingMean = 0;
      for(let i = 0; i < buffer.length; i++) {
        if(buffer[i]) {
          rollingMean += buffer[i];
        }
      }
      rollingMean = rollingMean >> 4;
      this.context.bufferIndex = bufferIndex;
      this.context.rollingMean = rollingMean;
    },
    computeFeature: function(value) {
      let {rollingMean, threshold} = this.context;
      let noBias = (value > rollingMean ? value - rollingMean : 0);
      return noBias >= threshold;
    }
  },
  {
    name: 'Highest',
    graphProps: {
      axis: 'y2',
      drawPoints: true, 
      strokeWidth: 2.0,
      color: 'rgba(255, 0, 255, 1)',
    },
    context: {
      highest: 0
    },
    onNewData: function(value) {
      if(value > this.context.highest) { this.context.highest = value; }
    },
    computeFeature: function(value) {
      return value >= this.context.highest;
    }
  }
];
let data = [];
let timer;
let graph;
let tmpCapValue = 0;
let running = false;
let mode = 'linear';

const initData = function(data) {
  const length = data.length;
  data.forEach((d) => {
    addDataPoint(d, false);
  });
}

const distanceToCapVal = function(distance) {
  const MAX_VAL = 2800;
  const MIN_VAL = 2500;
  const RANGE = MAX_VAL - MIN_VAL;
  let proximity = 1 - distance;
  if(mode === 'logarithmic') {
    proximity = Math.log(proximity * 100 + 1) / Math.log(101);
  }
  else if(mode === 'exponential') {
    proximity = (2 / (distance + 1)) - 1;
  }
  const offset = proximity * RANGE;
  return Math.round(MIN_VAL + offset);
}

const updateDelayInterval = function(e) {
  const $target = $(e.target);
  delayInterval = parseInt($target.val(), 10);
  if(running) {
    stopSimulator();
    startSimulator();
  }
}

const updatePointsToShow = function(e) {
  const $target = $(e.target);
  pointsToShow = parseInt($target.val(), 10);
  redrawGraph();
}

const updateNoise = function(e) {
  const $target = $(e.target);
  noiseMax = parseInt($target.val(), 10);
}

const updateMode = function() {
  $selected = $('input[name="growth-type"]:checked');
  mode = $selected.val();
}

const updatePoint = function(e) {
  const $output = $('#output');
  const $target = $(e.target);
  const x = e.originalEvent.layerX; // X coordinate of mouse from left of page
  const y = e.originalEvent.layerY; // Y coordinate of mouse from top of page
  const targetX = $target.offset().left; // X coordinate of the target element
  const targetY = $target.offset().top; // Y coordinate of the target element
  const targetWidth = $target.width(); // Target element width
  const targetHeight = $target.height(); // Target element height
  const relativeX = x - targetX; // X coordinate of mouse relative to the target element
  const relativeY = y - targetY; // Y coordinate of mouse relative to the target element
  const xOffset = Math.abs(relativeX - Math.round(targetWidth / 2)); // X distance from center of target element
  const yOffset = Math.abs(relativeY - Math.round(targetHeight / 2)); // Y distance from center of target element
  const xOffsetFraction = xOffset / (targetWidth / 2); // Normalized X distance from center
  const yOffsetFraction = yOffset / (targetHeight / 2); // Normalized Y distance from center

  const distance = Math.sqrt(xOffsetFraction * xOffsetFraction + yOffsetFraction * yOffsetFraction) / Math.sqrt(2); // Normalized distance scalar from center
  tmpCapValue = distanceToCapVal(distance);
}

const startSimulator = function() {
  timer = setInterval(() => { 
    const valuePlusNoise = Math.round(tmpCapValue + 2 * Math.floor(Math.random() * noiseMax) - noiseMax / 2);
    addDataPoint(valuePlusNoise, true); 
  }, delayInterval);
  running = true;
}

const stopSimulator = function() {
  clearInterval(timer);
  running = false;
}

const addDataPoint = function(value, updateGraph) {
  let featureResults = [];
  features.forEach((feature, i) => {
    feature.onNewData(value);
    featureResults.push(feature.computeFeature(value) ? i/10 + 1 : null);
  });
  data.push([data.length, value].concat(featureResults));
  if(updateGraph) {
    redrawGraph();
  }
}

const redrawGraph = function() {
  const dataToDraw = (pointsToShow > 0 && pointsToShow < data.length ? data.slice(data.length - pointsToShow) : data);
  graph.updateOptions( { 'file': dataToDraw } );
}

$(document).ready(function() {
  const graphContainer = document.getElementById('graph-container');
  const $touchSimulator = $('.touch-simulator');
  const $radioButtons = $('input[name="growth-type"]');
  const $startSimulatorButton = $('.start-simulator');
  const $stopSimulatorButton = $('.stop-simulator');
  const $delayInput = $('.delay-input');
  const $pointsToShowInput = $('.points-to-show-input');
  const $noiseInput = $('.noise-input');

  // Assign event listeners
  $touchSimulator.on('mousemove', updatePoint);
  // $touchSimulator.on('mouseover', startSimulator);
  // $touchSimulator.on('mouseout', stopSimulator);
  $touchSimulator.on('mouseout', () => {
    // Ensure the value always reverts to the minimum when the mouse leaves the touch simulator region
    tmpCapValue = distanceToCapVal(1);
  })
  $startSimulatorButton.on('click', startSimulator);
  $stopSimulatorButton.on('click', stopSimulator);
  $radioButtons.on('change', updateMode);
  $delayInput.on('change', updateDelayInterval);
  $pointsToShowInput.on('change', updatePointsToShow);
  $noiseInput.on('change', updateNoise);

  // Init
  tmpCapValue = distanceToCapVal(1);
  initData(RAW_DATA);

  // Draw graph
  let labels = ['Sample #', 'Raw'];
  let series = {};
  for(let i = 0; i < features.length; i++) {
    const feature = features[i];
    labels.push(feature.name);
    series[feature.name] = feature.graphProps;
  }
  graph = new Dygraph(graphContainer, data,
  {
    drawPoints: false,
    showRangeSelector: true,
    xRangePad: 10,
    showRoller: false,
    labels: labels,
    series : series,
    axes: {
      'y2': {
        valueRange: [0, features.length/10 + 2],
        showInRangeSelector: false,
      }
    },
    showInRangeSelector: {
      'Raw': false,
      '>Threshold': false,
      '>Threshold2': false
    }
  });

  // Update graph rendering
  updateMode();
  updateDelayInterval({target: $delayInput});
  updatePointsToShow({target: $pointsToShowInput});
  updateNoise({target: $noiseInput});
});