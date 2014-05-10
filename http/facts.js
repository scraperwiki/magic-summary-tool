// Code to generate particular candidate facts for display.

// Show total number of rows
var fact_total_rows = function() {
  var html = '<h1>total</h1><p class="lead"><b>' + total + '</b> rows</p>'
  html += '<p class="lead"><b>' + meta.columnNames.length + '</b> columns</p>'
  add_fact("total_rows", 500, html)
}

// Fact - if every value in the columns is the same, say that clearly
var fact_one_value = function(col, group) {
  if (group.length == 1) {
    html = '<h1>' + col + '</h1><p class="lead">is always <b>' + format_for_display(group[0].val) + '</b></p>'
    add_fact("one_value", 99, html, col)
  }
}

// Fact - cases when one value has more than 90% or 95%
var fact_only_one_significant = function(col, group) {
  if (group.length < 3) {
    return
  }

  var phrase
  if (group[0].c / total >= 0.95) {
    phrase = "nearly always"
  } else if (group[0].c / total >= 0.90) {
    phrase = "almost always"
  } else {
    return
  }

  // we have exactly one value not equal to one
  html = '<h1>' + col + '</h1><p class="lead">is <span class="tip-bottom" title="' + group[0].c + " (" + percent(group[0].c, total) + ")" + 
    '">' + phrase + ' </span> <b>' + format_for_display(group[0].val) + '</b></p>'
  add_fact("only_one_significant", 95, html, col)
}

// Fact - for columns with few values, or with some very common values (>5% of
// rows) show the grouped values in a table
var fact_groups_table = function(col, group, score_delta) {
  var html = '<h1>' + col + '</h1>'
  html += '<table class="table table-striped">'

  // don't bother at all if we have less than 2
  if (group.length < 2) {
    return
  }

  // if we have less than 5, we always show
  if (group.length > 5) {
    //console.log("  ", col, ": second most common value, percent:", group[1].c / total, "value:", group[1].c, "root total:", Math.sqrt(total) )
    // otherwise, only show if the second most common value is at least 5%... or
    if (group[1].c / total < 0.05) {
      // if the second most common value is at least the sqrt of the number of rows
      if (group[1].c < Math.sqrt(total) ) {
        return
      }
    }
  }

  var gotten = 0
  var so_far = 0
  $.each(group, function(ix, value) {
    // for long lists, show first 5 items, or any more than that that have more than 5%
    if (value.c / total < 0.05 && gotten >= 5) {
      html += '<tr class="muted">'
      html += '<td>Other</td>'
      html += '<td class="numeric">' + (total - so_far) + '</td><td class="numeric">' + percent(total - so_far, total) + '</td>'
      html += '</tr>'
      return false
    }

    html += '<tr>'
    html += '<td>' + format_for_display(value.val) + '</td>'
    //html += '<td>' + value.c + '</td>'
    html += '<td class="numeric">' + value.c + '</td><td class="numeric">' + percent(value.c, total) + '</td>'
    html += '</tr>'

    so_far += value.c
    gotten++
  })
  html += '</table>'

  if (group.length <= 5) {
    add_fact("groups_table_short", 25 + score_delta, html, col)
  } else {
    add_fact("groups_table_significant", 10 + score_delta, html, col)
  }
}

// Fact - like fact_groups_table only makes a pie
var fact_groups_pie = function(col, group, score_delta) {
  if (group.length > 8 || group.length < 2) {
    return
  }
  // second value must be at least 1% (see https://github.com/scraperwiki/magic-summary-tool/issues/46)
  if (group[1].c / total < 0.01) {
    return
  }

  var data = [['value', 'frequency']]
  $.each(group, function(ix, value) {
    data.push([format_for_display(value.val, false), value.c])
  })

  add_fact("groups_pie", 60 + score_delta, make_pie(col, data), col)
}

// Fact - date times
var fact_time_charts = function(col, group) {
  // See if we have enough images
  var time_count = 0
  $.each(group, function(ix, value) {
    var m = to_moment(value.val)
    if (m) {
      time_count++
    }
  })
  // if less than a quarter are times, give up
  if (time_count / group.length < 0.25) {
    return
  }

  // try grouping into buckets at various granularities - do in this order, so
  // we get the one with the most columns, yet fewer than 31 columns
  // (see the score used inside _bucket_time_chart's called to add_fact)
  _bucket_time_chart(col, group, function(m) { return m.format("YYYY").substr(0,3) + "0" }, 10, "years", function(m) { return m.format("YYYY").substr(0,3) + "0s" }, "time_chart_decade")
  _bucket_time_chart(col, group, function(m) { return m.format("YYYY") }, 1, "years", function(m) { return m.format("YYYY") }, "time_chart_year")
  _bucket_time_chart(col, group, function(m) { return m.format("YYYY-MM") }, 1, "months", function(m) { return m.format("MMM YYYY") }, "time_chart_month")
  _bucket_time_chart(col, group, function(m) { return m.format("YYYY-MM-DD") }, 1, "days", function(m) { return m.format("D MMM YYYY") }, "time_chart_day")
  _bucket_time_chart(col, group, function(m) { return m.format("YYYY-MM-DD HH") }, 1, "hours", function(m) { return m.format("ha D MMM YYYY") }, "time_chart_hour")

  // Add a simple date range fact too, to cover cases where all the charts were too large/small
  var earliest = moment("9999-12-31")
  var latest = moment("0001-01-01")
  var earliest_val
  var latest_val
  $.each(group, function(ix, value) {
    var m = to_moment(value.val)
    if (m) {
      if (m < earliest) {
        earliest = m
        earliest_val = value.val
      }
      if (m > latest) {
        latest = m
        latest_val = value.val
      }
    }
  })
  var html = '<h1>' + col + '</h1>'
  html += '<p class="lead">Between <b>' + earliest_val + '</b> and <b>' + latest_val + '</b>'
  html += '</p>'
  add_fact("time_range", 16, html, col)
}

var _bucket_time_chart = function(col, group, bucketFormat, bucketOffsetAmount, bucketOffsetType, humanFormat, name) {
  // Count number of items in each bucket (e.g. each month)
  var html = '<h1>' + col + '</h1>'
  var buckets = {}
  var earliest = bucketFormat(moment("9999-12-31"))
  var latest = bucketFormat(moment("0001-01-01"))
  $.each(group, function(ix, value) {
    var m = to_moment(value.val)
    if (m) {
      var bucket = bucketFormat(m)
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
  // Loop through every bucket in the range earliest to latest (e.g. each month) to make histogram
  var data = []
  var bars_count = 0
  for (var i = moment(earliest); i <= moment(latest); i.add(bucketOffsetType, bucketOffsetAmount)) {
    var bucket = bucketFormat(i)
    var human = humanFormat(i)
    if (bucket in buckets) {
      data.push([human, buckets[bucket], percent(buckets[bucket], total)])
      bars_count++
    } else {
      data.push([human, 0, "0%"])
    }
    // drop out early if too much to show
    if (data.length > 31) {
      return
    }
  }
  // Give up if we have too little
  if (data.length < 2) {
    return
  }
  data.unshift(['bucket', 'frequency', 'percent'])

  // we score slightly more, the more filled in bars there are in the histogram.
  add_fact(name, 91 + (bars_count / 100), make_time_bar(col, data), col)
}

// Fact - countries on a world map
// Rough list of countries taken from http://en.wikipedia.org/wiki/ISO_3166-1
countries = [
"Afghanistan", "Åland Islands", "Albania", "Algeria", "American Samoa", "Andorra", "Angola", "Anguilla", "Antarctica", "Antigua and Barbuda", "Argentina", "Armenia", "Aruba", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bermuda", "Bhutan", "Bolivia, Plurinational State of", "Bonaire, Sint Eustatius and Saba", "Bosnia and Herzegovina", "Botswana", "Bouvet Island", "Brazil", "British Indian Ocean Territory", "Brunei Darussalam", "Bulgaria", "Burkina Faso", "Burundi", "Cambodia", "Cameroon", "Canada", "Cape Verde", "Cayman Islands", "Central African Republic", "Chad", "Chile", "China", "Christmas Island", "Cocos (Keeling) Islands", "Colombia", "Comoros", "Congo", "Congo, the Democratic Republic of the", "Cook Islands", "Costa Rica", "Côte d'Ivoire", "Croatia", "Cuba", "Curaçao", "Cyprus", "Czech Republic", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Ethiopia", "Falkland Islands (Malvinas)", "Faroe Islands", "Fiji", "Finland", "France", "French Guiana", "French Polynesia", "French Southern Territories", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Gibraltar", "Greece", "Greenland", "Grenada", "Guadeloupe", "Guam", "Guatemala", "Guernsey", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Heard Island and McDonald Islands", "Holy See (Vatican City State)", "Honduras", "Hong Kong", "Hungary", "Iceland", "India", "Indonesia", "Iran, Islamic Republic of", "Iraq", "Ireland", "Isle of Man", "Israel", "Italy", "Jamaica", "Japan", "Jersey", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Korea, Democratic People's Republic of", "Korea, Republic of", "Kuwait", "Kyrgyzstan", "Lao People's Democratic Republic", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", 
"Macao", "Macedonia, The Former Yugoslav Republic of", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Martinique", "Mauritania", "Mauritius", "Mayotte", "Mexico", "Micronesia, Federated States of", "Moldova, Republic of", "Monaco", "Mongolia", "Montenegro", "Montserrat", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands", "New Caledonia", "New Zealand", "Nicaragua", "Niger", "Nigeria", "Niue", "Norfolk Island", "Northern Mariana Islands", "Norway", "Oman", "Pakistan", "Palau", "Palestine, State of", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Pitcairn", "Poland", "Portugal", "Puerto Rico", "Qatar", "Réunion", "Romania", "Russian Federation", "Rwanda", "Saint Barthélemy", "Saint Helena, Ascension and Tristan da Cunha", "Saint Kitts and Nevis", "Saint Lucia", "Saint Martin (French part)", "Saint Pierre and Miquelon", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Sint Maarten (Dutch part)", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Georgia and the South Sandwich Islands", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Svalbard and Jan Mayen", "Swaziland", "Sweden", "Switzerland", "Syrian Arab Republic", "Taiwan, Province of China", "Tajikistan", "Tanzania, United Republic of", "Thailand", "Timor-Leste", "Togo", "Tokelau", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Turks and Caicos Islands", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "United States Minor Outlying Islands", "Uruguay", "Uzbekistan", "Vanuatu", "Venezuela, Bolivarian Republic of", "Viet Nam", "Virgin Islands, British", "Virgin Islands, U.S.", "Wallis and Futuna", "Western Sahara", "Yemen", "Zambia", "Zimbabwe"
]
iso3166 = [
'AF', 'AX', 'AL', 'DZ', 'AS', 'AD', 'AO', 'AI', 'AQ', 'AG', 'AR', 'AM', 'AW', 'AU', 'AT', 'AZ', 'BS', 'BH', 'BD', 'BB', 'BY', 'BE', 'BZ', 'BJ', 'BM', 'BT', 'BO', 'BQ', 'BA', 'BW', 'BV', 'BR', 'IO', 'BN', 'BG', 'BF', 'BI', 'KH', 'CM', 'CA', 'CV', 'KY', 'CF', 'TD', 'CL', 'CN', 'CX', 'CC', 'CO', 'KM', 'CG', 'CD', 'CK', 'CR', 'CI', 'HR', 'CU', 'CW', 'CY', 'CZ', 'DK', 'DJ', 'DM', 'DO', 'EC', 'EG', 'SV', 'GQ', 'ER', 'EE', 'ET', 'FK', 'FO', 'FJ', 'FI', 'FR', 'GF', 'PF', 'TF', 'GA', 'GM', 'GE', 'DE', 'GH', 'GI', 'GR', 'GL', 'GD', 'GP', 'GU', 'GT', 'GG', 'GN', 'GW', 'GY', 'HT', 'HM', 'VA', 'HN', 'HK', 'HU', 'IS', 'IN', 'ID', 'IR', 'IQ', 'IE', 'IM', 'IL', 'IT', 'JM', 'JP', 'JE', 'JO', 'KZ', 'KE', 'KI', 'KP', 'KR', 'KW', 'KG', 'LA', 'LV', 'LB', 'LS', 'LR', 'LY', 'LI', 'LT', 'LU', 'MO', 'MK', 'MG', 'MW', 'MY', 'MV', 'ML', 'MT', 'MH', 'MQ', 'MR', 'MU', 'YT', 'MX', 'FM', 'MD', 'MC', 'MN', 'ME', 'MS', 'MA', 'MZ', 'MM', 'NA', 'NR', 'NP', 'NL', 'NC', 'NZ', 'NI', 'NE', 'NG', 'NU', 'NF', 'MP', 'NO', 'OM', 'PK', 'PW', 'PS', 'PA', 'PG', 'PY', 'PE', 'PH', 'PN', 'PL', 'PT', 'PR', 'QA', 'RE', 'RO', 'RU', 'RW', 'BL', 'SH', 'KN', 'LC', 'MF', 'PM', 'VC', 'WS', 'SM', 'ST', 'SA', 'SN', 'RS', 'SC', 'SL', 'SG', 'SX', 'SK', 'SI', 'SB', 'SO', 'ZA', 'GS', 'SS', 'ES', 'LK', 'SD', 'SR', 'SJ', 'SZ', 'SE', 'CH', 'SY', 'TW', 'TJ', 'TZ', 'TH', 'TL', 'TG', 'TK', 'TO', 'TT', 'TN', 'TR', 'TM', 'TC', 'TV', 'UG', 'UA', 'AE', 'GB', 'US', 'UM', 'UY', 'UZ', 'VU', 'VE', 'VN', 'VG', 'VI', 'WF', 'EH', 'YE', 'ZM', 'ZW'
]

var fact_countries_chart = function(col, group) {
  // See if we have enough countries
  var countries_count = 0
  $.each(group, function(ix, value) {
    if (_.contains(countries, $.trim(value.val)) || _.contains(iso3166, $.trim(value.val).toUpperCase())) {
      countries_count++
    }
  })
  // if less than three or less than 10% are countries, give up
  if (countries_count < 3 || (countries_count / group.length < 0.7)) {
    return
  }

  // Hand the strings to Google to work out what countries they are...
  var data = [['country', 'frequency', 'percent']]
  $.each(group, function(ix, value) {
    data.push([format_for_display(value.val, false), value.c, percent(value.c, total)])
  })

  add_fact("countries_chart", 91, make_geo_regions(col, data, 'world', 'countries'), col)
}

// XXX just US states for now, expand to all countries when we have some more examples...
// (I think Google charts does support other iso3166-2 regional codes)
var iso3166_2_us = [
'US-AL', 'US-AK', 'US-AZ', 'US-AR', 'US-CA', 'US-CO', 'US-CT', 'US-DE', 'US-FL', 'US-GA', 'US-HI', 'US-ID', 'US-IL', 'US-IN', 'US-IA', 'US-KS', 'US-KY', 'US-LA', 'US-ME', 'US-MD', 'US-MA', 'US-MI', 'US-MN', 'US-MS', 'US-MO', 'US-MT', 'US-NE', 'US-NV', 'US-NH', 'US-NJ', 'US-NM', 'US-NY', 'US-NC', 'US-ND', 'US-OH', 'US-OK', 'US-OR', 'US-PA', 'US-RI', 'US-SC', 'US-SD', 'US-TN', 'US-TX', 'US-UT', 'US-VT', 'US-VA', 'US-WA', 'US-WV', 'US-WI', 'US-WY', 'US-DC', 'US-AS', 'US-GU', 'US-MP', 'US-PR', 'US-UM', 'US-VI'
]
var fact_states_chart = function(col, group) {
  // See if we have enough countries
  var states_count = 0
  $.each(group, function(ix, value) {
    if (_.contains(iso3166_2_us, $.trim(value.val).toUpperCase()) || _.contains(iso3166_2_us, 'US-' + $.trim(value.val).toUpperCase())) {
      states_count++
    }
  })
  //console.log("states_count", states_count, states_count / group.length)
  // if less than three or less than 10% are states, give up
  if (states_count < 3 || (states_count / group.length < 0.7)) {
    return
  }

  // Hand the strings to Google to work out what states they are...
  var data = [['state', 'frequency', 'percent']]
  $.each(group, function(ix, value) {
    data.push([format_for_display(value.val, false), value.c, percent(value.c, total)])
  })

  add_fact("states_chart", 90, make_geo_regions(col, data, 'US', 'provinces'), col)
}


// Fact - make a histogram
var fact_numbers_chart = function(col, group) {
  // Enough numbers?
  var count = 0
  var min = Number.MAX_VALUE
  var max = -Number.MAX_VALUE
  $.each(group, function(ix, value) {
    var n = numberise(value.val)
    if (n != null) {
      if (n < min) {
        min = n
      }
      if (n > max) {
        max = n
      }
      count ++
    }
  })
  // at least half have to *look* like numbers
  if (count < (group.length / 2)) {
    return
  }
  // the numbers have to vary
  if (min == max) {
    return
  }

  // Decide on bin size
  // console.log("==>", col, "min", min, "max", max)
  var rough_bins_step = (max - min) / 33 // tweak this number to alter how many columns it goes for
  var log_rough_bins_step = Math.round(log10(rough_bins_step))
  var bins_step = Math.pow(10, log_rough_bins_step)
  // console.log("rough_bins_step", rough_bins_step, "log_rough_bins_step", log_rough_bins_step, "bins_step", bins_step)
  // ... step through buckets using integers for accuracy
  var start = Math.floor(min / bins_step)
  var end = Math.ceil(max / bins_step)
  // console.log("binning from", start, "to", end, "multiply by", bins_step)

  // Put into buckets
  var buckets = {}
  $.each(group, function(ix, value) {
    var n = numberise(value.val)
    if (n != null) {
      var bucket = Math.floor(n / bins_step)
      if (!(bucket in buckets)) {
        buckets[bucket] = 0
      }
      buckets[bucket] += value.c
    }
  })
  
  // Loop through every bucket 
  var data = []
  var highest = -Number.MAX_VALUE
  var second_highest = -Number.MAX_VALUE
  var lowest = Number.MAX_VALUE // excluding zero, i.e. lowest visible
  var visible_count = 0
  for (var i = start - 1; i <= end + 1; i++) {
    var bucket = i
    var bucket_val
    if (bucket in buckets) {
      bucket_val = buckets[bucket]
    } else {
      bucket_val = 0
    }
    data.push([((bucket + 0.5)* bins_step), bucket_val, ((bucket + 0) * bins_step), ((bucket + 1) * bins_step), percent(bucket_val, total)])
    if (bucket_val > highest) {
      second_highest = highest
      highest = bucket_val
    }
    if (bucket_val > second_highest && bucket_val < highest) {
      second_highest = bucket_val
    }
    if (bucket_val > 0 && bucket_val < lowest) {
      lowest = bucket_val
    }
    if (bucket_val > 0) {
      visible_count ++
    }
  }
  data.unshift([col, 'frequency', 'start', 'end', 'percent'])
  //console.log("  ", col, "lowest", lowest, "highest", highest, "second_highest", second_highest)

  // the second highest column needs to be at least 5% of data to have pretty charts
  if ((second_highest / total) < 0.05) {
    return
  }
  // if there are only got three columns, it's not interesting enough to show (a range / median is as good)
  if (visible_count <= 3) {
    return
  }

  // use logarithmic scale if highest is more than 250 (rough number of pixels) larger than lowest
  //var use_log = (highest / lowest > 250)
  // .. the log is confusing, disable for now
  var use_log = false

  add_fact("numbers_chart", 40, make_column(col, data, use_log, bins_step == 1), col)
}

// Fact show min/median/max
var fact_numbers_range = function(col, group) {
  if (group.length < 2) {
    return
  }

  var in_order = []

  // Enough numbers?
  var count = 0
  var min = Number.MAX_VALUE
  var max = -Number.MAX_VALUE
  var passed = 0
  var total_not_nulls = 0
  $.each(group, function(ix, value) {
    var n = numberise(value.val)
    if (n != null) {
      if (n < min) {
        min = n
      }
      if (n > max) {
        max = n
      }
      count++

      new_value = {}
      new_value.val = n
      new_value.c = value.c
      in_order.push(new_value)
      total_not_nulls += value.c
    }
  })
  // at least half have to *look* like numbers
  if (count < (group.length / 2)) {
    return
  }
  // the numbers have to vary
  if (min == max) {
    return
  }

  // sort so we can work out the median
  in_order.sort(function(a,b) { return a.val - b.val } )
  // console.log("  in_order", col, in_order)
  var so_far = 0
  var median = null
  $.each(in_order, function(ix, value) {
    so_far += value.c 
    if (so_far > total_not_nulls / 2) {
      median = value.val
      return false
    }
  })

  //console.log(in_order)
  //console.log("  col", col, "min", min, "max", max, "median", median)

  var html = '<h1>' + col + '</h1>'
  html += '<p class="lead">Between ~ <b>' + add_commas(round_sig_figs(min, 2)) + '</b> and <b>' + add_commas(round_sig_figs(max, 2)) + '</b>'
  html += '<br><span class="tip-bottom" title="i.e. the median value">Typically</span> it\'s ~ <b>' + add_commas(round_sig_figs(median, 2)) + '</b></p>'
  html += '</p>'

  add_fact("numbers_range", 15, html, col)
}

// Fact - images to be shown in collages
var fact_image_collage = function(col, group) {
  // See if we have enough images
  var image_count = 0
  var non_null_count = 0
  $.each(group, function(ix, value) {
    if (value.val != null) {
      non_null_count ++
      if (is_image_url(String(value.val))) {
        image_count ++
      }
    }
  })
  if (image_count < 1) {
    return
  }
  if (image_count < 4 && image_count != non_null_count) {
    return
  }

  // If so, show the first few
  var count = 0
  var html = '<h1>' + col + '</h1><div class="collage">'
  $.each(group, function(ix, value) {
    if (is_image_url(String(value.val))) {
      html += '<a target="_image_collage" href="' + value.val + '"><img class="tip-bottom" title="' + value.c + " (" + percent(value.c, total) + ')" src="' + value.val + '"></a>'
      count = count + 1
      if (count >= 16) {
        return false
      }
      if (count % 4 == 0) {
        html += '<br>'
      }
    }
  })
  html += "</div>"
  add_fact("image_collage", 100, html, col)
}

// Fact - text into a Wordle-like thing
var fact_word_cloud = function(col, group) {
  // get the words and count how many per row
  tags = {}
  var cases = {}
  var count = 0
  var total_wordings = 0
  $.each(group, function(ix, value) {
    String(value.val).split(wordCloudSeparators).forEach(function(word) {
      if (wordCloudDiscard.test(word)) return
      word = word.replace(wordCloudPunctuation, "")
      var word_lower = word.toLowerCase()
      if (wordCloudStops.test(word_lower)) return
      if (word_lower in nltk_stop_words) return
      if (word.length < 3) return
      word = word.substr(0, 30)
      cases[word.toLowerCase()] = word
      tags[word = word.toLowerCase()] = (tags[word] || 0) + 1 //value.c
      total_wordings += 1
    })
    count += 1
  })
  // an average of four words per value seems to mean we have some real text
  var avg = total_wordings / count
  //console.log(col, "average words per group is", avg)
  if (avg < 4) {
    return
  }

  tags = d3.entries(tags).sort(function(a, b) { return b.value - a.value; })
  tags.forEach(function(d) { d.key = cases[d.key]; })
  tags = tags.slice(0, 100)
  //console.log(col, "word tags", tags)
  add_fact("word_cloud", 50, make_word_cloud(col, tags), col)
}
// From Jonathan Feinberg's cue.language, see lib/cue.language/license.txt.
var wordCloudStops = /^(i|me|my|myself|we|us|our|ours|ourselves|you|your|yours|yourself|yourselves|he|him|his|himself|she|her|hers|herself|it|its|itself|they|them|their|theirs|themselves|what|which|who|whom|whose|this|that|these|those|am|is|are|was|were|be|been|being|have|has|had|having|do|does|did|doing|will|would|should|can|could|ought|i'm|you're|he's|she's|it's|we're|they're|i've|you've|we've|they've|i'd|you'd|he'd|she'd|we'd|they'd|i'll|you'll|he'll|she'll|we'll|they'll|isn't|aren't|wasn't|weren't|hasn't|haven't|hadn't|doesn't|don't|didn't|won't|wouldn't|shan't|shouldn't|can't|cannot|couldn't|mustn't|let's|that's|who's|what's|here's|there's|when's|where's|why's|how's|a|an|the|and|but|if|or|because|as|until|while|of|at|by|for|with|about|against|between|into|through|during|before|after|above|below|to|from|up|upon|down|in|out|on|off|over|under|again|further|then|once|here|there|when|where|why|how|all|any|both|each|few|more|most|other|some|such|no|nor|not|only|own|same|so|than|too|very|say|says|said|shall|)$/
var wordCloudPunctuation = /[!"&()*+,-\.\/:;<=>?\[\\\]^`\{|\}~]+/g
var wordCloudSeparators = /[\s\u3031-\u3035\u309b\u309c\u30a0\u30fc\uff70]+/g
var wordCloudDiscard = /^(@|https?:)/

// Fact - cluster URLs or emails by domain
var fact_domain_table = function(col, group) {
  // count number of URLs, and regroup by domain
  var domain_count = 0
  var by_domain = {}
  $.each(group, function(ix, value) {
    // get domains from URLs
    var m = String(value.val).match(/^(?:http|https|ftp):\/\/([a-zA-Z0-9-_\.]+)/i)
    if (!m) {
      // otherwise look for email addresses 
      // (very simple match: http://www.webmonkey.com/2008/08/four_regular_expressions_to_check_email_addresses/)
      m = String(value.val).match(/^.+\@(.+\..+)$/i)
    }
    if (m) {
      domain_count ++
      var top_domain = get_top_domain(m[1])
      if (!(top_domain in by_domain)) {
        by_domain[top_domain] = 0
      }
      by_domain[top_domain] += value.c
    }
  })
  if (domain_count < (group.length / 2)) {
    return
  }

  // reconstruct a new group in same format as other fact functions take
  var new_group = []
  $.each(by_domain, function(domain, count) {
    new_group.push({ 'val': domain, 'c': count})
  })
  new_group = new_group.sort(function(a, b) { return b.c - a.c })

  // send it to some appropriate other fact functions
  // ... reduce score slightly, as better to show full URLs if we've a choice
  fact_groups_table(col, new_group, -1)
  fact_groups_pie(col, new_group, -1)
}


