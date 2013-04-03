var meta
var table
var table_ix
var total
var groups = {}
var tab

var handle_error = function(err) {
  console.log("err", err)
}

var percent = function(val, tot) {
  return Math.round(100.0 * val / tot) + '%'
}

var add_empty = function(val) {
  if (val === null || val === "") {
    val = "(empty)"
  }
  return val
}

// Scores for facts are:
// <100 show only highest which has same col value
// >=100 show multiple ones with score more than 100
// html can either be the html for the fact, or a function which takes
// an empty DOM element as a parameter and inserts itself into it.
var fact_scores = {}
var fact_doms = {}
var add_fact = function(name, score, html, col) {
  // score = 999 // always add

  current_score = fact_scores[col] || 0
  current_dom = fact_doms[col]

  //console.log("adding fact:", name, "current_score", current_score, "current_dom", current_dom, "score", score, "col", col)

  var dom = $('<div class="item" score="' + score + '">')

  // if the existing item is replaced by new, or new one is always show, show new one
  if (current_score < score || score >= 100) {
    if (typeof(html) == "function") {
      tab.find('.facts').append(dom)
      html(dom)
    } else {
      dom.html(html)
      tab.find('.facts').append(dom)
    }
  }

  // if current item is replaceable (score < 100), replace it
  if (current_score < 100 && current_score < score ) {
    if (current_dom != null) {
      current_dom.remove()
    }
    fact_scores[col] = score
    fact_doms[col] = dom
  }
}

// Show total number of rows
var fact_total_rows = function() {
  add_fact("total_rows", 500, '<h1>total</h1><p class="lead"><b>' + total + '</b> rows</p>')
}

// Fact - if every value in the columns is the same, say that clearly
var fact_one_value = function(col, group) {
  if (group.length == 1) {
    html = '<h1>' + col + '</h1><p class="lead">is always <b>' + group[0].val + '</b></p>'
    add_fact("one_value", 200, html, col)
  }
}

// Fact - for columns with few values, or with some very common values (>5% of
// rows) show the grouped values in a table
var fact_groups_table = function(col, group) {
  var html = '<h1>' + col + '</h1>'
  html += '<table class="table table-striped">'

  // if we have less than 8, we always show
  if (group.length > 8) {
    // otherwise, only show if the most common value is at least 5%
    if (group[0].c / total < 0.05) {
      return
    }
  }

  var gotten = 0
  var so_far = 0
  $.each(group, function(ix, value) {
    // for long lists, only show first 8
    if (gotten >= 8) {
      html += '<tr class="muted ' + cls + '">'
      html += '<td>Other</td>'
      html += '<td><span title="' + (total - so_far) + ' rows">' + percent(total - so_far, total) + '</td>'
      html += '</tr>'
      return false
    }

    var cls = ''
    if (value.val == null) {
      cls = 'error'
    }
    html += '<tr class="' + cls + '">'
    html += '<td>' + add_empty(value.val) + '</td>'
    //html += '<td>' + value.c + '</td>'
    html += '<td><span title="' + value.c + ' rows">' + percent(value.c, total) + '</td>'
    html += '</tr>'

    so_far += value.c
    gotten++
  })
  html += '</table>'

  var score = 50
  if (group.length <= 8) {
    score = 80
  }
  add_fact("groups_table", score, html, col)
}

// Fact - like fact_groups_table only makes a pie
var fact_groups_pie = function(col, group) {
  if (group.length > 10) {
    return
  }

  var data = [['value', 'count']]
  $.each(group, function(ix, value) {
    data.push([String(add_empty(value.val)), /*Math.round(100.0 * value.c / total)*/ value.c])
  })

  add_fact("groups_pie", 90, make_pie(col, data), col)
}

// Fact - cases when only one value appears more than once,
// everything else appears only once
var fact_mostly_one_offs = function(col, group) {
  var not_equal_one = null
  $.each(group, function(ix, value) {
    if (value.c != 1) {
      if (not_equal_one != null) {
        // more than one value not equal one, give up
        not_equal_one = null
        return false
      }
      not_equal_one = value
    }
  })
  if (not_equal_one == null) {
    return
  }
  
  // we have exactly one value not equal to one
  not_equal_one.val = add_empty(not_equal_one.val)
  html = '<h1>' + col + '</h1>'
  html += '<p class="lead"><b>' + percent(not_equal_one.c, total) + '</b> of rows are <b>' + not_equal_one.val + '</b> </p>'
  html += '<p>all other rows differ<p>'
  add_fact("mostly_one_offs", 75, html, col)
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
  tab.find('.facts').masonry({ itemSelector : '.item' })
  tab.append('<p class="loading item">Summarising&hellip;</p>')
  $(".nav").append('<li class="' + nav_cls + '"> <a href="#' + tab_id + '" data-toggle="tab">' + table + '</a> </li>')

  var localTab = tab
  var local_table_ix = table_ix
  chart_redrawers[table_ix] = []
  $(".nav a").on("shown", function (e) {
    $.each(chart_redrawers[local_table_ix], function(ix, value) {
      value()
    })
    localTab.find('.facts').masonry('reload')
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
          fact_groups_table(col, group)
          fact_groups_pie(col, group)
          fact_mostly_one_offs(col, group)
          cb2()
        }, handle_error)
      }, function() {
        cb1()
      })
    } ]
  }, function() {
    console.log("async.auto done", table)
    tab.find('.facts').masonry('reload')
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
      $('[title]').tooltip({ 'placement': 'right' })
    })
  })
})
