import * as d3 from 'd3'
import { maxHeaderSize } from 'http'

// Set up margin/height/width
const margin = { top: 20, left: 25, right: 20, bottom: 25 }
const height = 100 - margin.top - margin.bottom
const width = 90 - margin.left - margin.right

// I'll give you the container
console.log('Building chart 6')

const container = d3.select('#chart-06')

// Create your scales
const xPositionScale = d3.scaleLinear().range([0, width])
const yPositionScale = d3.scaleLinear().range([height, 0])

// Create a d3.line function that uses your scales
const areaJp = d3
  .area()
  .x(d => xPositionScale(d.Age))
  .y0(height)
  .y1(d => yPositionScale(d.ASFR_jp))

const areaUs = d3
  .area()
  .x(d => xPositionScale(d.Age))
  .y0(height)
  .y1(d => yPositionScale(d.ASFR_us))

// Read in your data
d3.csv(require('../data/fertility.csv'))
  .then(ready)
  .catch(err => {
    console.log(err)
  })

// Build your ready function that draws lines, axes, etc
function ready(datapoints) {
  // Get a list of dates and a list of prices
  const ages = datapoints.map(d => d.Age)

  xPositionScale.domain(d3.extent(ages))
  yPositionScale.domain([0, 0.3])

  // Group your data together
  const nested = d3
    .nest()
    .key(d => d.Year)
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
      const fertJp = datapoints.map(d => d.ASFR_jp)
      const fertUs = datapoints.map(d => d.ASFR_us)
      const sumJp = d3.sum(fertJp)
      const sumUs = d3.sum(fertUs)
      // What SVG are we in? Let's grab it.
      const svg = d3.select(this)
      svg
        .append('path')
        .datum(datapoints)
        .attr('d', areaJp)
        .attr('fill', 'red')
        .attr('stroke', 'none')
        .attr('opacity', 0.5)

      svg
        .append('path')
        .datum(datapoints)
        .attr('d', areaUs)
        .attr('fill', 'cyan')
        .attr('stroke', 'none')
        .attr('opacity', 0.5)
        .lower()

      svg
        .append('text')
        .text(name)
        .attr('x', width / 2) // in the center
        .attr('text-anchor', 'middle') // center aligned
        .attr('dy', -5)
        .attr('font-size', 10)

      svg
        .append('text')
        .text(sumJp.toFixed(2))
        .attr('x', function(d) {
          // Above age 45
          return xPositionScale(45)
        }) // in the center
        .attr('text-anchor', 'middle') // center aligned
        .attr('y', yPositionScale(0.2))
        .attr('dy', 5)
        .attr('font-size', 9)
        .attr('fill', 'red')

      svg
        .append('text')
        .text(sumUs.toFixed(2))
        .attr('x', function(d) {
          // Above age 45
          return xPositionScale(45)
        }) // in the center
        .attr('text-anchor', 'middle') // center aligned
        .attr('y', yPositionScale(0.2))
        .attr('dy', -5)
        .attr('font-size', 9)
        .attr('fill', 'cyan')

      const xAxis = d3.axisBottom(xPositionScale).tickValues([15, 30, 45])
      svg
        .append('g')
        .attr('class', 'axis x-axis')
        .attr('transform', 'translate(0,' + height + ')')
        .call(xAxis)
        .selectAll('text')
        .style('font-size', 9)
      const yAxis = d3.axisLeft(yPositionScale).ticks(4)
      svg
        .append('g')
        .attr('class', 'axis y-axis')
        .call(yAxis)
        .selectAll('text')
        .style('font-size', 9)
    })
}
