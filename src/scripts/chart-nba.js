import * as d3 from 'd3'

// Create your margins and height/width
const margin = { top: 30, left: 30, right: 30, bottom: 30 }
const height = 400 - margin.top - margin.bottom
const width = 450 - margin.left - margin.right

// Add your svg
const svg = d3
  .select('#chart-nba')
  .append('svg')
  .attr('height', height + margin.top + margin.bottom)
  .attr('width', width + margin.left + margin.right)
  .append('g')
  .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

// Create your scales
const xPositionScale = d3.scaleLinear().range([0, width])
const yPositionScale = d3.scaleLinear().range([height, 0])
const radiusScale = d3.scaleSqrt().range([0, 7])
const colorScale = d3
  .scaleOrdinal()
  .range(['#7fc97f', '#beaed4', '#fdc086', '#ffff99'])

// Read in your housing price data
d3.csv(require('../data/player_stats.csv'))
  .then(ready)
  .catch(err => {
    console.log(err)
  })

// Write your ready function
function ready(datapoints) {
  // Define domains for scales
  const minPts = d3.min(datapoints, function(d) {
    return d.PPG
  })
  const maxPts = d3.max(datapoints, function(d) {
    return d.PPG
  })

  xPositionScale.domain([170, 230])
  yPositionScale.domain([60, 160])
  radiusScale.domain([minPts, maxPts])

  // Draw your dots
  svg
    .selectAll('circle')
    .data(datapoints)
    .enter()
    .append('circle')
    .attr('cx', d => xPositionScale(d.Height))
    .attr('cy', d => yPositionScale(d.Weight))
    .attr('r', d => radiusScale(d.PPG))
    .attr('fill', d => colorScale(d.Pos))
    .attr('opacity', 0.5)
    .attr('class', d => d.Pos)
    .on('mouseover', function(d, i) {
      console.log('mouseover on', this)
      d3.select(this).attr('stroke', 'black')
      d3.select('#player-name')
        .text(d.Name)
        .style('font-weight', 'bold')
        .style('font-size', 18)
      d3.select('#team-name').text(d.Team)
    })
    .on('mouseout', function(d, i) {
      console.log('mouseout', this)
      d3.select(this).attr('stroke', 'none')
      d3.select('#player-name').text('')
      d3.select('#team-name').text('')
    })

  // Interactive buttons
  d3.select('.btn-centers').on('click', function() {
    console.log('clicked')
    // first, make ALL rects grey
    svg.selectAll('.C').attr('fill', 'cyan')
  })

  d3.select('.btn-pointg').on('click', function() {
    console.log('clicked')
    // then make lowgdp rects blue
    svg.selectAll('.PG').attr('fill', 'cyan')
  })

  d3.select('.btn-20-pts').on('click', function() {
    console.log('clicked')
    // then make lowgdp rects blue
    svg.selectAll('circle').attr('fill', function(d) {
      if (+d.PPG >= 20) {
        return 'cyan'
      } else {
        return colorScale(d.Pos)
      }
    })
  })

  d3.select('.btn-reset').on('click', function() {
    console.log('clicked')
    // make ALL circles un-stroked
    svg.selectAll('circle').attr('fill', d => colorScale(d.Pos))
  })

  // Add your axes
  const xAxis = d3.axisBottom(xPositionScale)
  svg
    .append('g')
    .attr('class', 'axis x-axis')
    .attr('transform', 'translate(0,' + height + ')')
    .call(xAxis)

  const yAxis = d3.axisLeft(yPositionScale)
  svg
    .append('g')
    .attr('class', 'axis y-axis')
    .call(yAxis)
}
