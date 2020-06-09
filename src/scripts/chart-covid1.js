import * as d3 from 'd3'
import d3Tip from 'd3-tip'
import d3Annotation from 'd3-svg-annotation'

d3.tip = d3Tip

const margin = { top: 30, left: 100, right: 30, bottom: 30 }
const height = 400 - margin.top - margin.bottom
const width = 680 - margin.left - margin.right

console.log('Building COVID cases chart')

const svg = d3
  .select('#chart-covid1')
  .append('svg')
  .attr('height', height + margin.top + margin.bottom)
  .attr('width', width + margin.left + margin.right)
  .append('g')
  .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

// add clip-path so paths don't go outside axes
svg.append("defs").append("clipPath")
  .attr("id", "clip")
  .append("rect")
  .attr("width", width)
  .attr("height", height)

// Create your scales
const xPositionScale = d3.scaleLinear().range([0, width])
const yPositionScaleLin = d3.scaleLinear().range([height, 0])
const yPositionScaleLog = d3.scaleLog().range([height, 0])
const colorScale = d3
  .scaleOrdinal()
  .range([
    '#8dd3c7',
    '#ffffb3',
    '#bebada',
    '#fb8072',
    '#80b1d3',
    '#fdb462',
    '#b3de69'
  ])

// Create a time parser
const parseTime = d3.timeParse('%Y-%m-%d')

// D3 line for cases (linear)
const line = d3
  .line()
  .x(function(d) {
    return xPositionScale(d.datetime)
  })
  .y(function(d) {
    return yPositionScaleLin(+d.chartedValue)
  })

// D3 line for cases (log)
const logLine = d3
  .line()
  .x(function(d) {
    return xPositionScale(d.datetime)
  })
  .y(function(d) {
    return yPositionScaleLog(+d.chartedValue)
  })

const tip = d3
  .tip()
  .attr('class', 'd3-tip')
  .offset([0, -10])
  .html(function(d) {
    return `<strong>${d.Country_Region}</strong><br>
    ${d3.timeFormat("%B %d")(d.datetime)}: <span style='color:red'>${Math.round(d.chartedValue)}</span>`
  })

svg.call(tip)

d3.csv(require('../data/all.csv'))
  .then(ready)
  .catch(err => {
    console.log(err)
  })

function ready(datapoints) {
  // After we read in our data, we need to clean our datapoints
  // up a little bit. d.date is a string to begin with, but
  // treating a date like a string doesn't work well. So instead
  // we use parseTime (which we created up above) to turn it into a date.
  datapoints.forEach(function(d) {
    d.datetime = parseTime(d.Date)
  })

  // the data we work with is going to differ-- either cases or deaths
  // make two sub-dataframe with just those
  // we will make buttons that will toggle between them
  const dataCases = datapoints.map(function(d) {
    return {'datetime': d.datetime,
      'Country_Region': d.Country_Region,
      'chartedValue': +d.Confirmed}
  })
  // for deaths, transform 0 values to 0.1 (for log scale)
  const dataDeaths = datapoints.map(function(d) {
    if (+d.Deaths > 0)
    return {'datetime': d.datetime,
      'Country_Region': d.Country_Region,
      'chartedValue': +d.Deaths}
    else
    return {'datetime': d.datetime,
    'Country_Region': d.Country_Region,
    'chartedValue': 0.1}
  })

  // Update your scales
  const dates = datapoints.map(function(d) {
    return d.datetime
  })

  const cases = datapoints.map(function(d) {
    return +d.Confirmed
  })

  const deaths = datapoints.map(function(d) {
    return +d.Deaths
  })

  const minDate = d3.min(dates)
  const maxDate = d3.max(dates)
  const maxCases = d3.max(cases)
  const maxDeaths = d3.max(deaths)
  xPositionScale.domain([minDate, maxDate])
  yPositionScaleLin.domain([0, maxCases])
  yPositionScaleLog.domain([1, maxCases])

  // Set the default values that will be updated by buttons
  // start with dataCases as the default
  let dataDefault = dataCases
  // default y scale is linear
  let yPositionScaleDefault = yPositionScaleLin
  // default line is linear
  let lineDefault = line

  // Group your data together
  let nested = d3
    .nest()
    .key(d => d.Country_Region)
    .entries(dataDefault)

  // Draw your dots
  svg
    .selectAll('circle')
    .data(dataDefault)
    .enter()
    .append('circle')
    .attr('cx', d => xPositionScale(d.datetime))
    .attr('cy', d => yPositionScaleDefault(+d.chartedValue))
    .attr('r', 8)
    .attr('opacity', 0)
    .attr('fill', d => colorScale(d.Country_Region))
    .on('mouseover', function(d) {
      console.log('mouse-on')
      tip.show(d, this)
      d3.select(this)
        .attr('opacity', 1)
        .raise()
    })
    .on('mouseout', function(d) {
      tip.hide(d, this)
      d3.select(this)
        .attr('opacity', 0)
    })

  // Draw your lines
  svg
    .selectAll('path')
    .data(nested)
    .enter()
    .append('path')
    .attr("clip-path", "url(#clip)")
    .attr('fill', 'none')
    .attr('stroke-width', 2)
    .attr('stroke', d => colorScale(d.key))
    .attr('d', d => lineDefault(d.values))
    .attr('opacity', 1)

  // define a function that re-loads all elements based on new defaults
  // which will be define within the buttons
  function reRender(yPositionScaleDefault, lineDefault, dataDefault) {
    // revert to the default variables conditions defined above
    const yAxis = d3.axisLeft().scale(yPositionScaleDefault)
    svg.selectAll('.y-axis')
      .transition().duration(500)
      .call(yAxis)
    // redefine nested using the data default
    nested = d3
      .nest()
      .key(d => d.Country_Region)
      .entries(dataDefault)
    // toggle line to default
    svg.selectAll('path')
      .data(nested)
      .transition().duration(500)
      .attr('d', d => lineDefault(d.values))
    // toggle circles to default
    svg.selectAll('circle')
      .data(dataDefault)
      .attr('fill', d => colorScale(d.Country_Region))
      .attr('cx', d => xPositionScale(d.datetime))
      .attr('cy', d => yPositionScaleDefault(+d.chartedValue))
  }

  // Buttons for linear/ log scale
  d3.select('.btn-linear').on('click', function() {
    console.log('clicked linear')
    // set the default yPositionScale as Linear
    yPositionScaleDefault = yPositionScaleLin
    // set the default line as logLine
    lineDefault = line
    // re-render per the new defaults
    reRender(yPositionScaleDefault, lineDefault, dataDefault)
  })
  
  d3.select('.btn-log').on('click', function() {
    console.log('clicked log')
    // set the default yPositionScale as Log
    yPositionScaleDefault = yPositionScaleLog
    // set the default line as logLine
    lineDefault = logLine
    // re-render per the new defaults
    reRender(yPositionScaleDefault, lineDefault, dataDefault)
  })

  // Buttons for cases/ deaths
  d3.select('.btn-cases').on('click', function() {
    console.log('clicked cases')
    // update scaled to use case data
    yPositionScaleLin.domain([0, maxCases])
    yPositionScaleLog.domain([1, maxCases])
    // update default data to deaths
    dataDefault = dataCases
    // re-render with new defaults
    reRender(yPositionScaleDefault, lineDefault, dataDefault)
  })
  
  d3.select('.btn-deaths').on('click', function() {
    console.log('clicked deaths')
    // reset domains of scales
    yPositionScaleLin.domain([0, maxDeaths])
    yPositionScaleLog.domain([1, maxDeaths])
    // update default data to deaths
    dataDefault = dataDeaths
    // re-render with new defaults
    reRender(yPositionScaleDefault, lineDefault, dataDefault)
  })

  // Add your axes
  const xAxis = d3
    .axisBottom(xPositionScale)
    .tickFormat(d3.timeFormat('%m/%d'))
    .ticks(8)
  svg
    .append('g')
    .attr('class', 'axis x-axis')
    .attr('transform', 'translate(0,' + height + ')')
    .call(xAxis)

  // Make y-axis linear by default
  const yAxis = d3.axisLeft().scale(yPositionScaleLin)
  // .tickSize(-width)
  svg
    .append('g')
    .attr('class', 'axis y-axis')
    .call(yAxis)

  // svg.selectAll('.y-axis path').remove()
  // svg
  //   .selectAll('.y-axis line')
  //   .attr('stroke-dasharray', 2)
  //   .attr('stroke', 'grey')
}