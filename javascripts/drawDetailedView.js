var firstTimeDrawDetailedView = true;
var legendToggle = false;

function drawDetailedView(mainObject, department, svg, position) {

  var width = parseInt(d3.select('.svg-container').style('width')),
      height = parseInt(d3.select('.svg-container').style('height'));

/*
  var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);
*/

  const diameter = 0.65;
  const approvalTypesStartRadius = 0.3;
  const approvalTypesEndRadius = 0.95;
  const identityMargin = 20;
  const approvalsRadialStart = 0; // where bubbles start to show in degrees
  const approvalsRadialEnd = 300; // where bubbles start to show in degrees
  const maxApprovalBubble = 0.12; // as ratio of diameter
  const minApprovalBubble = 0.07;
  const approverRadius = 0.25;
  const clockColorRibbonRadius = 0.3;

// compute center and radius
  var outerRadius = diameter/2 * height;
  const typeMarkersGap = (approvalTypesEndRadius - approvalTypesStartRadius) / (mainObject.approvalTypes.length + 1);

  var mainGroup = svg.append("svg:g")
    .attr("transform", "translate(" + position.x + "," + position.y + ")")
    // .attr("transform", "translate(" + (width/2) + "," + (height/2) + ")")
    .on("mouseleave", handleMouseOut);

  function drawMainCircularShape() {
    // draws main grey circular shape
    mainGroup.selectAll("circle")
      .data([{cx: 0, cy: 0, radius: outerRadius}])
      .enter()
      .append("circle")
      .attr("r", function (d, i) {
        return d.radius;
      })
      .attr("class", function (d, i) {
        return "main-circle-background";
      });
  }

  function handleMouseOut(d, i) {
    if (legendToggle) return; // not removing ourselves if legend is on
    console.log("mouseleave");
    window.removeEventListener("click",legendClickEvent);
    d3.select(this).remove();
    // d3.selectAll(".approver-sphere-background").classed("block-events", false); // reinstate mouseover
    d3.selectAll(".main-units").classed("selected", false);
  }

  function drawCircularTypeMarkers() {
    // drawing cyclical markers

    function estimateAngleGapForText(radius, text) {
      return text.length * 8 / (radius); // gap in radians
    }

    // outer identity marker (which department and employee count)
    var gap = estimateAngleGapForText(outerRadius - identityMargin, department);

    mainGroup.selectAll("identity.path")
      .data([{
        radius: outerRadius - identityMargin,
        from: 0, // toRadians(-30) + gap/2,
        to: 2*Math.PI // toRadians(330) - gap/2
      }])
      .enter()
      .append("svg:path")
      .attr("id", "objectIdentity")
      .attr("class", "identity circular-marker")
      .attr("fill", "transparent")
      .attr("stroke-width", function(d) {
        return 1;
      })
      .attr("stroke-linejoin", "round")
      .attr("d", function(d) {return arcSliceFull(d);});

    // background for the label
    mainGroup
      .append("svg:path")
      .attr("id", "objectIdentityPath")
      .attr("class", "background-stroke")
      .attr("fill", "transparent")
      .attr("stroke-width", 1)
      .attr("d", arcSliceFull({
        radius: outerRadius - identityMargin,
        to: toRadians(-30) + gap/2,
        from: toRadians(-30) - gap/2
      }));

    mainGroup
      .append("text")
      .attr("class", "approval-type-label")
      .attr("dy", 3)
      .append("textPath") //append a textPath to the text element
      .attr("xlink:href", "#objectIdentityPath") //place the ID of the path here
      .style("text-anchor","middle") //place the text halfway on the arc
      .attr("startOffset", "24%")
      .text(department);

    // approval type circular markers (approval labels)

    mainGroup.selectAll("approval-type.path")
      .data(mainObject.approvalTypes.map(function(value, i) {
        var radius = outerRadius * (approvalTypesStartRadius + (i+1)*typeMarkersGap);
        var gap = estimateAngleGapForText(radius, value.label);
        return {
          radius: radius,
          from: 0, // toRadians(-30) + gap/2,
          to: 2*Math.PI // toRadians(330) - gap/2
        };
      }))
      .enter()
      .append("svg:path")
      .attr("class", "approval-type circular-marker")
      .attr("fill", "transparent")
      .attr("stroke-width", function(d) {
        return 1;
      })
      .attr("stroke-linejoin", "round")
      .attr("d", function(d) {return arcSliceFull(d);});

    // add approval type labels on circles

    // background for the label
    mainGroup
      .selectAll("approval-type-label-background.path")
      .data(mainObject.approvalTypes.map(function(value, i) {
        var radius = outerRadius * (approvalTypesStartRadius + (i+1)*typeMarkersGap);
        var gap = estimateAngleGapForText(radius, value.label);
        return {
          radius: radius,
          to: toRadians(-30) + gap/2,
          from: toRadians(-30) - gap/2
        };
      }))
      .enter()
      .append("svg:path")
      .attr("id", function(d, i) {
        return "approvalType" + i;
      })
      .attr("class", "approval-type-label-background background-stroke")
      .attr("fill", "transparent")
      .attr("stroke-width", 1)
      .attr("d",  function(d) {return arcSliceFull(d);});

    mainGroup
      .selectAll("approval-type-label.text")
      .data(mainObject.approvalTypes)
      .enter()
      .append("text")
      .attr("class", "approval-type-label")
      .attr("dy", 3)
      .append("textPath") //append a textPath to the text element
      .attr("xlink:href", function(d,i) {
        return "#approvalType" + i
      }) //place the ID of the path here
      .style("text-anchor","middle") //place the text halfway on the arc
      // .attr("startOffset", "79%") // this will show the invert text
      .attr("startOffset", "24%")
      .text(function(d) {
        return d.label
      });
  }

  // calculate radial range based on top waitTime
  var maxWaitTime = d3.max(mainObject.approvalTypes.map(function(v) {
    return d3.max(v.approvals, function(a) {return a.waitTime})
  }));

  var maxValue = d3.max(mainObject.approvalTypes.map(function(v) {
    return d3.max(v.approvals, function(a) {return a.value})
  }));

  function toRadians (angle) {
    return angle * (Math.PI / 180);
  }

  // for interpolation purposes (approvals don't occupy entire circle to keep space for legend)
  const approvalsGlobalSlice = (approvalsRadialEnd - approvalsRadialStart)/360;
  var linearScale = d3.scaleLinear()
    .domain([0, maxWaitTime / approvalsGlobalSlice])
    .range([0, 4]);  // corresponds to 4 color segments

  // values translated between 0 and diameter of
  var valueDiameterScale = d3.scaleLinear()
    .domain([0, maxValue])
    .range([0, maxApprovalBubble * outerRadius * 2]);
  const minimalBubbleSize = minApprovalBubble * outerRadius * 2;

  // var colorInterpolate = d3.interpolate([155,189,146], [199,164,158]);

  // for better gradient I divide the spectrum to 4 sections of colors
  var ribbonInterpolate = [
    d3.interpolate([127,173,117], [171,173,110]),
    d3.interpolate([171,173,110], [206,164,98]),
    d3.interpolate([206,164,98], [203,128,94]),
    d3.interpolate([203,128,94],[190,94,95])
  ];

  function drawSpheresGuidelines() {
    // draw static base guideline
    mainGroup
      .append("svg:line")
      .attr("class", "circular-marker")
      .attr("fill", "transparent")
      .attr("stroke-width", 1)
      .attr("x1", 0 )
      .attr("y1", 0)
      .attr("x2", 0 )
      .attr("y2", outerRadius - identityMargin)
      .attr("transform", "rotate(180)");

    // draw average delay guideline
    var avgGuideGroup = mainGroup.selectAll("g.average-guide")
      .data(mainObject.approvalTypes)
      .enter()
      .append("svg:g")
      .attr("class", "average-guide")
      .attr("transform", function (d) {
        var sampleDegrees = -180 + approvalsRadialStart +
          (approvalsRadialEnd - approvalsRadialStart) * (d.average / maxWaitTime);
        return "rotate(" + sampleDegrees + ")";
      });

    avgGuideGroup
      .append("svg:line")
      .attr("class", "average-guide")
      .style("stroke-dasharray", ("5, 2"))
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", 0)
      .attr("y2", function (d, index) {
        return outerRadius * (approvalTypesStartRadius + (index + 1) * typeMarkersGap)
      });

    avgGuideGroup
      .append("text")
      .attr("class", "average-guide-label")
      .attr("text-anchor", "end")
      .attr("dy", "1.2em")
      .attr("x", function (d, index) {
        return 0;
      })
      .attr("y", function (d, index) {
        return outerRadius * (approvalTypesStartRadius + (index + 1) * typeMarkersGap);
      })
      .text(function (d) {
        return d.averageLabel;
      })
      .attr("transform", function (d, index) {
        var radius = outerRadius * (approvalTypesStartRadius + (index + 1) * typeMarkersGap);
        return d3.svg.transform()
          .translate(radius, radius)
          .rotate(90)();
      });

    // first drawing guide lines
    mainObject.approvalTypes.forEach(function (t, index) {
      mainGroup.selectAll("bubble-guide.line")
        .data(t.approvals)
        .enter()
        .append("svg:line")
        .attr("class", "bubble-guide")
        .attr("fill", "transparent")
        // .attr("stroke", "black")
        .attr("stroke", function (d) {
          // probably there is a special d3 color interpolation function
          var colorPoint = linearScale(d.waitTime);
          var rgb = ribbonInterpolate[Math.floor(colorPoint)](colorPoint % 1);
          // var rgb = colorInterpolate(linearScale(d.waitTime));
          return "rgb(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + ")";
        })
        .attr("stroke-width", 1)
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", 0)
        .attr("y2", function (d) {
          return outerRadius * (approvalTypesStartRadius + (index + 1) * typeMarkersGap)
        })
        .attr("transform", function (d) {
          var sampleDegrees = -180 + approvalsRadialStart +
            (approvalsRadialEnd - approvalsRadialStart) * (d.waitTime / maxWaitTime);
          return "rotate(" + sampleDegrees + ")";
        });
    });
  }

  function drawSpheres() {

    function drawBackgroundOrForeground(foreground) {
      // now drawing spheres
      mainObject.approvalTypes.forEach(function (t, index) {
        var className = foreground ? "sphere" : "sphere-background";
        var spheres = mainGroup.selectAll("g." + className + index)
          .data(t.approvals)
          .enter()
          .append("svg:g")
          .attr("class", className + index);

        // the first iteration will create an opaque background to hide background
        // the second iteration has some transparency to show overlapping intersections

        // add sphere or sphere background
        spheres
          .append("circle")
          .attr("class", !foreground ? " main-circle-background" : "")
          .attr("stroke", "transparent")
          .attr("fill", function (d) {
            if (!foreground) return;
            // probably there is a special d3 color interpolation function
            var colorPoint = linearScale(d.waitTime);
            var rgb = ribbonInterpolate[Math.floor(colorPoint)](colorPoint % 1);
            return "rgb(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + ")";
          })
          .style("mix-blend-mode", foreground ? "multiply" : null)
          .attr("cx", function (d) {
            return 0;
          })
          .attr("cy", function (d) {
            return outerRadius * (approvalTypesStartRadius + (index + 1) * typeMarkersGap)
          })
          .attr("r", function (d, i) {
            // there is minimal bubble size...
            return Math.max(valueDiameterScale(d.value) / 2, minimalBubbleSize / 2);
          })
          .attr("transform", function (d) {
            var sampleDegrees = -180 + approvalsRadialStart +
              (approvalsRadialEnd - approvalsRadialStart) * (d.waitTime / maxWaitTime);
            return "rotate(" + sampleDegrees + ")";
          });

        if (!foreground) return;

        // add label
        spheres
          .append("text")
          .attr("class", "approval-value")
          .attr("text-anchor", "middle")
          .attr("dy", ".35em")
          .attr("x", function (d) {
            // calculate absolute position based on radius and angle
            var radius = outerRadius * (approvalTypesStartRadius + (index + 1) * typeMarkersGap)
            var angle = -90 + approvalsRadialStart + (approvalsRadialEnd - approvalsRadialStart) * (d.waitTime / maxWaitTime);
            return Math.cos(toRadians(angle)) * radius;
          })
          .attr("y", function (d) {
            // calculate absolute position based on radius and angle
            var radius = outerRadius * (approvalTypesStartRadius + (index + 1) * typeMarkersGap)
            var angle = -90 + approvalsRadialStart + (approvalsRadialEnd - approvalsRadialStart) * (d.waitTime / maxWaitTime);
            return Math.sin(toRadians(angle)) * radius;
          })
          .text(function (d) {
            return valueToText(d.value);
          });

        d3.select(".svg-container")
          .append("div")
          .attr("class", "");
      });
    }

    drawBackgroundOrForeground(false);
    drawBackgroundOrForeground(true);
  }

  function drawCenterSphere() {
    // draws center darker sphere

    var totalValueText = valueToText(mainObject.approverTotalValue);

    mainGroup
      .append("circle")
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("r", approverRadius * outerRadius)
      .attr("class", "center center-circle-background");
    mainGroup
      .append("text")
      .attr("class", "approver-name")
      .attr("text-anchor", "middle")
      .attr("x", 0)
      .attr("y", 0)
      .attr("dy", -5)
      .text(mainObject.approverName);
    mainGroup
      .append("text")
      .attr("class", "approver-value")
      .attr("text-anchor", "middle")
      .attr("x", 0)
      .attr("y", 0)
      .attr("dy", 20)
      .text(totalValueText);
  }

  function drawColorfulRibbon() {
    var arcSlice = d3.arc()
      .startAngle(toRadians(0))
      .endAngle(toRadians(2))
      .innerRadius(outerRadius * clockColorRibbonRadius)
      .outerRadius(outerRadius * clockColorRibbonRadius);

    for (var i = 0; i < 360; i++) {
      var rgb = ribbonInterpolate[Math.floor(i / 90)](i % 90 / 90);
      mainGroup
        .append("svg:path")
        .attr("stroke", "rgb(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + ")")
        .attr("stroke-width", 5)
        // .attr("stroke-linejoin", "miter")
        .attr("d", arcSlice())
        .attr("transform", "rotate(" + i + ")");
    }
  }

  function drawClockMotion() {
    function tweenArc(b) {
      return function(a) {
        var i = d3.interpolate(a, b);
        for (var key in b) a[key] = b[key]; // update data
        return function(t) {
          return arc(i(t));
        };
      };
    }

    var arc = d3.arc()
      .startAngle(function(d) {
        return d.value * 2 * Math.PI;
      })
      .endAngle(2 * Math.PI)
      .innerRadius(function(d) { return d.innerRadius; })
      .outerRadius(function(d) { return d.outerRadius; });

    var clockGroup = mainGroup.selectAll("g.clock-group")
      .data([{value: 0, innerRadius: 0, outerRadius: outerRadius}])
      .enter()
      .append("svg:g")
      .attr("class", "clock");

    // draws clock background
    // clockGroup.append("circle").attr("r", outerRadius).attr("class", "clock-background");

    clockGroup
      .append("path")
      .attr("class", "clock-pie")
      .transition().duration(2000).ease(d3.easeLinear)
      .attrTween("d", tweenArc({ value : 1 , innerRadius: 0, outerRadius: outerRadius}))
      .transition().duration(100).style("opacity",0)
      .on("end", function() {
        clockGroup.remove();
      });

    var clockTimeGroup = clockGroup.append("svg:g").attr("class", "clock-time");

    var interpolate = d3.interpolate(0.25*Math.PI, 2.25 * Math.PI);
    var interpolateTime = d3.interpolateRound(0,60);

    var textPosition = 200;

    clockTimeGroup
      .append("circle")
      .attr("class", "clock-time-circle")
      .transition().duration(2000).ease(d3.easeLinear)
      .attr("r", 50)
      .attr("cy", 0)
      .attrTween("cx", function(d) {
        return function(t) {
          return Math.sin(interpolate(t)) * (d.outerRadius - textPosition);
        };
      })
      .attrTween("cy", function(d) {
        return function(t) {
          return -Math.cos(interpolate(t)) * (d.outerRadius - textPosition);
        };
      })
      .transition().duration(100).style("opacity",0);

    clockTimeGroup
      .append("text")
      .attr("class", "clock-time-text")
      .transition().duration(2000).ease(d3.easeLinear)
      .attr("text-anchor", "middle")
      .attrTween("x", function(d) {
        return function(t) {
          return Math.sin(interpolate(t)) * (d.outerRadius - textPosition);
        };
      })
      .attrTween("y", function(d) {
        return function(t) {
          return -Math.cos(interpolate(t)) * (d.outerRadius - textPosition);
        };
      })
      .attr("dy", "0.5em")
      .tween("text", function(d) {
        return function(t) {
          var str, seconds = interpolateTime(t);

          if (seconds == 60)
            str = "01:00";
          else
            str = "0:" + (seconds < 10 ? "0" : "") + seconds;
          d3.select(".clock-time-text").text(str);
        }
      })
      .transition().duration(100).style("opacity",0);


  }

  window.addEventListener("click",legendClickEvent);

  function legendClickEvent(event) {
    var arcLegendCircle = d3.arc()
      .startAngle(0)
      .endAngle(toRadians(330))
      .innerRadius(outerRadius - identityMargin)
      .outerRadius(outerRadius - identityMargin);

    var svg = d3.select("svg");

    if (!legendToggle) {
      var w = window,
        d = document,
        e = d.documentElement,
        g = d.getElementsByTagName('.svg-container')[0],
        x = w.innerWidth || e.clientWidth || g.clientWidth,
        y = w.innerHeight || e.clientHeight || g.clientHeight;

      var darkScreen = svg
        .append("svg:g")
        .attr("class", "dark-legend");

      darkScreen
        .append("rect")
        .attr("width", x)
        .attr("height", y);

      var legendGroup = darkScreen
        .append("svg:g")
        .attr("transform", "translate(" + position.x + "," + position.y + ")");
        // .attr("transform", "translate(" + (width/2) + "," + (height/2) + ")");

      // add circular legend
      legendGroup
        .append("svg:path")
        .attr("class", "circular-legend")
        .attr("d", arcLegendCircle());

      var pX = Math.cos(toRadians(240))*(outerRadius - identityMargin),
        pY = Math.sin(toRadians(240))*(outerRadius - identityMargin);

      legendGroup
        .append("line")
        .attr("class", "circular-legend")
        .attr("x1", pX).attr("y1", pY).attr("x2", pX-40).attr("y2", pY);
      legendGroup
        .append("line")
        .attr("class", "circular-legend")
        .attr("x1", pX).attr("y1", pY).attr("x2", pX).attr("y2", pY+40);

      d3.select(".mainObjectLegend")
        .style("display","block")
        .style("left", position.x + "px")
        .style("top", position.y + "px");
    }
    else {
      window.removeEventListener("click",legendClickEvent);
      d3.selectAll('.dark-legend').remove();
      d3.select(".mainObjectLegend")
        .style("display","none");
    }

    legendToggle = !legendToggle;
  };

  drawMainCircularShape();
  drawCircularTypeMarkers();
  drawSpheresGuidelines();
  drawSpheres();
  drawCenterSphere();
  drawColorfulRibbon();

  if (firstTimeDrawDetailedView) {
    firstTimeDrawDetailedView = !firstTimeDrawDetailedView;
    drawClockMotion();
  }

  // console.log("done");
}
