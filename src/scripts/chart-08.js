import * as d3 from 'd3'

// I'll give you margins/height/width
const margin = { top: 100, left: 10, right: 10, bottom: 30 }
const height = 500 - margin.top - margin.bottom
const width = 400 - margin.left - margin.right

// And grabbing your container
const container = d3.select('#chart-08')

// Create your scales
xPositionScale = d3
  .scaleLinear()
  .domain(['Extremely Cold', 'Cold', 'Normal', 'Hot', 'Extremely Hot'])
  .range([0, width])
yPositionScale = d3.scaleLinear().range([height, 0])
colorScale = d3.scaleOrdinal().range()

// Create your area generator

// Read in your data, then call ready

// Write your ready function
