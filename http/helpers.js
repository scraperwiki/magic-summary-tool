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

