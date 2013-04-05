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
	titlePosition: 'none'
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


