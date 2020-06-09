import * as d3 from 'd3'

const margin = { top: 30, left: 30, right: 30, bottom: 30 }
const height = 400 - margin.top - margin.bottom
const width = 680 - margin.left - margin.right

console.log('Building chart 3')

const svg = d3
  .select('#chart-03')
  .append('svg')
  .attr('height', height + margin.top + margin.bottom)
  .attr('width', width + margin.left + margin.right)
  .append('g')
  .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

// Create your scales
const xPositionScale = d3.scaleLinear().range([0, width])
const yPositionScale = d3.scaleLinear().range([height, 0])
const colorScale = d3.scaleOrdinal().range(['#1b9e77', '#d95f02', '#7570b3'])

// Do you need a d3.line function for this? Maybe something similar?
const area = d3
  .area()
  .x(d => xPositionScale(d.Year))
  .y0(height)
  .y1(d => yPositionScale(d.Value))

// Import your data file using d3.csv
d3.csv(require('../data/air-emissions.csv'))
  .then(ready)
  .catch(err => {
    console.log(err)
  })

function ready(datapoints) {
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
  // svg
  //   .selectAll('circle')
  //   .data(datapoints)
  //   .enter()
  //   .append('circle')
  //   .attr('cx', d => xPositionScale(d.Year))
  //   .attr('cy', d => yPositionScale(d.Value))
  //   .attr('r', 3)
  //   .attr('fill', d => colorScale(d.Country))

  // console.log('first element', nested[0])
  // console.log('all elements', nested)

  // Draw your areas
  svg
    .selectAll('path')
    .data(nested)
    .enter()
    .append('path')
    .attr('stroke', 'black')
    .attr('stroke-width', 1)
    .attr('fill', function(d) {
      // console.log('this nested thing is', d)
      return colorScale(d.key)
    })
    .attr('d', d => area(d.values))
    .attr('opacity', 0.5)

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

// import * as d3 from 'd3'

// const margin = { top: 30, left: 30, right: 30, bottom: 30 }
// const height = 400 - margin.top - margin.bottom
// const width = 680 - margin.left - margin.right

// console.log('Building chart 3')

// const svg = d3
//   .select('#chart-03')
//   .append('svg')
//   .attr('height', height + margin.top + margin.bottom)
//   .attr('width', width + margin.left + margin.right)
//   .append('g')
//   .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

// // Create your scales
// const xPositionScale = d3.scaleLinear().range([0, width])
// const yPositionScale = d3.scaleLinear().range([height, 0])
// const colorScale = d3.scaleOrdinal().range(['#1b9e77', '#d95f02', '#7570b3']) // here

// // Create a d3.line function
// const line = d3
//   .line()
//   .x(function(d) {
//     return xPositionScale(d.Year) // here
//   })
//   .y(function(d) {
//     return yPositionScale(d.Value) // here
//   })

// // Import your data file
// d3.csv(require('../data/air-emissions.csv')) // here
//   .then(ready)
//   .catch(err => {
//     console.log(err)
//   })

// function ready(datapoints) {
//   const nested = d3
//     .nest()
//     .key(d => d.Country) // Here
//     .entries(datapoints)

//   // console.log(nested)

//   const minYear = d3.min(datapoints, function(d) {
//     return d.Year // here
//   })
//   const maxYear = d3.max(datapoints, function(d) {
//     return d.Year // here
//   })

//   xPositionScale.domain([minYear, maxYear])
//   yPositionScale.domain([0, 500]) // here

//   // Draw your dots
//   svg
//     .selectAll('circle')
//     .data(datapoints)
//     .enter()
//     .append('circle')
//     .attr('cx', d => xPositionScale(d.Year)) // Here
//     .attr('cy', d => yPositionScale(d.Value))
//     .attr('r', 3)
//     .attr('fill', d => colorScale(d.Country)) // Here

//   // Draw your lines
//   // console.log('now we have', nested)
//   svg
//     .selectAll('path')
//     .data(nested)
//     .enter()
//     .append('path')
//     .attr('stroke', function(d) {
//       // console.log('next', d)
//       return colorScale(d.key)
//     })
//     .attr('stroke-width', 2)
//     .attr('fill', 'none')
//     .attr('d', function(d) {
//       // Takes all datapoints in that group
//       // And feeds them to the line generator we made before
//       console.log(d.values)
//       return line(d.values)
//     })

//   // Add your axes
//   const xAxis = d3.axisBottom(xPositionScale).tickFormat(d3.format('d'))
//   svg
//     .append('g')
//     .attr('class', 'axis x-axis')
//     .attr('transform', 'translate(0,' + height + ')')
//     .call(xAxis)

//   const yAxis = d3.axisLeft(yPositionScale).ticks(10) // here
//   svg
//     .append('g')
//     .attr('class', 'axis y-axis')
//     .call(yAxis)
// }
