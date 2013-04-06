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
  _bucket_time_chart(col, group, "YYYY-MM-DD HH", "hours", "ha D MMM YYYY", "time_chart_hour", 93)
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
    // drop out early if too much to show
    if (data.length > 31) {
      return
    }
  }
  // Give up if we have too little
  if (data.length < 2) {
    return
  }
  data.unshift(['bucket', 'count'])

  add_fact(name, score, make_bar(col, data), col)
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
  if (countries_count < 3 || (countries_count / group.length < 0.1)) {
    return
  }

  // Hand the strings to Google to work out what countries they are...
  var data = [['country', 'count']]
  $.each(group, function(ix, value) {
    data.push([String(add_empty(value.val)), /*Math.round(100.0 * value.c / total)*/ value.c])
  })

  add_fact("countries_chart", 90, make_geo_countries(col, data), col)
}

// Fact - make a scatter diagram
var fact_numbers_chart = function(col, group) {
  // Enough numbers?
  var count = 0
  $.each(group, function(ix, value) {
    if (!isNaN(value.val)) {
      count ++
    }
  })
  if (count < (group.length / 2)) {
    return
  }

  var data = []
  $.each(group, function(ix, value) {
    if (!isNaN(value.val)) {
      data.push([Number(value.val), value.c])
    }
  })
  data.sort(function(a, b) { return a[0] - b[0] })
  data.unshift(['value', 'count'])

  add_fact("numbers_chart", 40, make_scatter(col, data), col)
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
      if (count >= 16) {
        return false
      }
      if (count % 4 == 0) {
        html += '<br>'
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

// Fact - text into a Wordle-like thing
var fact_word_cloud = function(col, group) {
  tags = {};
  var cases = {};
  var count = 0
  var total_wordings = 0
  $.each(group, function(ix, value) {
    String(value.val).split(wordCloudSeparators).forEach(function(word) {
      if (wordCloudDiscard.test(word)) return;
      word = word.replace(wordCloudPunctuation, "");
      if (wordCloudStops.test(word.toLowerCase())) return;
      if (word.length < 3) return;
      word = word.substr(0, 30);
      cases[word.toLowerCase()] = word;
      tags[word = word.toLowerCase()] = (tags[word] || 0) + 1 //value.c
      total_wordings += 1
    });
    count += 1
  })
  // an average of four words per value seems to mean we have some real text
  var avg = total_wordings / count
  //console.log(col, "average words per group is", avg)
  if (avg < 4) {
    return
  }

  tags = d3.entries(tags).sort(function(a, b) { return b.value - a.value; });
  tags.forEach(function(d) { d.key = cases[d.key]; });
  tags = tags.slice(0, 100)
  //console.log(col, "word tags", tags)
  add_fact("word_cloud", 50, make_word_cloud(col, tags), col)
}
// From Jonathan Feinberg's cue.language, see lib/cue.language/license.txt.
var wordCloudStops = /^(i|me|my|myself|we|us|our|ours|ourselves|you|your|yours|yourself|yourselves|he|him|his|himself|she|her|hers|herself|it|its|itself|they|them|their|theirs|themselves|what|which|who|whom|whose|this|that|these|those|am|is|are|was|were|be|been|being|have|has|had|having|do|does|did|doing|will|would|should|can|could|ought|i'm|you're|he's|she's|it's|we're|they're|i've|you've|we've|they've|i'd|you'd|he'd|she'd|we'd|they'd|i'll|you'll|he'll|she'll|we'll|they'll|isn't|aren't|wasn't|weren't|hasn't|haven't|hadn't|doesn't|don't|didn't|won't|wouldn't|shan't|shouldn't|can't|cannot|couldn't|mustn't|let's|that's|who's|what's|here's|there's|when's|where's|why's|how's|a|an|the|and|but|if|or|because|as|until|while|of|at|by|for|with|about|against|between|into|through|during|before|after|above|below|to|from|up|upon|down|in|out|on|off|over|under|again|further|then|once|here|there|when|where|why|how|all|any|both|each|few|more|most|other|some|such|no|nor|not|only|own|same|so|than|too|very|say|says|said|shall|)$/
var wordCloudPunctuation = /[!"&()*+,-\.\/:;<=>?\[\\\]^`\{|\}~]+/g
var wordCloudSeparators = /[\s\u3031-\u3035\u309b\u309c\u30a0\u30fc\uff70]+/g
var wordCloudDiscard = /^(@|https?:)/

