import * as d3 from 'd3'
import d3Tip from 'd3-tip'
import d3Annotation from 'd3-svg-annotation'

d3.tip = d3Tip

// Create your margins and height/width
const margin = { top: 20, left: 50, right: 20, bottom: 50 }
const height = 300 - margin.top - margin.bottom
const width = 200 - margin.left - margin.right

// I'll give you this part!
console.log('Building recovered/ active small multiples')

const container = d3.select('#chart-covid3')

// Create your scales
const xPositionScale = d3.scaleLinear().range([0, width])
const yPositionScale = d3.scaleLinear().range([height, 0])
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
const areaRec = d3
  .area()
  .x(d => xPositionScale(d.datetime))
  .y0(height)
  .y1(function(d) {
    return yPositionScale(+d.Confirmed)
  })

const areaAct = d3
  .area()
  .x(d => xPositionScale(d.datetime))
  .y0(height)
  .y1(d => yPositionScale(+d.Active))

const tipRec = d3
  .tip()
  .attr('class', 'd3-tip')
  .offset([0, -10])
  .html(function(d) {
    return `<strong>${d.Country_Region}</strong><br>
    ${d3.timeFormat("%B %d")(d.datetime)}: <span style='color:red'>${Math.round(d.Recovered)}</span>`
  })

const tipAct = d3
  .tip()
  .attr('class', 'd3-tip')
  .offset([0, -10])
  .html(function(d) {
    return `<strong>${d.Country_Region}</strong><br>
    ${d3.timeFormat("%B %d")(d.datetime)}: <span style='color:red'>${Math.round(d.Active)}</span>`
  })

// Read in your data
d3.csv(require('../data/all.csv'))
  .then(ready)
  .catch(err => {
    console.log(err)
  })

// Create your ready function
function ready(datapoints) {
    // After we read in our data, we need to clean our datapoints
    // up a little bit. d.date is a string to begin with, but
    // treating a date like a string doesn't work well. So instead
    // we use parseTime (which we created up above) to turn it into a date.
    datapoints.forEach(function(d) {
        d.datetime = parseTime(d.Date)
    })

  // Update your scales
  const dates = datapoints.map(d => d.datetime)
  const cases = datapoints.map(d => +d.Confirmed)

  const maxCases = d3.max(cases)
  xPositionScale.domain(d3.extent(dates))
  yPositionScale.domain([0, maxCases])

  // // stack the data?
  // const stack = d3.stack().keys(Country_Region)
  // const stackedData = stack(datapoints)
  // // console.log('first stacked data', stackedData)

  // // Copy the stack offsets back into the data
  // // Code below stolen from the internet
  // const newStackedData = []
  // stackedData.forEach((piece, index) => {
  //   console.log('piece', piece)
  //   const currentStack = []
  //   piece.forEach((d, i) => {
  //     currentStack.push({
  //       values: d,
  //       year: datapoints[i].datetime
  //     })
  //   })
  //   currentStack.key = piece.key
  //   currentStack.index = piece.index
  //   console.log('currentStack', currentStack)
  //   newStackedData.push(currentStack)
  // })

  // Group your data together
  const nested = d3
    .nest()
    .key(d => d.Country_Region)
    .entries(datapoints)

  // contain it
  container
    .selectAll('svg')
    .data(nested)
    .enter()
    .append('svg')
    .attr('height', height + margin.top + margin.bottom)
    .attr('width', width + margin.left + margin.right)
    .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
    .each(function(d) {
      // console.log(d)
      const name = d.key
      const datapoints = d.values

      // What SVG are we in? Let's grab it.
      const svg = d3.select(this)
      svg
        .append('path')
        .datum(datapoints)
        .attr('d', areaRec)
        .attr('fill', 'cyan')
        .attr('stroke', 'grey')
        .attr('stroke-width', 1)
        .attr('opacity', 0.5)

      svg
        .append('path')
        .datum(datapoints)
        .attr('d', areaAct)
        .attr('fill', 'red')
        .attr('stroke', 'grey')
        .attr('stroke-width', 1)
        .attr('opacity', 1)
        .raise()

      svg.call(tipRec)
      svg.call(tipAct)

      svg
        .append('text')
        .text(name)
        .attr('x', width / 2) // in the center
        .attr('text-anchor', 'middle') // center aligned
        .attr('dy', -10)
        .attr('font-size', 13)
        .attr('fill', '#9e4b6c')
        .attr('font-weight', 'bold')

    //   svg
    //     .append('text')
    //     .text('USA')
    //     .attr('x', xPositionScale(1985)) // above the second point
    //     .attr('text-anchor', 'middle') // center aligned
    //     .attr('y', function(d) {
    //       // Find the second datapoint
    //       const usa1985 = dataUsa[1]
    //       return yPositionScale(usa1985.income)
    //     })
    //     .attr('dy', -5)
    //     .attr('font-size', 11)
    //     .attr('fill', 'grey')

      const xAxis = d3
        .axisBottom(xPositionScale)
        .ticks(4)
        .tickFormat(d3.timeFormat('%m/%d'))
        // .tickSize(-height)
      svg
        .append('g')
        .attr('class', 'axis x-axis')
        .attr('transform', 'translate(0,' + height + ')')
        .call(xAxis)
        .selectAll('.tick line')
        .attr('stroke-dasharray', '2 2')
        .attr('stroke', 'grey')
      // svg.selectAll('.x-axis path').remove()
      const yAxis = d3
        .axisLeft(yPositionScale)
        // .tickValues([5000, 10000, 15000, 20000])
        // .tickFormat(d3.format('$,d'))
        .tickSize(-width)
      svg
        .append('g')
        .attr('class', 'axis y-axis')
        .call(yAxis)
        .selectAll('.tick line')
        .attr('stroke-dasharray', '2 2')
        .attr('stroke', 'grey')
      // svg.selectAll('.y-axis path').remove()
    })
}
