$(function() {
  var meta
  var table
  var groups = {}

  var handle_error = function(err) {
    console.log("err", err)
  }

  var simple_groups = function(col, group) {
    if (group.length < 10) {
      var html = '<div class="item">'
      html += '<h2>' + col + '</h2>'
      html += '<table class="table table-striped"><tr><th>value</th><th>count</th></tr>'
      $.each(group, function(ix, value) {
        html += '<tr>'
        html += '<td>' + value.val + '</td>'
        html += '<td>' + value.c + '</td>'
        html += '</tr>'
      })
      html += '</table></div>'
      console.log(col, html)
      $('#simple_groups').append(html)
    }  
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
    // For every column, count the number of meta groupings
    getGroups: [ 'getMeta', function(cb1) {
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
