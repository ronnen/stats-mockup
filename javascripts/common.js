var toRadians = function(angle) {
  return angle * (Math.PI / 180);
};

var arcSliceFull = d3.arc()
  .startAngle(function (d) {
    return d.from;
  })
  .endAngle(function (d) {
    return d.to;
  })
  .innerRadius(function (d) {
    return d.radius;
  })
  .outerRadius(function (d) {
    return d.radius;
  });

var valueToText = function(value) {
  var totalValueText;
  if (value > 1000000) {
    totalValueText = (value/1000000).toFixed(1) + "M";
  }
  else if (value > 1000) {
    totalValueText = (value/1000).toFixed(0) + "K";
  }
  else {
    totalValueText = value.toFixed(0);
  }
  
  return totalValueText;
};

var waitToText = function(value) {
  var waitText;
  if (value > 48) {
    waitText = Math.ceil(value/24) + " Days";
  }
  else {
    waitText = value + " HOURS";
  }

  return waitText;
};

var getTranslation = function(transform) {
  // Create a dummy g for calculation purposes only. This will never
  // be appended to the DOM and will be discarded once this function
  // returns.
  var g = document.createElementNS("http://www.w3.org/2000/svg", "g");

  // Set the transform attribute to the provided string value.
  g.setAttributeNS(null, "transform", transform);

  // consolidate the SVGTransformList containing all transformations
  // to a single SVGTransform of type SVG_TRANSFORM_MATRIX and get
  // its SVGMatrix.
  var matrix = g.transform.baseVal.consolidate().matrix;

  // As per definition values e and f are the ones for the translation.
  return [matrix.e, matrix.f];
};

var countNonHidden = function(array) {
  return array.reduce(function(count, element) {return count + (element.hidden ? 0 : 1)}, 0);
};

var filterNonHidden = function(array) {
  return array.filter(function(element) {return !element.hidden});
};

/*
var getRelativeXY = function(x, y, svg, element){
  var p = svg.createSVGPoint();
  var ctm = element.getCTM();
  p.x = x;
  p.y = y;
  return p.matrixTransform(ctm);
};
*/
