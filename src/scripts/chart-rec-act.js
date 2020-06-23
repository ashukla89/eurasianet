import * as d3 from 'd3'
import d3Tip from 'd3-tip'
import d3Annotation from 'd3-svg-annotation'

d3.tip = d3Tip

// Create your margins and height/width
const margin = { top: 30, left: 50, right: 100, bottom: 60 }
const height = 400 - margin.top - margin.bottom
const width = 600 - margin.left - margin.right

// I'll give you this part!
console.log('Building recovered/ active small multiples')

const svg = d3
  .select('#chart-rec-act')
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
const yPositionScale = d3.scaleLinear().range([height, 0])

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

  // Update your x-scales, which will be the same for every country
  const dates = datapoints.map(d => d.datetime)
  xPositionScale.domain(d3.extent(dates))

  // select some defaults, to be updated by the buttons
  let thisCountry = "Armenia"

  ///// RENDER STATIC ELEMENTS /////

  // add legend rectangles
  svg
    .append('rect')
    .attr('width', 15)
    .attr('height', 15)
    .attr('x', width + 5)
    .attr('y', 5)
    .attr('fill', 'cyan')
    .attr('opacity', 0.5)

  svg
    .append('rect')
    .attr('width', 15)
    .attr('height', 15)
    .attr('x', width + 5)
    .attr('y', 25)
    .attr('fill', 'red')

  // add legend text
  svg
    .append('text')
    .text("Recovered")
    .attr('x', width + 25) // on the side
    .attr('y', 5)
    .attr('dy', 15)
    .attr('text-anchor', 'left') // left aligned
    .attr('font-size', 14)
    .attr('fill', "#C8E9FE")

  svg
    .append('text')
    .text("Active")
    .attr('x', width + 25) // on the size
    .attr('y', 25)
    .attr('dy', 15)
    .attr('text-anchor', 'left') // left aligned
    .attr('font-size', 14)
    .attr('fill', "#C8E9FE")

  // Add source text
  svg
    .append('a')
    // .attr("xlink:href", "https://github.com/CSSEGISandData/COVID-19")
    .append('text')
    .attr('class','source-text')
    .text("Source: COVID-19 Data Repository, Center for Systems Science and Engineering, JHU")
    .attr('x', 0)
    .attr('y', height + 40)
    .attr('fill', 'cyan')
    .attr('opacity', 0.5)
    .style('font-size', 12)
    .attr('text-anchor', 'left')
    // .style("pointer-events", "all")

  ///// THE RENDER FUNCTION /////

  function reRender() {
    let thisData = datapoints.filter(function(d) {
      return d.Country_Region == thisCountry
    })
    let cases = thisData.map(d => +d.Confirmed)
    let maxCases = d3.max(cases)
    yPositionScale.domain([0, maxCases])

    console.log(thisData)

    // clear out previous elements
    svg.selectAll('path').remove()
    svg.selectAll('.title').remove()
    svg.selectAll('.tick').remove()

    // create a graph for the default country (the first)

    // Draw your areas
    svg
      .append('path')
      .datum(thisData)
      .transition().duration(500)
      .attr('d', areaRec)
      .attr("clip-path", "url(#clip)")
      .attr('fill', 'cyan')
      .attr('stroke', 'grey')
      .attr('stroke-width', 1)
      .attr('opacity', 0.5)

    svg
      .append('path')
      .datum(thisData)
      .raise()
      .transition().duration(500)
      .attr("clip-path", "url(#clip)")
      .attr('fill', 'red')
      .attr('stroke', 'grey')
      .attr('stroke-width', 1)
      .attr('opacity', 1)
      .attr('d', areaAct)

    svg.call(tipRec)
    svg.call(tipAct)

    // add title
    svg
      .append('text')
      .text(thisCountry)
      .attr('class', 'title')
      .attr('x', width / 2) // in the center
      .attr('text-anchor', 'middle') // center aligned
      .attr('dy', -10)
      .attr('font-size', 18)
      .attr('fill', "#C8E9FE")
      .attr('font-weight', 'bold')

    // const mouseG = svg.append("g")
    //   .attr("class", "mouse-over-effects")

    // mouseG.append("path") // this is the black vertical line to follow mouse
    //   .attr("class", "mouse-line")
    //   .style("stroke", "black")
    //   .style("stroke-width", "1px")
    //   .style("opacity", "0")

    // const mousePerLine = mouseG.selectAll('.mouse-per-line')
    //   .data(thisCountry)
    //   .enter()
    //   .append("g")
    //   .attr("class", "mouse-per-line");

    // mousePerLine.append("circle")
    //   .attr("r", 8)
    //   .style("stroke", "grey")
    //   .style("fill", "none")
    //   .style("stroke-width", "1px")
    //   .style("opacity", "0")

    // mousePerLine.append("text")
    //   .attr("transform", "translate(10,3)");

    // mouseG.append('svg:rect') // append a rect to catch mouse movements on canvas
    //   .attr('width', width) // can't catch mouse events on a g element
    //   .attr('height', height)
    //   .attr('fill', 'none')
    //   .attr('pointer-events', 'all')
    //   .on('mouseout', function() { // on mouse out hide line, circles and text
    //     d3.select(".mouse-line")
    //       .style("opacity", "0");
    //     d3.selectAll(".mouse-per-line circle")
    //       .style("opacity", "0");
    //     d3.selectAll(".mouse-per-line text")
    //       .style("opacity", "0");
    //   })
    //   .on('mouseover', function() { // on mouse in show line, circles and text
    //     d3.select(".mouse-line")
    //       .style("opacity", "1");
    //     d3.selectAll(".mouse-per-line circle")
    //       .style("opacity", "1");
    //     d3.selectAll(".mouse-per-line text")
    //       .style("opacity", "1");
    //   })
    //   .on('mousemove', function() { // mouse moving over canvas
    //     const mouse = d3.mouse(this);
    //     d3.select(".mouse-line")
    //       .attr("d", function() {
    //         console.log(mouse)
    //         const d = "M" + mouse[0] + "," + height;
    //         d += " " + mouse[0] + "," + 0;
    //         return d;
    //       });

    //       d3.selectAll(".mouse-per-line")
    //         .attr("transform", function(d, i) {
    //           console.log(width/mouse[0])
    //           var xDate = x.invert(mouse[0]),
    //               bisect = d3.bisector(function(d) { return d.datetime; }).right;
    //               idx = bisect(d.values, xDate);
              
    //           var beginning = 0,
    //               end = lines[i].getTotalLength(),
    //               target = null;

    //           while (true){
    //             target = Math.floor((beginning + end) / 2);
    //             pos = lines[i].getPointAtLength(target);
    //             if ((target === end || target === beginning) && pos.x !== mouse[0]) {
    //                 break;
    //             }
    //             if (pos.x > mouse[0])      end = target;
    //             else if (pos.x < mouse[0]) beginning = target;
    //             else break; //position found
    //           }
            
    //           d3.select(this).select('text')
    //             .text(y.invert(pos.y).toFixed(2));
              
    //           return "translate(" + mouse[0] + "," + pos.y +")";
    //         })
    //   })

    const xAxis = d3
      .axisBottom(xPositionScale)
      .ticks(8)
      .tickFormat(d3.timeFormat('%m/%d'))
      // .tickSize(-height)
    svg
      .append('g')
      .attr('class', 'axis x-axis')
      .attr('transform', 'translate(0,' + height + ')')
      .transition().duration(500)
      .call(xAxis)
      .selectAll('.tick line')
      .attr('stroke-dasharray', '2 2')
      .attr('stroke', 'grey')
    // svg.selectAll('.x-axis path').remove()
    const yAxis = d3
      .axisLeft(yPositionScale)
      .tickSize(-width)
    svg
      .append('g')
      .attr('class', 'axis y-axis')
      .transition().duration(500)
      .call(yAxis)
      .selectAll('.tick line')
      .attr('stroke-dasharray', '2 2')
      .attr('stroke', 'grey')
    // svg.selectAll('.y-axis path').remove()
  }

  ///// COUNTRY BUTTONS /////
  d3.select('.btn-arm').on('click', function() {
      console.log('clicked Armenia')
      // set the "thisCountry" variable to the country in question
      thisCountry = "Armenia"
      // reRender
      reRender()
  })

  d3.select('.btn-azer').on('click', function() {
    console.log('clicked Azerbaijan')
    // set the "thisCountry" variable to the country in question
    thisCountry = "Azerbaijan"
    // reRender
    reRender()
  })

  d3.select('.btn-geo').on('click', function() {
    console.log('clicked Georgia')
    // set the "thisCountry" variable to the country in question
    thisCountry = "Georgia"
    // reRender
    reRender()
  })

  d3.select('.btn-kaz').on('click', function() {
    console.log('clicked Kazakhstan')
    // set the "thisCountry" variable to the country in question
    thisCountry = "Kazakhstan"
    // reRender
    reRender()
  })

  d3.select('.btn-kyr').on('click', function() {
    console.log('clicked Kyrgyzstan')
    // set the "thisCountry" variable to the country in question
    thisCountry = "Kyrgyzstan"
    // reRender
    reRender()
  })

  d3.select('.btn-taj').on('click', function() {
    console.log('clicked Tajikistan')
    // set the "thisCountry" variable to the country in question
    thisCountry = "Tajikistan"
    // reRender
    reRender()
  })

  d3.select('.btn-uzb').on('click', function() {
    console.log('clicked Uzbekistan')
    // set the "thisCountry" variable to the country in question
    thisCountry = "Uzbekistan"
    // reRender
    reRender()
  })

  // do a render to start with
  reRender()
}
