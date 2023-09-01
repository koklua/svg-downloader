const Color = {
	light: 0,
	dark: 1
};

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
        // TODO: Check if it is hex or rgba value
        var value = color.match(/#[0-9a-fA-F]{3,6}|rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)/g);
        var rgb = hexToRgb(value);
        // TODO: Add a weight based on the area of current path.
        midValue += (rgb.r + rgb.g + rgb.b)/3;
    }

    midValue /= colors.length;
    if (midValue > 200) {
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