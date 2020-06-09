import * as d3 from 'd3'

const margin = { top: 30, left: 30, right: 100, bottom: 30 }
const height = 400 - margin.top - margin.bottom
const width = 680 - margin.left - margin.right

console.log('Building chart 4')

const svg = d3
  .select('#chart-04')
  .append('svg')
  .attr('height', height + margin.top + margin.bottom)
  .attr('width', width + margin.left + margin.right)
  .append('g')
  .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

// Create your scales
const xPositionScale = d3.scaleLinear().range([0, width])
const yPositionScale = d3.scaleLinear().range([height, 0])
// const colorScale = d3.scaleOrdinal().range(['#1b9e77', '#d95f02', '#7570b3'])

// Do you need a d3.line function for this? Maybe something similar?
const line = d3
  .line()
  .x(d => xPositionScale(d.Year))
  .y(d => yPositionScale(+d.Value))

// Import your data file using d3.csv
d3.csv(require('../data/air-emissions.csv'))
  .then(ready)
  .catch(err => {
    console.log(err)
  })

function ready(datapoints) {
  // Draw it all
  const nested = d3
    .nest()
    .key(d => d.Country)
    .entries(datapoints)

  const minYear = d3.min(datapoints, function(d) {
    return d.Year
  })
  const maxYear = d3.max(datapoints, function(d) {
    return d.Year
  })

  xPositionScale.domain([minYear, maxYear])
  yPositionScale.domain([0, 500])

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
      const lastYear = datapoints[datapoints.length - 1]

      // '+' forces it to numeric; is read in as string
      // console.log('Final year is', lastYear.Year)

      // Use the yPositionScale and the high temperature
      // of December to position our text
      return yPositionScale(lastYear.Value)
    })
    .attr('r', 3)
    .attr('fill', function(d) {
      if (d.key === 'France') {
        return 'blue'
      } else {
        return 'grey'
      }
    })

  // Draw your lines
  svg
    .selectAll('path')
    .data(nested)
    .enter()
    .append('path')
    .attr('fill', 'none')
    .attr('stroke-width', 1)
    .attr('stroke', function(d) {
      if (d.key === 'France') {
        return 'blue'
      } else {
        return 'grey'
      }
    })
    .attr('d', d => line(d.values))
    .attr('opacity', 2)

  // Add text
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
      const lastYear = datapoints[datapoints.length - 1]

      // Use the yPositionScale and the high temperature
      // of December to position our text
      return yPositionScale(lastYear.Value)
    })
    .attr('font-size', 12)
    .attr('dx', 5) // offset of 5 pixels to the right
    // .attr('dy', function(d) {
    //   // nothing needed here
    // })
    .attr('alignment-baseline', 'middle')
    .attr('fill', function(d) {
      if (d.key === 'France') {
        return 'blue'
      } else {
        return 'grey'
      }
    })

  // Add your axes
  const xAxis = d3.axisBottom(xPositionScale).tickFormat(d3.format('d'))
  svg
    .append('g')
    .attr('class', 'axis x-axis')
    .attr('transform', 'translate(0,' + height + ')')
    .call(xAxis)

  const yAxis = d3.axisLeft(yPositionScale).ticks(10)
  svg
    .append('g')
    .attr('class', 'axis y-axis')
    .call(yAxis)
}
