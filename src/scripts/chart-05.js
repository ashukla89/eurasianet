import * as d3 from 'd3'

// Set up margin/height/width
const margin = { top: 100, left: 30, right: 100, bottom: 30 }
const height = 680 - margin.top - margin.bottom
const width = 500 - margin.left - margin.right

// Add your svg
console.log('Building chart 5')

const svg = d3
  .select('#chart-05')
  .append('svg')
  .attr('height', height + margin.top + margin.bottom)
  .attr('width', width + margin.left + margin.right)
  .append('g')
  .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

// Create a time parser (see hints)
const parseTime = d3.timeParse('%B-%y') // evaluate
// console.log(parseTime('August-17'))

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
    '#b3de69',
    '#fccde5',
    '#d9d9d9',
    '#bc80bd'
  ])

// Create a d3.line function that uses your scales
const line = d3
  .line()
  .x(d => xPositionScale(d.datetime))
  .y(d => yPositionScale(d.price))

// Read in your housing price data
d3.csv(require('../data/housing-prices.csv'))
  .then(ready)
  .catch(err => {
    console.log(err)
  })

// Write your ready function
function ready(datapoints) {
  // Convert your months to dates
  datapoints.forEach(d => {
    d.datetime = parseTime(d.month)
  })

  // Get a list of dates and a list of prices
  const dates = datapoints.map(d => d.datetime)
  const prices = datapoints.map(d => d.price)

  xPositionScale.domain(d3.extent(dates))
  yPositionScale.domain(d3.extent(prices))

  // Group your data together
  const nested = d3
    .nest()
    .key(d => d.region)
    .entries(datapoints)

  // Draw your lines
  svg
    .selectAll('path')
    .data(nested)
    .enter()
    .append('path')
    .attr('fill', 'none')
    .attr('stroke-width', 2)
    .attr('stroke', d => colorScale(d.key))
    .attr('d', d => line(d.values))
    .attr('opacity', 1)

  // Add your text on the right-hand side
  svg
    .selectAll('text')
    .data(nested)
    .enter()
    .append('text')
    .text(d => d.key)
    .attr('x', width)
    .attr('y', function(d) {
      const datapoints = d.values
      // Find the last datapoint
      const lastMonth = datapoints[0]

      // Use the yPositionScale and the high temperature
      // of December to position our text
      return yPositionScale(lastMonth.price)
    })
    .attr('font-size', 10)
    .attr('dx', 5) // offset of 5 pixels to the right
    // .attr('dy', function(d) {
    //   // nothing needed here
    // })
    .attr('alignment-baseline', 'middle')
    .attr('fill', 'black')

  // Draw your dots
  svg
    .selectAll('circle')
    .data(nested)
    .enter()
    .append('circle')
    .attr('cx', width)
    .attr('cy', function(d) {
      const datapoints = d.values
      // Find the last datapoint
      const lastMonth = datapoints[0]

      // Use the yPositionScale and the high temperature
      // of December to position our text
      return yPositionScale(lastMonth.price)
    })
    .attr('r', 3)
    .attr('fill', d => colorScale(d.key))

  // Add your title
  svg
    .append('text')
    .text('U.S. housing prices fall in winter')
    .attr('x', width / 2) // in the center
    .attr('text-anchor', 'middle') // center aligned
    .attr('dy', -30)
    .attr('font-size', 20)

  // Add the shaded rectangle
  svg
    .append('rect')
    .attr('x', d => xPositionScale(parseTime('December-16')))
    .attr('y', 0)
    .attr('width', function(d) {
      return (
        xPositionScale(parseTime('February-17')) -
        xPositionScale(parseTime('December-16'))
      )
    })
    .attr('height', height)
    .attr('fill', 'lightgrey')
    .lower()

  // Add your axes
  const xAxis = d3.axisBottom(xPositionScale).tickFormat(d3.timeFormat('%b %y'))
  svg
    .append('g')
    .attr('class', 'axis x-axis')
    .attr('transform', 'translate(0,' + height + ')')
    .call(xAxis)

  const yAxis = d3.axisLeft(yPositionScale).ticks(7)
  svg
    .append('g')
    .attr('class', 'axis y-axis')
    .call(yAxis)
}
