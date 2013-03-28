// TODO:
// Make pie charts of the group data http://blog.stephenboak.com/2011/08/07/easy-as-a-pie.html
// Detect type of columns: integer, float, option, free text, url, date/time, lat/lng
// Show most common elements - if more than x% of total

$(function() {
  var meta
  var table
  var total
  var groups = {}

  var handle_error = function(err) {
    console.log("err", err)
  }

  // for columns that have less than 10 values, show in a table
  var simple_groups = function(col, group) {
    var html = '<div class="item">'

    if (group.length == 1) {
      html += '<p><b>' + col + '</b> is always <b>' + group[0].val + '</b></p>'
      html += '</div>'
      $('#simple_groups').append(html)
      return
    }

    html += '<table class="table table-striped table-hover">'
    html += '<tr><th>' + col + '</th><th>count</th></tr>'
    var gotten = 0
    $.each(group, function(ix, value) {
      // for long lists, only show items accounting for 2% of rows
      if (group.length > 10) {
        if (value.c / total < 0.02) {
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
    console.log(col, html)
    $('#simple_groups').append(html)
  }

  async.auto({
    // Get schema of SQL database
    getMeta: function(cb) {
      scraperwiki.sql.meta(function(lmeta) {
        table = "tweets" // XXX todo dehardcode this
        meta = lmeta['table'][table]
        console.log("meta", meta)
        cb()
      })
    },
    // Get total number of rows
    getTotal: [ 'getMeta', function(cb) {
      scraperwiki.sql("select count(*) as c from " + table, function(data) {
        total = data[0].c
        cb()
      }, handle_error)
    } ],
    // For every column, count the number of meta groupings
    getGroups: [ 'getTotal', 'getMeta', function(cb1) {
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
    console.log("async.auto done")
  })

  $('#simple_groups').masonry({
    // options
    itemSelector : '.item',
    columnWidth : 240
  });

})
