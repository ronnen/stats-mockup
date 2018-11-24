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

/*
var getRelativeXY = function(x, y, svg, element){
  var p = svg.createSVGPoint();
  var ctm = element.getCTM();
  p.x = x;
  p.y = y;
  return p.matrixTransform(ctm);
};
*/
