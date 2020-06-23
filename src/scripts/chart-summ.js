import * as d3 from 'd3'
import d3Tip from 'd3-tip'
import d3Annotation from 'd3-svg-annotation'

d3.tip = d3Tip

const margin = { top: 30, left: 50, right: 30, bottom: 60 }
const height = 450 - margin.top - margin.bottom
const width = 600 - margin.left - margin.right

console.log('Building Combined Chart')

const svg = d3
  .select('#chart-summ')
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
  .domain([
    "Armenia",
    "Azerbaijan",
    "Georgia",
    "Kazakhstan",
    "Kyrgyzstan",
    "Tajikistan",
    "Uzbekistan"
  ])
  .range([
    '#FA9C29',
    '#007ED4',
    '#FFFFFF',
    '#36C4BE',
    '#EC1E29',
    '#FBE57A',
    '#28AB32'
  ])

// Create a time parser
const parseTime = d3.timeParse('%Y-%m-%d')

// D3 line for cases (linear)
const line = d3
  .line()
  .x(function(d) {
    return xPositionScale(d.chartedTime)
  })
  .y(function(d) {
    return yPositionScaleLin(+d.chartedValue)
  })

// D3 line for cases (log)
const logLine = d3
  .line()
  .x(function(d) {
    return xPositionScale(d.chartedTime)
  })
  .y(function(d) {
    return yPositionScaleLog(+d.chartedValue)
  })

// default timeframe for x-axis
let time = "dates"

// define tip
const tip = d3
  .tip()
  .attr('class', 'd3-tip')
  .direction('w')
  .offset([0, -10])
  .html(function(d) {
    if (time === "dates") {
      return `<strong>${d.Country_Region}</strong><br>
      ${d3.timeFormat("%B %d")(d.chartedTime)}: <span style='color:red'>${d3.format(",")(Math.round(d.chartedValue))}</span>`
    }
    else if (time === "days") {
      return `<strong>${d.Country_Region}</strong><br>
      Day ${d.chartedTime}: <span style='color:red'>${d3.format(",")(Math.round(d.chartedValue))}</span>`
    }
  })

svg.call(tip)

// Read in your data
Promise.all([
    d3.csv(require('../data/all.csv')),
    d3.csv(require('../data/since.csv'))
  ]).then(ready)
  .catch(err => {
    console.log(err)
  })

function ready([dataDate, dataSince]) {
  // After we read in our data, we need to clean our datapoints
  // up a little bit. d.date is a string to begin with, but
  // treating a date like a string doesn't work well. So instead
  // we use parseTime (which we created up above) to turn it into a date.
  dataDate.forEach(function(d) {
    d.datetime = parseTime(d.Date)
  })

  ///// Update your scales /////
  // First determine the range of metrics you need for this
  const dates = dataDate.map(d => d.datetime)
  const days = dataSince.map(d => +d.days_since_100)
  const cases = dataDate.map(d => +d.Confirmed)
  const deaths = dataDate.map(d => +d.Deaths)
  const changeCases = dataSince.map(d => +d.Confirmed_change_7day)

  // Then define min/ max where needed
  const maxCases = d3.max(cases)
  const maxDeaths = d3.max(deaths)
  const maxChange  = d3.max(changeCases)

  // Then update the scales
  xPositionScale.domain(d3.extent(dates))
  yPositionScaleLin.domain([0, maxCases])
  yPositionScaleLog.domain([1, maxCases])

  // the data we work with is going to differ-- either cases, deaths,
  // or a rolling 7-day avg of cases.
  // make three sub-dataframe with just those
  // we will make buttons that will toggle between them
  let dataCasesDate = dataDate.map(function(d) {
    return {'chartedTime': d.datetime,
      'Country_Region': d.Country_Region,
      'chartedValue': +d.Confirmed}
  })
  // for deaths, transform 0 values to 0.1 (for log scale)
  let dataDeathsDate = dataDate.map(function(d) {
    if (+d.Deaths > 0)
    return {'chartedTime': d.datetime,
      'Country_Region': d.Country_Region,
      'chartedValue': +d.Deaths}
    else
    return {'chartedTime': d.datetime,
    'Country_Region': d.Country_Region,
    'chartedValue': 0.1}
  })
  // now do the same but for the since-100-days data
  // we will make buttons that will toggle between them
  let dataCasesSince = dataSince.map(function(d) {
    return {'chartedTime': +d.days_since_100,
      'Country_Region': d.Country_Region,
      'chartedValue': +d.Confirmed}
  })
  // for deaths, transform 0 values to 0.1 (for log scale)
  let dataDeathsSince = dataSince.map(function(d) {
    if (+d.Deaths > 0)
    return {'chartedTime': +d.days_since_100,
      'Country_Region': d.Country_Region,
      'chartedValue': +d.Deaths}
    else
    return {'chartedTime': +d.days_since_100,
    'Country_Region': d.Country_Region,
    'chartedValue': 0.1}
  })
  // for 7-day rolling
  let dataRolling = dataSince.map(function(d) {
    if (+d.Confirmed_change_7day > 0)
    return {'chartedTime': +d.days_since_100,
      'Country_Region': d.Country_Region,
      'chartedValue': +d.Confirmed_change_7day}
    else
    return {'chartedTime': +d.days_since_100,
      'Country_Region': d.Country_Region,
      'chartedValue': 0.1}
  })

  // Set the default conditions that will be updated by buttons
  // default metric
  let metric = "cases"
  // default scale for y-axis
  let metricFormat = "linear"
  // start with dataCasesDate as the default
  let dataDefault = dataCasesDate
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
    .attr('class', 'd-circle')
    .attr('cx', d => xPositionScale(d.chartedTime))
    .attr('cy', d => yPositionScaleDefault(+d.chartedValue))
    .attr('r', 6)
    .attr('opacity', 0)
    .attr('fill', 'white')
    .attr('stroke', d => colorScale(d.Country_Region))
    .attr('stroke-width', 2)
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
  
  // Add source text
  svg
    .append('a')
    .attr("xlink:href", "https://github.com/CSSEGISandData/COVID-19")
    .append('text')
    .attr('class','source-text')
    .text("Source: COVID-19 Data Repository, Center for Systems Science and Engineering, JHU")
    .attr('x', 0)
    .attr('y', height + 40)
    .attr('fill', 'cyan')
    .attr('opacity', 0.5)
    .style('font-size', 12)
    .attr('text-anchor', 'left')
    .style("pointer-events", "all")

  // define a function that updates dataDefault based on prevailing conditions
  function defineData(metric, time) {
    if (time === "dates") {
        if (metric === "cases")
            return dataCasesDate
        else if (metric === "deaths")
            return dataDeathsDate
    }
    if (time === "days") {
        if (metric === "cases")
            return dataCasesSince
        else if (metric === "deaths")
            return dataDeathsSince
        else if (metric === "change")
            return dataRolling
    }
  }

  // define a function that re-loads all elements based on new defaults
  // which will be define within the buttons
  function reRender() {
    // rebuild y-axis per the default scale
    // also, set the line function accordingly
    if (metricFormat === "linear") {
        yPositionScaleDefault = yPositionScaleLin
        yAxis = d3.axisLeft().scale(yPositionScaleDefault)
        lineDefault = line
    }
    else if (metricFormat === "logarithmic") {
        yPositionScaleDefault = yPositionScaleLog
        yAxis = d3.axisLeft().scale(yPositionScaleDefault)
            .ticks(4)
            .tickFormat(d3.format(","))
        lineDefault = logLine
      }

    // reset the y-axis domains per the metric chosen
    if (metric === "cases") {
        yPositionScaleLin.domain([0, maxCases])
        // log scale depends depends if we're looking by dates or days
        if (time === "dates") {
            yPositionScaleLog.domain([1, maxCases])
        }
        else if (time === "days") {
            yPositionScaleLog.domain([100, maxCases])
        }
    }
    else if (metric === "deaths") {
        yPositionScaleLin.domain([0, maxDeaths])
        yPositionScaleLog.domain([1, maxDeaths])
    }
    else if (metric === "change") {
        yPositionScaleLin.domain([0, maxChange])
        yPositionScaleLog.domain([1, maxChange])
    }

    // if rolling average is selected, disable "By Date" button. Otherwise, re-enable.
    if (metric === "change") {
        d3.select('.btn-date-summ').property('disabled', true)
    }
    else {
        d3.select('.btn-date-summ').property('disabled', false)
    }
    
    // re-render y-axis
    svg.selectAll('.y-axis')
      .transition().duration(500)
      .call(yAxis)
    
    // rebuild x-axis per the default variables
    if (time === "dates") {
      // update x-scale domains to use date data
      xPositionScale.domain(d3.extent(dates))
      // redefine axis
      xAxis = d3.axisBottom().scale(xPositionScale)
        .tickFormat(d3.timeFormat('%m/%d'))
        .ticks(8)
    }
    else if (time === "days") {
      // update x-scale domains to use day data
      // but start at 7 days if we're looking at rolling average
      if (metric === "change") {
        xPositionScale.domain([7,d3.max(days)])
      }
      else {
        xPositionScale.domain(d3.extent(days))
      }
      // redefine axis
      xAxis = d3.axisBottom().scale(xPositionScale)
    }

    // re-render x-axis
    svg.selectAll('.x-axis')
      .transition().duration(500)
      .call(xAxis)
    
    // redefine nested using the data default
    nested = d3
      .nest()
      .key(d => d.Country_Region)
      .entries(dataDefault)
    // toggle line to default
    svg.selectAll('path')
      .data(nested)
      .transition().duration(500)
      .attr('stroke', d => colorScale(d.key))
      .attr('d', d => lineDefault(d.values))
    
    // remove old circles
    svg.selectAll('.d-circle').remove()
    // redraw circles
    svg
        .selectAll('.d-circle')
        .data(dataDefault)
        .enter()
        .append('circle')
        .attr('class', 'd-circle')
        .attr('cx', d => xPositionScale(d.chartedTime))
        .attr('cy', d => yPositionScaleDefault(+d.chartedValue))
        .attr('r', 6)
        .attr('opacity', 0)
        .attr('fill', 'white')
        .attr('stroke', d => colorScale(d.Country_Region))
        .attr('stroke-width', 2)
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
  }

  ///// Buttons for linear/ log scale /////
  // Linear
  d3.select('.btn-linear-summ').on('click', function() {
    console.log('clicked linear')
    // set y scale to log
    metricFormat = "linear"
    // re-render per the new defaults
    reRender()
  })
  
  // Log
  d3.select('.btn-log-summ').on('click', function() {
    console.log('clicked log')
    // set y scale to log
    metricFormat = "logarithmic"
    console.log(metric, time, metricFormat)
    // re-render per the new defaults
    reRender()
  })

  ///// Buttons for cases/ deaths/ rolling-cases /////
  // Cases
  d3.select('.btn-cases-summ').on('click', function() {
    console.log('clicked cases')
    // update metric to cases
    metric = "cases"
    // reset default data
    dataDefault = defineData(metric, time)
    // re-render with new defaults
    reRender()
  })
  
  // Deaths
  d3.select('.btn-deaths-summ').on('click', function() {
    console.log('clicked deaths')
    // update metric to cases
    metric = "deaths"
    // reset default data
    dataDefault = defineData(metric, time)
    // re-render with new defaults
    reRender()
  })

  // Change
  d3.select('.btn-change-summ').on('click', function() {
    console.log('clicked daily change')
    // update metric to change
    metric = "change"
    // update time to days
    time = "days"
    // reset default data
    dataDefault = defineData(metric, time)
    // re-render with new defaults
    reRender()
  })

  ///// Buttons for scenarios /////
  // By date
  d3.select('.btn-date-summ').on('click', function() {
    console.log('clicked by date')
    // change the time-measure to dates
    time = "dates"
    // reset default data
    dataDefault = defineData(metric, time)
    // re-render with new defaults
    reRender()
  })
  
  // By days since first 100 cases
  d3.select('.btn-days-summ').on('click', function() {
    console.log('clicked by days since 100')
    // change the time-measure to dates
    time = "days"
    // reset default data
    dataDefault = defineData(metric, time)
    // re-render with new defaults
    reRender()
  })

  // Add your axes
  let xAxis = d3
    .axisBottom(xPositionScale)
    .tickFormat(d3.timeFormat('%m/%d'))
    .ticks(8)
  svg
    .append('g')
    .attr('class', 'axis x-axis')
    .attr('transform', 'translate(0,' + height + ')')
    .call(xAxis)

  // Make y-axis linear by default
  let yAxis = d3.axisLeft().scale(yPositionScaleLin)
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