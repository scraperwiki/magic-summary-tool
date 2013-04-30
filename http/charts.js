// Make charts and similar

var make_pie = function(title, data) {
  return function(el) {
    var googleData = google.visualization.arrayToDataTable(data)

    var options = { 
        legend: { position: "none" },
        chartArea:{left:"5%",top:"5%",width:"90%",height:"90%"},
        width: 420,
        height: 420,
        fontSize: 16,
        pieSliceText: 'label'
    }

    var remake = function() {
      var chart = new google.visualization.PieChart(el[0])
      chart.draw(googleData, options)
      el.prepend("<h1>" + title + "</h1>")
    }
    chart_redrawers[table_ix].push(remake)
    remake()
   }
}

var make_time_bar = function(title, data) {
  return function(el) {
    var googleData = google.visualization.arrayToDataTable(data)

    var options = { 
        legend: { position: "none" },
        chartArea:{left:"120",top:"0",width:"100%",height:"100%"},
        width: 420,
        height: (data.length - 1) * 20,
        fontSize: 16,
	titlePosition: 'none',
        hAxis:{minValue: 0},
        /* bar:  {groupWidth:"19"} */
    }

    // Render column 1 as a percentage as well as frequency
    var formatter2 = new google.visualization.PatternFormat('{1} ({2})')
    formatter2.format(googleData, [0, 1, 2], 1) 

    var remake = function() {
      var chart = new google.visualization.BarChart(el[0])

      var view = new google.visualization.DataView(googleData)
      view.setColumns([0, 1]) // Create a view with first two columns only
      chart.draw(view, options)
      el.prepend("<h1>" + title + "</h1>")
    }
    chart_redrawers[table_ix].push(remake)
    remake()
   }
}

var make_geo_countries = function(title, data) {
  return function(el) {
    var googleData = google.visualization.arrayToDataTable(data)

    var options = { 
        legend: { position: "none" },
        chartArea:{left:"120",top:"0",width:"100%",height:"100%"},
        width: 420,
        fontSize: 16,
        region: 'world',
        displayMode: 'regions',
        colorAxis: { minValue: 0,  colors: ['#EEFFEE', '#109618'] },
        backgroundColor: { fill: '#FAFAFF', stroke: '#0000FF', strokeWidth: 0 },
        datalessRegionColor: '#FFFFFF'
    }

    // Render column 1 as a percentage as well as frequency
    var formatter2 = new google.visualization.PatternFormat('{1} ({2})')
    formatter2.format(googleData, [0, 1, 2], 1) 

    var remake = function() {
      var chart = new google.visualization.GeoChart(el[0])

      var view = new google.visualization.DataView(googleData)
      view.setColumns([0, 1]) // Create a view with first two columns only
      chart.draw(view, options)
      el.prepend("<h1>" + title + "</h1>")
    }
    chart_redrawers[table_ix].push(remake)
    remake()
   }
}

var make_column = function(title, data, use_log, step_of_one) {
  return function(el) {
    var googleData = google.visualization.arrayToDataTable(data)

    var options = { 
        legend: { position: "none" },
        chartArea:{left:"20%",top:"4%",width:"84%",height:"74%"},
        width: 420,
        height: 420,
        fontSize: 16,
        hAxis:{slantedText: false, minValue: data[0][2], maxValue:data[data.length-1][3], maxAlternation: 1},
        vAxis:{title: "frequency", logScale: use_log, minValue: 0},
        bar:  {groupWidth:"80%"}
    }

    // Render column 0 as a range of the bar "start - end"
    var formatter 
    if (step_of_one) 
      formatter = new google.visualization.PatternFormat(title + ': {2}')
    else
      formatter = new google.visualization.PatternFormat(title + ': {2} - {3}')
    formatter.format(googleData, [0, 1, 2, 3, 4], 0) 
    // Render column 1 as a percentage as well as frequency
    var formatter2 = new google.visualization.PatternFormat('{1} ({4})')
    formatter2.format(googleData, [0, 1, 2, 3, 4], 1) 

    var remake = function() {
      var chart = new google.visualization.ColumnChart(el[0])
 
      var view = new google.visualization.DataView(googleData)
      view.setColumns([0, 1]) // Create a view with first two columns only
      chart.draw(view, options)
      el.prepend("<h1>" + title + "</h1>")
    }
    chart_redrawers[table_ix].push(remake)
    remake()
   }
}

var make_word_cloud = function(title, words) {
  return function(el) {
    var fontSize = d3.scale.linear().range([21, 100]).domain([0, words[0].value])
    var fill = d3.scale.category20b()
    d3.layout.cloud().size([420, 420])
	.words(words)
	.rotate(function() { return ~~(Math.random() * 2) * 90 })
	.font("Impact")
	.fontSize(function(d) { /* console.log("fontSize", d.value, "=>", fontSize(+d.value)); */ return fontSize(+d.value) })
	.on("end", draw)
        .text(function(d) { return d.key })
	.start()

    function draw(words) {
      d3.select(el[0]).append("svg")
	  .attr("width", 420)
	  .attr("height", 420)
	.append("g")
	  .attr("transform", "translate(210,210)")
	.selectAll("text")
	  .data(words)
	.enter().append("text")
	  .style("font-size", function(d) { return fontSize(+d.value) + "px" })
	  .style("font-family", "Impact")
	  .style("fill", function(d, i) { return fill(i) })
	  .attr("text-anchor", "middle")
	  .attr("transform", function(d) {
	    return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")"
	  })
	  .text(function(d) { return d.key })
    }
    el.prepend("<h1>" + title + "</h1>")
  }
}


