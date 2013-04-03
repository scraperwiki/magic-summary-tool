// TODO:
// Write blog post about it
//
// Tabs don't look like tabs, change to just normal tabs
// Change it to generate "fact" boxes with a score weighting and show the top ones / top one per column (scroll for more facts!)
// 
// Never show one row - e.g. Zarino's Zero 7 is confusing
// Let you click the ... to show more (Zarino)
// Show total number of rows (Ian) e.g. in comparison to total.
// Maybe show % (Zarino)
// JASL station list should show top 10 countries (David)
//
// Total number of rows as its own fact
// Total size of database as its own fact
// Pie charts of small group data http://blog.stephenboak.com/2011/08/07/easy-as-a-pie.html
// Histogram bar chart of data when larger groups, esp. ones with an order
// Detect type of columns: 
//    integer - give the range, show a mini histogram
//    ids (e.g. twitter id long number) vs. integers that are quantities - cross reference between columns
//    float 
//    option
//    free text - make a wordle
//    ids (e.g. 12d432a3-feb0-49b1-a107-d20751880764 in last.fm data) vs. human language text (can autodetect?)
//    url - pull out domain names and show frequency of them, or if all same pull out path, all same pull out query etc.
//    images - highlight the most common image, or do a little mosaic of random images
//    date/time - show density map, or in JASL station list show just limited number
//    lat/lng - show a statically generated basic map of the area covered with some shading? country boundary maps?
//    percentage - guess it is e.g. inventory.ci in JASL station list
//    country codes / names - detect them and show flags magically
//    x/y coordinates, spot them and plot on a square
// Unique columns - ones where every key is different, show that as a fact
// Improve look of fact which shows every key is the same
// Look at the table / column names and guess what kind of data it is, e.g. geogaphical, music
// 
// Anscombe quartet (Ian)
// Regression correlation between every pair of columns (what Zarino does on Stata)

var meta
var table
var table_ix
var total
var groups = {}
var tab

var handle_error = function(err) {
  console.log("err", err)
}

// For columns that have less than 10 values, show in a table
var fact_simple_groups = function(col, group) {
  var html = '<div class="item">'

  if (group.length == 1) {
    html += '<p><b>' + col + '</b> is always <b>' + group[0].val + '</b></p>'
    html += '</div>'
    tab.find('.facts').append(html)
    return
  }

  html += '<table class="table table-striped">'
  html += '<tr><th>' + col + '</th><th>count</th></tr>'
  var gotten = 0
  $.each(group, function(ix, value) {
    // for long lists, only show items accounting for 5% of rows
    if (group.length > 10) {
      if (value.c / total < 0.05) {
        html += '<tr class="' + cls + '">'
        html += '<td>&hellip;</td>'
        html += '<td>&nbsp;</td>'
        html += '</tr>'
        return false
      }
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
  if (gotten == 0) {
    return
  }
  html += '</table></div>'
  tab.find('.facts').append(html)
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
  $(".nav").append('<li class="' + nav_cls + '"> <a href="#' + tab_id + '" data-toggle="pill">' + table + '</a> </li>')
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
        cb()
      }, handle_error)
    } ],
    // For every column, count the number of meta groupings
    getGroups: [ 'getTotal', function(cb1) {
      async.forEach(meta.columnNames, function(col, cb2) {
        scraperwiki.sql("select " + col + " as val, count(*) as c from " + table + " group by " + col + " order by c desc", function(group) {
          groups[col] = group
          fact_simple_groups(col, group)
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
