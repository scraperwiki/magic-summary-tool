// Main code of ScraperWiki "Summarise automatically" tool

var meta
var table
var table_ix
var total
var groups = {}
var tab
var saved_table_ix

// Google Charts have to be late-rendered when the page is visible - this
// stores functions to run for each tab when it is shown
var chart_redrawers = {}

// Blacklist some columns because they are useless
var blacklisted_column = function(col) {
  // Things that end _id are foreign keys - skip for now
  if (col.match(/_id$/) || col == "id" || col == "id_str")
    return true
  // MusicBrainz identifiers (e.g. in Last.fm data)
  if (col.match(/_mbid$/))
    return true
  return false
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

  console.log("  col:", col, "found fact:", name, "score:", score, "current_score:", current_score)

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
  console.log("table:", table, "meta:", meta)

  var tab_id = 'tab_' + table_ix
  var nav_cls = ""
  if (table_ix == saved_table_ix) {
    nav_cls = "active"
  }

  $('body').append('<div class="tab ' + nav_cls + '" id="' + tab_id + '"><div class="facts"></div></div>')
  tab = $("#" + tab_id)
  tab.find('.facts').masonry({ itemSelector : '.item' })
  tab.append('<p class="loading item">Summarising&hellip;</p>')
  $(".nav").append('<li class="' + nav_cls + '"> <a href="#' + tab_id + '" data-toggle="tab">' + table + '</a> </li>')

  var local_tab = tab
  var local_tab_id = tab_id
  var local_table_ix = table_ix
  chart_redrawers[table_ix] = []
  $(".nav a").on("shown", function (e) {
    console.log("tab shown", e.target, e.relatedTarget, "#" + local_tab_id)
    console.log("target href", $(e.target).attr('href'))
    // shown is global for all tabs - this detects we mean this tab activated
    if ($(e.target).attr('href') == "#" + local_tab_id) {
      $.each(chart_redrawers[local_table_ix], function(ix, value) {
        value()
      })
      local_tab.find('.facts').masonry('reload')
      // save tab as default for first time load
      scraperwiki.exec("echo " + local_table_ix + " > saved_table_ix")
    }
  })

  async.auto({
    // Get total number of rows
    getTotal: [ function(cb) {
      scraperwiki.sql("select count(*) as c from `" + table + "`", function(data) {
        total = data[0].c
        fact_total_rows()
        // finish early if only one row - nothing else is interesting
        if (total == 1) 
         cb("onerow")
        else
         cb()
      }, handle_error)
    } ],
    // For every column, count the number of meta groupings
    getGroups: [ 'getTotal', function(cb1) {
      async.forEach(meta.columnNames, function(col, cb2) {
        if (blacklisted_column(col)) {
          cb2()
	  return
        }
        // the nullif here converts empty strings to nulls, to simplify stuff
        scraperwiki.sql("select nullif(`" + col + "`, '') as val, count(*) as c from `" + table + "` group by val order by c desc", function(group) {
          groups[col] = group

          fact_one_value(col, group)
          fact_groups_table(col, group, 0)
          fact_groups_pie(col, group, 0)
          fact_only_one_significant(col, group)

          fact_time_charts(col, group)
          fact_countries_chart(col, group)
          fact_numbers_chart(col, group)
          fact_numbers_range(col, group)

          fact_image_collage(col, group)
          fact_word_cloud(col, group)
          fact_domain_table(col, group)

          cb2()
        }, handle_error)
      }, function() {
        cb1()
      })
    } ]
  }, function() {
    console.log("table done:", table)
    tab.find('.facts').masonry('reload')
    tab.find('p.loading').remove()
    cb()
  })
}

// Main entry point
$(function() {
  // Get schema of SQL database
  scraperwiki.sql.meta(function(lmeta) {
    var tables = Object.keys(lmeta['table'])
    // Load last tab to show
    scraperwiki.exec("cat saved_table_ix", function(new_saved_table_ix) {
      saved_table_ix = Number(new_saved_table_ix)
      if (saved_table_ix < 1 || isNaN(saved_table_ix))
        saved_table_ix = 1
      if (saved_table_ix > tables.length)
        saved_table_ix = tables.length

      // Make each table in series - 'table' and others are 
      // global variables for now
      table_ix = 0
      async.forEachSeries(tables, function (key, cb) {
        table = key
        table_ix++
        meta = lmeta['table'][table]
        make_tab(cb)
      }, function () {
        $('.tip-right').tooltip({ 'placement': 'right' })
        $('.tip-bottom').tooltip({ 'placement': 'bottom' })
      })
    })
  }, function(err) {
    console.log(err)
    scraperwiki.alert(err.responseText, "", true)
  })

  $('#bugs').on('click', function() {
    window.open("https://github.com/frabcus/magic-summary-tool/issues", "_blank")
  }

      )
})
