import * as d3 from 'd3'

// Create your margins and height/width
const margin = { top: 20, left: 50, right: 20, bottom: 50 }
const height = 300 - margin.top - margin.bottom
const width = 200 - margin.left - margin.right

// I'll give you this part!
console.log('Building chart 7')

const container = d3.select('#chart-07')

// Create your scales
const xPositionScale = d3.scaleLinear().range([0, width])
const yPositionScale = d3.scaleLinear().range([height, 0])

// Create your line generator
const line = d3
  .line()
  .x(d => xPositionScale(d.year))
  .y(d => yPositionScale(d.income))

// Read in your data
Promise.all([
  d3.csv(require('../data/middle-class-income-usa.csv')),
  d3.csv(require('../data/middle-class-income.csv'))
]).then(ready)
//   .catch(err => {
//     console.log(err)
//   })

// Create your ready function
function ready([dataUsa, dataOther]) {
  // Get a list of dates and a list of prices
  const years = dataOther.map(d => d.year)

  xPositionScale.domain(d3.extent(years))
  yPositionScale.domain([0, 20000])

  // Group your data together
  const nested = d3
    .nest()
    .key(d => d.country)
    .entries(dataOther)

  // console.log(nested)

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
      const dataOther = d.values

      // console.log('this country is', dataOther)

      // What SVG are we in? Let's grab it.
      const svg = d3.select(this)
      svg
        .append('path')
        .datum(dataOther)
        .attr('d', line)
        .attr('fill', 'none')
        .attr('stroke', '#9e4b6c')
        .attr('stroke-width', 2)
        .lower()

      svg
        .append('path')
        .datum(dataUsa)
        .attr('d', line)
        .attr('fill', 'none')
        .attr('stroke', 'grey')
        .attr('stroke-width', 2)
        .lower()

      svg
        .append('text')
        .text(name)
        .attr('x', width / 2) // in the center
        .attr('text-anchor', 'middle') // center aligned
        .attr('dy', -10)
        .attr('font-size', 13)
        .attr('fill', '#9e4b6c')
        .attr('font-weight', 'bold')

      svg
        .append('text')
        .text('USA')
        .attr('x', xPositionScale(1985)) // above the second point
        .attr('text-anchor', 'middle') // center aligned
        .attr('y', function(d) {
          // Find the second datapoint
          const usa1985 = dataUsa[1]
          return yPositionScale(usa1985.income)
        })
        .attr('dy', -5)
        .attr('font-size', 11)
        .attr('fill', 'grey')

      const xAxis = d3
        .axisBottom(xPositionScale)
        .ticks(4)
        .tickFormat(d3.format('d'))
        .tickSize(-height)
      svg
        .append('g')
        .attr('class', 'axis x-axis')
        .attr('transform', 'translate(0,' + height + ')')
        .call(xAxis)
        .selectAll('.tick line')
        .attr('stroke-dasharray', '2 2')
        .attr('stroke', 'grey')
      svg.selectAll('.x-axis path').remove()
      const yAxis = d3
        .axisLeft(yPositionScale)
        .tickValues([5000, 10000, 15000, 20000])
        .tickFormat(d3.format('$,d'))
        .tickSize(-width)
      svg
        .append('g')
        .attr('class', 'axis y-axis')
        .call(yAxis)
        .selectAll('.tick line')
        .attr('stroke-dasharray', '2 2')
        .attr('stroke', 'grey')
      svg.selectAll('.y-axis path').remove()
    })
}
