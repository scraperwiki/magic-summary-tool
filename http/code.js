var meta
var table
var table_ix
var total
var groups = {}
var tab

var handle_error = function(err) {
  console.log("err", err)
}

var add_fact = function(col, html) {
  html = '<div class="item">' + html + '</div>'
  tab.find('.facts').append(html)
}

// Show total number of rows
var fact_total_rows = function() {
  add_fact(null, '<h1>total</h1><p class="lead"><b>' + total + '</b> rows</p>')
}

// Fact - if every value in the columns is the same, say that clearly
var fact_one_value = function(col, group) {
  if (group.length == 1) {
    html = '<h1>' + col + '</h1><p class="lead">is always <b>' + group[0].val + '</b></p>'
    add_fact(col, html)
  }
}

// Fact - for columns with few values, or with some very common values (>5% of
// rows) show the grouped values in a table
var fact_simple_groups = function(col, group) {
  var html = '<table class="table table-striped">'
  html += '<tr><th>' + col + '</th><th>count</th></tr>'

  // if we have less than 10, we always show
  if (group.length > 10) {
    // otherwise, only show if the most common value is at least 5%
    if (group[0].c / total < 0.05) {
      return
    }
  }

  var gotten = 0
  $.each(group, function(ix, value) {
    // for long lists, only show first 10
    if (gotten >= 10) {
      html += '<tr class="' + cls + '">'
      html += '<td>&hellip;</td>'
      html += '<td>&nbsp;</td>'
      html += '</tr>'
      return false
    }

    var cls = ''
    if (value.val == null) {
      cls = 'error'
    }
    html += '<tr class="' + cls + '">'
    html += '<td>' + value.val + '</td>'
    html += '<td>' + value.c + '</td>'
    html += '</tr>'

    gotten++
  })
  html += '</table>'
  add_fact(col, html)
}

// Fact - cases when only one value appears more than once
var fact_mostly_one_offs = function(col, group) {
  var not_equal_one = null
  $.each(group, function(ix, value) {
  
  })
  //add_fact(col, html)
}


// Construct one table's summary - make the tab in the user interface, and set
// off all the queries of the database necessary to make the summary.
var make_tab = function(cb) {
  var tab_id = 'tab_' + table_ix
  var nav_cls = ""
  if (table_ix == 1) {
    nav_cls = "active"
  }
  $('body').append('<div class="tab ' + nav_cls + '" id="' + tab_id + '"><div class="facts"></div></div>')
  tab = $("#" + tab_id)
  tab.append('<p class="loading item">Summarising&hellip;</p>')
  $(".nav").append('<li class="' + nav_cls + '"> <a href="#' + tab_id + '" data-toggle="tab">' + table + '</a> </li>')
  $(".nav a").on("shown", function (e) {
    tab.find('.facts').masonry({
      // options
      itemSelector : '.item',
      columnWidth : 240
    })
  })

  async.auto({
    // Get total number of rows
    getTotal: [ function(cb) {
      scraperwiki.sql("select count(*) as c from " + table, function(data) {
        total = data[0].c
        fact_total_rows()
        cb()
      }, handle_error)
    } ],
    // For every column, count the number of meta groupings
    getGroups: [ 'getTotal', function(cb1) {
      async.forEach(meta.columnNames, function(col, cb2) {
        scraperwiki.sql("select " + col + " as val, count(*) as c from " + table + " group by " + col + " order by c desc", function(group) {
          groups[col] = group
          fact_one_value(col, group)
          fact_simple_groups(col, group)
          fact_mostly_one_offs(col, group)
          cb2()
        }, handle_error)
      }, function() {
        cb1()
      })
    } ]
  }, function() {
    console.log("async.auto done", table)
    tab.find('p.loading').remove()
    cb()
  })
}

// Main entry point
$(function() {
  // Get schema of SQL database
  scraperwiki.sql.meta(function(lmeta) {
    // Make each table in series - 'table' and others are 
    // global variables for now
    var tables = Object.keys(lmeta['table'])
    table_ix = 0
    async.forEachSeries(tables, function (key, cb) {
      table = key
      table_ix++
      meta = lmeta['table'][table]
      console.log("meta", meta)
      make_tab(cb)
    }, function () {
    })
  })
})
