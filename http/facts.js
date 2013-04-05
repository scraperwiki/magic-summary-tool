// Code to generate particular candidate facts for display.

// Show total number of rows
var fact_total_rows = function() {
  add_fact("total_rows", 500, '<h1>total</h1><p class="lead"><b>' + total + '</b> rows</p>')
}

// Fact - if every value in the columns is the same, say that clearly
var fact_one_value = function(col, group) {
  if (group.length == 1) {
    html = '<h1>' + col + '</h1><p class="lead">is always <b>' + group[0].val + '</b></p>'
    add_fact("one_value", 99, html, col)
  }
}

// Fact - for columns with few values, or with some very common values (>5% of
// rows) show the grouped values in a table
var fact_groups_table = function(col, group) {
  var html = '<h1>' + col + '</h1>'
  html += '<table class="table table-striped">'

  // if we have less than 5, we always show
  if (group.length > 5) {
    // otherwise, only show if the second most common value is at least 5%
    if (group[1].c / total < 0.05) {
      return
    }
  }

  var gotten = 0
  var so_far = 0
  $.each(group, function(ix, value) {
    // for long lists, show first 5 items, or any more than that that have more than 5%
    if (value.c / total < 0.05 && gotten >= 5) {
      html += '<tr class="muted">'
      html += '<td>Other</td>'
      html += '<td><span class="tip-right" title="' + (total - so_far) + ' rows">' + percent(total - so_far, total) + '</td>'
      html += '</tr>'
      return false
    }

    html += '<tr>'
    html += '<td>' + add_empty(value.val) + '</td>'
    //html += '<td>' + value.c + '</td>'
    html += '<td><span class="tip-right" title="' + value.c + ' rows">' + percent(value.c, total) + '</td>'
    html += '</tr>'

    so_far += value.c
    gotten++
  })
  html += '</table>'

  if (group.length <= 5) {
    add_fact("groups_table_short", 25, html, col)
  } else {
    add_fact("groups_table_significant", 10, html, col)
  }
}

// Fact - like fact_groups_table only makes a pie
var fact_groups_pie = function(col, group) {
  if (group.length > 8) {
    return
  }

  var data = [['value', 'count']]
  $.each(group, function(ix, value) {
    data.push([String(add_empty(value.val)), /*Math.round(100.0 * value.c / total)*/ value.c])
  })

  add_fact("groups_pie", 60, make_pie(col, data), col)
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
  html += '<p class="lead">every value is different except<br>'
  html += '<b class="tip-bottom" title="' + not_equal_one.c + ' rows">' + 
        percent(not_equal_one.c, total) + '</b> of rows are <b>' + not_equal_one.val + '</b> </p>'
  add_fact("mostly_one_offs", 80, html, col)
}

// Fact - cases when one value has more than 95%
var fact_only_one_significant = function(col, group) {
  if (group.length < 3) {
    return
  }

  if (group[0].c / total < 0.95) {
    return
  }

  // we have exactly one value not equal to one
  html = '<h1>' + col + '</h1><p class="lead">is <span class="tip-bottom" title="' + percent(group[0].c, total) + ' of the time">nearly always</span> <b>' + group[0].val + '</b></p>'
  add_fact("only_one_significant", 95, html, col)
}

// Fact - images to be shown in collages
var fact_image_collage = function(col, group) {
  // See if we have enough images
  var image_count = 0
  $.each(group, function(ix, value) {
    if (is_image_url(String(value.val))) {
      image_count ++
    }
  })
  if (image_count < 4 && image_count != group.length) {
    return
  }

  // If so, show the first few
  var count = 0
  var html = '<h1>' + col + '</h1><div class="collage">'
  $.each(group, function(ix, value) {
    if (is_image_url(String(value.val))) {
      html += '<img class="tip-bottom" title="' + percent(value.c, total) + ', ' + value.c + ' rows" src="' + value.val + '">'
      count = count + 1
      if (count >= 20) {
        return false
      }
    }
  })
  html += "</div>"
  if (count == image_count) {
    html += '<p>All the images</p>'
  } else {
    html += '<p>Some of the images, in order of frequency</p>'
  }
  add_fact("image_collage", 90, html, col)
}

// Fact - date times
var fact_time_charts = function(col, group) {
  // See if we have enough images
  var time_count = 0
  $.each(group, function(ix, value) {
    var m = moment(value.val)
    if (!jQuery.isNumeric(value.val) && m && m.isValid()) {
      time_count++
    }
  })
  // if less than half are times, give up
  if (time_count < (group.length / 2)) {
    return
  }

  // try grouping into buckets at various granularities
  _bucket_time_chart(col, group, "YYYY", "years", "YYYY", "time_chart_year", 90)
  _bucket_time_chart(col, group, "YYYY-MM", "months", "MMM YYYY", "time_chart_month", 91)
  _bucket_time_chart(col, group, "YYYY-MM-DD", "days", "D MMM YYYY", "time_chart_day", 92)
}

var _bucket_time_chart = function(col, group, bucketFormat, bucketOffset, humanFormat, name, score) {
  // Count number of items in each bucket (e.g. each month)
  var html = '<h1>' + col + '</h1>'
  var buckets = {}
  var earliest = moment("9999-12-31").format(bucketFormat)
  var latest = moment("0001-01-01").format(bucketFormat)
  $.each(group, function(ix, value) {
    var m = moment(value.val)
    if (!jQuery.isNumeric(value.val) && m && m.isValid()) {
      var bucket = m.format(bucketFormat)
      if (!(bucket in buckets)) {
        buckets[bucket] = 0
      }
      buckets[bucket] += value.c
      if (bucket < earliest) {
   	earliest = bucket
      }
      if (bucket > latest) {
   	latest = bucket
      }
    }
  })
  // Loop through every bucket in the range earliest to latest (e.g. each month)
  var data = []
  for (var i = moment(earliest); i <= moment(latest); i.add(bucketOffset, 1)) {
    var bucket = i.format(bucketFormat) 
    var human = i.format(humanFormat)
    if (bucket in buckets) {
      data.push([human, buckets[bucket]])
    } else {
      data.push([human, 0])
    }
  }
  // See if we right amount of data
  if (data.length < 2 || data.length > 31) {
    return
  }
  data.unshift(['bucket', 'count'])

  add_fact(name, score, make_bar(col, data), col)
}




