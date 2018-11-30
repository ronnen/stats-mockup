var firstTimeDrawDetailedView = true;

function drawDetailedView(mainObject, parentData, unitNode, drawOverviewParam) {

  var height = parseInt(d3.select('.svg-container').style('height'));
  var runSimulation = drawOverviewParam.runSimulation;
  var stopSimulation = drawOverviewParam.stopSimulation;

  const approvalTypesStartRadius = 0.3;
  const approvalTypesEndRadius = 0.95;
  const identityMargin = 20;
  const approvalsRadialStart = 0; // where bubbles start to show in degrees
  const approvalsRadialEnd = 300; // where bubbles start to show in degrees
  const maxApprovalBubble = 0.12; // as ratio of diameter
  const minApprovalBubble = 0.07;
  const approverRadius = 0.25;
  const clockColorRibbonRadius = 0.3;

  d3.select(unitNode).raise();

  // compute center and radius
  var outerRadius = zoomInDiameterFactor/2 * height;
  const typeMarkersGap = (approvalTypesEndRadius - approvalTypesStartRadius) / (countNonHidden(mainObject.approvalTypes) + 1);

  // var mainGroup = d3.select(".main-group");
  var unitGroup = d3.select(unitNode);

  // ensure cleanup before we start
  d3.selectAll(".main-units .detailed-group").remove();

  var detailedGroup = unitGroup.append("svg:g")
    .attr("class", "detailed-group")
    .on("click", handleFlowerClick)
    .on("mouseleave", approvalMouseLeave);

  unitGroup
    .call(d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended));

  function dragstarted(d) {
    // stopSimulation();
    d3.select(".submitterTooltip")
      .style("display","none");

    d3.select(unitNode).raise().classed("active", true);
    // var translated = getTranslation(d3.select(unitNode).attr("transform"));

    if (!d3.event.active) runSimulation(0.3); // simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;

  }

  function dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  }

  function dragended(d) {
    d3.select(unitNode).classed("active", false);
    // these lines commented out to fix node
    if (!d3.event.active) runSimulation(0); // simulation.alphaTarget(0);
    // d.fx = null;
    // d.fy = null;
  }

  function drawMainCircularShape() {
    // draws main grey circular shape
    detailedGroup.selectAll("circle")
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

  function handleFlowerClick(d, i) {
    d3.select(this).remove();
    d3.selectAll(".main-units").classed("selected", false).each(function(d) {
      d.selected = false;
      d.fx = null;
      d.fy = null;
    });
    d3.select(".submitterTooltip")
      .style("display","none");

    stopSimulation();
    window.dispatchEvent(new CustomEvent("drawOverviewByCriteria", {
      detail: {  }
    }));
    // runSimulation(0.3);

  }

  function drawCircularTypeMarkers() {
    // drawing cyclical markers

    function estimateAngleGapForText(radius, text) {
      return text.length * 8 / (radius); // gap in radians
    }

    // outer identity marker (which department and employee count)
    var gap = estimateAngleGapForText(outerRadius - identityMargin, parentData.department);

    detailedGroup.selectAll("identity.path")
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
    detailedGroup
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

    detailedGroup
      .append("text")
      .attr("class", "approval-type-label")
      .attr("dy", 3)
      .append("textPath") //append a textPath to the text element
      .attr("xlink:href", "#objectIdentityPath") //place the ID of the path here
      .style("text-anchor","middle") //place the text halfway on the arc
      .attr("startOffset", "24%")
      .text(parentData.department);

    // approval type circular markers (approval labels)

    detailedGroup.selectAll("approval-type.path")
      .data(approvalTypes.map(function(value, i) {
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
    detailedGroup
      .selectAll("approval-type-label-background.path")
      .data(approvalTypes.map(function(value, i) {
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

    detailedGroup
      .selectAll("approval-type-label.text")
      .data(approvalTypes)
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

  var approvalTypes = mainObject.approvalTypes.filter(function(t) {return !t.hidden});

  // calculate radial range based on top waitTime
  var maxWaitTime = d3.max(approvalTypes.map(function(v) {
    return d3.max(v.approvals, function(a) {return a.waitTime})
  }));

  var maxValue = d3.max(approvalTypes.map(function(v) {
    return d3.max(v.approvals, function(a) {return a.value})
  }));

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

  function drawAverageDelayMarkers() {

    // draw average delay guideline
    var avgGuideGroup = detailedGroup.selectAll("g.average-guide")
      .data(approvalTypes)
      .enter()
      .append("svg:g")
      .attr("class", "average-guide")
      .attr("transform", function (d) {
        var sampleDegrees = -180 + approvalsRadialStart +
          (approvalsRadialEnd - approvalsRadialStart) * (d.average / maxWaitTime);
        // console.log("sampleDegrees " + sampleDegrees + " " + waitToText(d.average));
        d.flipText = (sampleDegrees > 0);
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
      .attr("text-anchor", function(d) {return d.flipText ? "start" : "end"})
      .attr("dy", "1.2em")
      .attr("x", function (d, index) {
        return 0;
      })
      .attr("y", function (d, index) {
        return outerRadius * (approvalTypesStartRadius + (index + 1) * typeMarkersGap);
      })
      .text(function (d) {
        return waitToText(d.average);
      })
      .attr("transform", function (d, index) {
        var radius = outerRadius * (approvalTypesStartRadius + (index + 1) * typeMarkersGap);
        return d3.svg.transform()
          .translate(d.flipText ? -radius : radius, radius)
          .rotate(d.flipText ? -90 : 90)();
      });
  }

  function drawSpheresGuidelines() {
    // draw static base guideline
    detailedGroup
      .append("svg:line")
      .attr("class", "circular-marker")
      .attr("fill", "transparent")
      .attr("stroke-width", 1)
      .attr("x1", 0 )
      .attr("y1", 0)
      .attr("x2", 0 )
      .attr("y2", outerRadius - identityMargin)
      .attr("transform", "rotate(180)");


    // first drawing guide lines
    approvalTypes.forEach(function (t, index) {
      detailedGroup.selectAll("bubble-guide.line")
        .data(filterNonHidden(t.approvals))
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

  function approvalMouseLeave() {
    d3.selectAll(".approval-highlight").remove();
    d3.select(".submitterTooltip")
      .style("display","none");
  }

  function drawSpheres() {

    function approvalMouseEnter(d, i) {  // Add interactivity

      var currentApprovalCircle = d3.select(this).select(".approval-circle-foreground");
      var approvalRadius = parseFloat(currentApprovalCircle.attr("r"));


      d3.select(this)
        .append("circle")
        .attr("class", "approval-highlight")
        .attr("cx", currentApprovalCircle.attr("cx"))
        .attr("cy", currentApprovalCircle.attr("cy"))
        .attr("transform", currentApprovalCircle.attr("transform"))
        .attr("r", parseFloat(currentApprovalCircle.attr("r")) + 5)
        .on("mouseleave", approvalMouseLeave);

      var rect = this.getBoundingClientRect();

      d3.select(".submitterTooltip")
        .style("display","block")
        .style("left", (rect.x + rect.width/2 + approvalRadius + 10) + "px")
        .style("top", (rect.y + rect.height/2) + "px");

      d3.select(".submitter-content .submitter-name").text(d.submitter);
      d3.select(".submitter-content .wait-time").text("Waiting " + waitToText(d.waitTime));
    }

    function drawBackgroundOrForeground(foreground) {
      // now drawing spheres
      approvalTypes.forEach(function (t, index) {
        var className = foreground ? "sphere" : "sphere-background";
        var spheres = detailedGroup.selectAll("g." + className + index)
          .data(filterNonHidden(t.approvals))
          .enter()
          .append("svg:g")
          .attr("class", className + index);

        // the first iteration will create an opaque background to hide background
        // the second iteration has some transparency to show overlapping intersections

        // add sphere or sphere background
        spheres
          .append("circle")
          .attr("class", !foreground ? "main-circle-background" : "approval-circle-foreground")
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

        // add listener
        spheres
          .on("mouseenter", approvalMouseEnter);

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

      });
    }

    drawBackgroundOrForeground(false);
    drawBackgroundOrForeground(true);
  }

  function drawCenterSphere() {
    // draws center darker sphere

    var totalValueText = valueToText(mainObject.approverTotalValue);

    detailedGroup
      .append("circle")
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("r", approverRadius * outerRadius)
      .attr("class", "center center-circle-background");
    detailedGroup
      .append("text")
      .attr("class", "approver-name")
      .attr("text-anchor", "middle")
      .attr("x", 0)
      .attr("y", 0)
      .attr("dy", -5)
      .text(mainObject.approverName);
    detailedGroup
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
      detailedGroup
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

    var clockGroup = detailedGroup.selectAll("g.clock-group")
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
    var interpolateTime = d3.interpolateRound(0,30);

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
          var str, days = interpolateTime(t);

          if (days == 1)
            str = "One Day";
          else
            str = days + " Days";
          d3.select(".clock-time-text").text(str);
        }
      })
      .transition().duration(100).style("opacity",0);


  }

  drawMainCircularShape();
  drawCircularTypeMarkers();
  drawSpheresGuidelines();
  drawSpheres();
  drawAverageDelayMarkers();
  drawCenterSphere();
  drawColorfulRibbon();

  if (firstTimeDrawDetailedView) {
    firstTimeDrawDetailedView = !firstTimeDrawDetailedView;
    drawClockMotion();
  }

  // console.log("done");
}
