// Main code of ScraperWiki "Summarise automatically" tool

var meta
var table
var table_ix
var total
var groups = {}
var tab

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

  console.log("col:", col, " adding fact:", name, "score:", score, "current_score:", current_score, "current_dom:", current_dom)

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
      delete current_dom
    }
    fact_scores[col] = score
    fact_doms[col] = dom
  }
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
          fact_only_one_significant(col, group)
          fact_image_collage(col, group)
          fact_time_charts(col, group)
          fact_countries_chart(col, group)
          fact_word_cloud(col, group)
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
      $('.tip-right').tooltip({ 'placement': 'right' })
      $('.tip-bottom').tooltip({ 'placement': 'bottom' })
    })
  })
})
