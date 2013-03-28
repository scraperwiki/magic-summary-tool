$(function() {

  var meta
  var table
  var groups = {}

  var handle_error = function(err) {
    console.log("err", err)
  }

  async.auto({
    // Get schema of SQL database
    getMeta: function(cb) {
      scraperwiki.sql.meta(function(lmeta) {
        meta = lmeta
        table = "tweets" // XXX todo dehardcode this
        console.log("meta", meta)
        cb()
      })
    },
    getGroups: [ 'getMeta', function(cb) {
      async.forEach(meta['table'][table].columnNames, function(col, cb) {
        scraperwiki.sql("select " + col + ", count(*) as c from " + table + " group by " + col + " order by c desc", function(data) {
          console.log("getGroups", col, data)
          groups[col] = data
          cb()
        }, handle_error)
      }, function() {
        // done getting grouping
      })
    } ]
  }, function() {
    console.log("async.auto done")
  })

})
