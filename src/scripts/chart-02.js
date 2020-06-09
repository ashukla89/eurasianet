import * as d3 from 'd3'

const margin = { top: 30, left: 30, right: 30, bottom: 30 }
const height = 400 - margin.top - margin.bottom
const width = 680 - margin.left - margin.right

console.log('Building chart 2')

const svg = d3
  .select('#chart-02')
  .append('svg')
  .attr('height', height + margin.top + margin.bottom)
  .attr('width', width + margin.left + margin.right)
  .append('g')
  .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

// Create your scales
const xPositionScale = d3.scaleLinear().range([0, width])
const yPositionScale = d3.scaleLinear().range([height, 0])
const colorScale = d3
  .scaleOrdinal()
  // .domain(['Australia', 'Korea', 'Estonia', 'Indonesia', 'Colombia'])
  .range(['#7fc97f', '#beaed4', '#fdc086', '#ffff99', '#386cb0'])

// Create a d3.line function
const line = d3
  .line()
  .x(function(d) {
    return xPositionScale(d.TIME)
  })
  .y(function(d) {
    return yPositionScale(d.Value)
  })

// Import your data file
d3.csv(require('../data/alcohol-consumption.csv'))
  .then(ready)
  .catch(err => {
    console.log(err)
  })

function ready(datapoints) {
  const nested = d3
    .nest()
    .key(d => d.LOCATION)
    .entries(datapoints)

  // console.log(nested)

  const minYear = d3.min(datapoints, function(d) {
    return d.TIME
  })
  const maxYear = d3.max(datapoints, function(d) {
    return d.TIME
  })
  const maxVal = d3.max(datapoints, function(d) {
    return +d.Value
  })

  xPositionScale.domain([minYear, maxYear])
  yPositionScale.domain([0, maxVal])

  // Draw your dots
  svg
    .selectAll('circle')
    .data(datapoints)
    .enter()
    .append('circle')
    .attr('cx', d => xPositionScale(d.TIME))
    .attr('cy', d => yPositionScale(d.Value))
    .attr('r', 3)
    .attr('fill', d => colorScale(d.LOCATION))

  // Draw your lines
  // console.log('now we have', nested)
  svg
    .selectAll('path')
    .data(nested)
    .enter()
    .append('path')
    .attr('stroke', function(d) {
      // console.log('next', d)
      return colorScale(d.key)
    })
    .attr('stroke-width', 2)
    .attr('fill', 'none')
    .attr('d', function(d) {
      // Takes all datapoints in that group
      // And feeds them to the line generator we made before
      // console.log(d.values)
      return line(d.values)
    })

  // Add your axes
  const xAxis = d3.axisBottom(xPositionScale).tickFormat(d3.format('d'))
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
