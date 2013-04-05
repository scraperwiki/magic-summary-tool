// Make charts and similar

var chart_redrawers = {}

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

var make_bar = function(title, data) {
  return function(el) {
    var googleData = google.visualization.arrayToDataTable(data)

    var options = { 
        legend: { position: "none" },
        chartArea:{left:"120",top:"0",width:"100%",height:"100%"},
        width: 420,
        height: (data.length - 1) * 20,
        fontSize: 16,
	titlePosition: 'none',
        /* bar:  {groupWidth:"19"} */
    }

    var remake = function() {
      var chart = new google.visualization.BarChart(el[0])
      chart.draw(googleData, options)
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

    var remake = function() {
      var chart = new google.visualization.GeoChart(el[0])
      chart.draw(googleData, options)
      el.prepend("<h1>" + title + "</h1>")
    }
    chart_redrawers[table_ix].push(remake)
    remake()
   }
}

var make_scatter = function(title, data) {
  return function(el) {
    var googleData = google.visualization.arrayToDataTable(data)

    var options = { 
        legend: { position: "none" },
        chartArea:{left:"16%",top:"4%",width:"84%",height:"74%"},
        width: 420,
        height: 315,
        fontSize: 16,
        hAxis:{title: title},
        vAxis:{title: "count"}
    }

    var remake = function() {
      var chart = new google.visualization.ScatterChart(el[0])
      chart.draw(googleData, options)
      el.prepend("<h1>" + title + "</h1>")
    }
    chart_redrawers[table_ix].push(remake)
    remake()
   }
}

var make_word_cloud = function(title, words) {
  return function(el) {
    var fontSize = d3.scale["sqrt"]().range([10, 20])
    var fill = d3.scale.category20b()
    d3.layout.cloud().size([420, 420])
	.words(words)
	.rotate(function() { return ~~(Math.random() * 2) * 90; })
	.font("Impact")
	.fontSize(function(d) { return fontSize(+d.value); })
	.on("end", draw)
        .text(function(d) { return d.key; })
	.start();

    function draw(words) {
      d3.select(el[0]).append("svg")
	  .attr("width", 420)
	  .attr("height", 420)
	.append("g")
	  .attr("transform", "translate(210,210)")
	.selectAll("text")
	  .data(words)
	.enter().append("text")
	  .style("font-size", function(d) { return fontSize(+d.value) + "px"; })
	  .style("font-family", "Impact")
	  .style("fill", function(d, i) { return fill(i); })
	  .attr("text-anchor", "middle")
	  .attr("transform", function(d) {
	    return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
	  })
	  .text(function(d) { return d.key; });
    }
    el.prepend("<h1>" + title + "</h1>")
  }
}


