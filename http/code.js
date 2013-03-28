// TODO:
// Multiple tabs
// Make pie charts of the group data http://blog.stephenboak.com/2011/08/07/easy-as-a-pie.html
// Detect type of columns: 
//    integer
//    ids (e.g. twitter id long number) vs. integers that are quantities
//    float 
//    option
//    free text
//    ids (e.g. 12d432a3-feb0-49b1-a107-d20751880764 in last.fm data) vs. human language text (can autodetect?)
//    url
//    image
//    date/time
//    lat/lng
// Show most common elements - if more than x% of total

var meta
var table
var table_ix
var total
var groups = {}
var tab

var handle_error = function(err) {
  console.log("err", err)
}

// for columns that have less than 10 values, show in a table
var simple_groups = function(col, group) {
  var html = '<div class="item">'

  if (group.length == 1) {
    html += '<p><b>' + col + '</b> is always <b>' + group[0].val + '</b></p>'
    html += '</div>'
    tab.find('.simple_groups').append(html)
    return
  }

  html += '<table class="table table-striped table-hover">'
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
  tab.find('.simple_groups').append(html)
}

var make_tab = function(cb) {
  var tab_id = 'tab_' + table_ix
  var nav_cls = ""
  if (table_ix == 1) {
    nav_cls = "active"
  }
  $('body').append('<div class="tab ' + nav_cls + '" id="' + tab_id + '"><div class="simple_groups"></div></div>')
  tab = $("#" + tab_id)
  $(".nav").append('<li class="' + nav_cls + '"> <a href="#' + tab_id + '" data-toggle="pill">' + table + '</a> </li>')
  $(".nav a").on("shown", function (e) {
    tab.find('.simple_groups').masonry({
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
          simple_groups(col, group)
          cb2()
        }, handle_error)
      }, function() {
        cb1()
      })
    } ]
  }, function() {
    console.log("async.auto done", table)
    cb()
  })
}

$(function() {
  // Get schema of SQL database
  scraperwiki.sql.meta(function(lmeta) {
    // Make each table
    table_ix = 0
    async.forEachSeries(Object.keys(lmeta['table']), function (key, cb) {
      table = key
      table_ix++
      meta = lmeta['table'][table]
      console.log("meta", meta)
      make_tab(cb)
    }, function (err) {
    })
  })
})
