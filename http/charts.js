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


