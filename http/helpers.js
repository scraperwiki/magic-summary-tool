// Small helper functions

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

var is_image_url = function (val) {
  if (val.match(/^((http|https|ftp):\/\/[a-zA-Z0-9-_~#:\.\?%&\/\[\]@\!\$'\(\)\*\+,;=]+(\.jpeg|\.png|\.jpg|\.gif|\.bmp|_normal))$/i)) {
    return true
  }
  if (val.match(/^((http|https|ftp):\/\/[a-z0-9\.]+licdn.com\/mpr\/mpr[a-zA-Z0-9-_~#:\.\?%&\/\[\]@\!\$'\(\)\*\+,;=]+)$/i)) {
    return true
  }
  return false
}

// http://stackoverflow.com/a/11319865/284340
var get_top_domain = function(input) {
  var m = input.match(/[-\w]+\.(?:[-\w]+\.xn--[-\w]+|[-\w]{3,}|[-\w]+\.[-\w]{2})$/i)
  if (m)
    return m[0]
  return input
}

// http://stackoverflow.com/questions/3019278/any-way-to-specify-the-base-of-math-log-in-javascript
var log10 = function(val) {
  return Math.log(val) / Math.LN10
}

// Returns a numeric conversion of val if it is a number, or null if not
var numberise = function(val) {
  if (String(val) == "null" || String(val) == "") 
    return null
  var n = Number(val)
  if (isNaN(n))
    return null
  return n
}

// http://stackoverflow.com/questions/2901102/how-to-print-a-number-with-commas-as-thousands-separators-in-javascript
var add_commas = function(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
