const Color = {
	light: 0,
	dark: 1
};
const threshold = 220;

// The simplest method for now. 
// It takes the colors from all fill, stroke or style attributes, 
// finds the middle value and calculates accordingly.
function weightedColor(svgElement) {
    var colors = svgElement.match(/(style|fill|stroke)="#[0-9a-fA-F]{3,6}|rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)*"/g);

    if (colors == null) {
        return Color.dark;
    }

    var midValue = 0;
    for (const color of colors) {
      // TODO: Add a weight based on the area of current path.
      var hexValue = color.match(/#[0-9a-fA-F]{3,6}/g);

      if (hexValue != null) {
        var rgb = hexToRgb(hexValue);
        midValue += (rgb.r + rgb.g + rgb.b)/3;
      } else {
        var rgbaValue = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)/g);
        if (rgbaValue != null) {
          let rgb = rgbaToRgb(rgbaValue);
          midValue += (rgb.r + rgb.g + rgb.b)/3;
        }
      }
    }

    midValue /= colors.length;
    if (midValue > threshold) {
        return Color.light;
    } else {
        return Color.dark;
    }
}

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function rgbaToRgb(rgba) {
  var result = /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/i.exec(rgba);
  return result ? {
    r: parseInt(result[1]),
    g: parseInt(result[2]),
    b: parseInt(result[3])
  } : null;
}