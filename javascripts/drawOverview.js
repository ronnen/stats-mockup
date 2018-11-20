var firstTimeDrawOverview = true;

function drawOverview(mainUnits) {

  var width = parseInt(d3.select('.svg-container').style('width')),
      height = parseInt(d3.select('.svg-container').style('height'));

  const maxDiameter = 0.65 * height;
  const diameter = Math.min(width / (mainUnits.length), maxDiameter); // diameter of closed state
  const outerRadius = diameter/2;
  const minApproverBubbleRatio = 0.3;
  const maxApproverBubbleRatio = 0.6;
  const identityMargin = 20;
  var svg, mainGroup, maxValue, minWait, maxWait;

  maxValue = d3.max(mainUnits.map(function(v) {
    return d3.max(v.approvers, function(a) {return a.approverTotalValue})
  }));

  maxWait = d3.max(mainUnits.map(function(v) {
    return d3.max(v.approvers, function(approver) {
      return d3.max(approver.approvalTypes, function(approvalType) {
        return d3.max(approvalType.approvals, function(approval) {
          return approval.waitTime;
        })
      })
    })
  }));

  minWait = d3.min(mainUnits.map(function(v) {
    return d3.min(v.approvers, function(approver) {
      return d3.min(approver.approvalTypes, function(approvalType) {
        return d3.min(approvalType.approvals, function(approval) {
          return approval.waitTime;
        })
      })
    })
  }));

  if (firstTimeDrawOverview) {
    console.log("max approver value " + maxValue);

    drawMenu({
      totalValueMin: 0,
      totalValueMax: maxValue,
      waitTimeMin: minWait,
      waitTimeMax: maxWait,
    });

    firstTimeDrawOverview = false;
  }
  else {
    // svg = d3.select("body").append("svg");
    // mainGroup = d3.select("g.main-group");
  }

  d3.select("svg").remove();

  svg = d3.select(".svg-container").append("svg")
    .attr("width", width)
    .attr("height", height);

  mainGroup = svg.append("svg:g")
    .attr("transform", "translate(" + (width / 2) + "," + (height / 2) + ")")
    .attr("class","main-group");

  function toRadians (angle) {
    return angle * (Math.PI / 180);
  }

  // using outerRadius of units to spread them around the screen center
  var spreadRadius = mainUnits.length <= 1 ? 0 : outerRadius * 1.3;

  var unitGroups = mainGroup.selectAll("g.main-units")
    .data(mainUnits)
    .enter()
    .append("svg:g")
    .attr("class", "main-units")
    .attr("transform", function (d, index) {
      var degOffset = index * 360 / mainUnits.length - 90;
      var y = -Math.cos(toRadians(degOffset)) * spreadRadius;
      var x = Math.sin(toRadians(degOffset)) * spreadRadius;
      return "translate(" + x + "," + y + ")";
    });

  unitGroups
    .append("circle")
    .attr("r", outerRadius)
    .attr("class", "closed-sphere-background");

  // draw unit identity marker

  function estimateAngleGapForText(radius, text) {
    return text.length * 8 / (radius); // gap in radians
  }

  // outer identity marker (which department and employee count)

  const fullCircle = {
    radius: outerRadius - identityMargin,
    from: 0,
    to: 2*Math.PI
  };

  unitGroups // might need to change class name
    .append("svg:path")
    .attr("class", "identity circular-marker")
    .attr("fill", "transparent")
    .attr("stroke-width", function(d) {
      return 1;
    })
    .attr("stroke-linejoin", "round")
    .attr("d", function(d) {return arcSliceFull(fullCircle);});

  // background for the label
  unitGroups
    .append("svg:path")
    .attr("id", function(d,index) {
      return "objectIdentityPath-" + index;
    })
    .attr("class", "background-stroke")
    .attr("fill", "transparent")
    .attr("stroke-width", 1)
    .attr("d", function(d) {
      var gap = estimateAngleGapForText(outerRadius - identityMargin, d.department);
      return arcSliceFull({
        radius: outerRadius - identityMargin,
        to: toRadians(120) + gap/2,
        from: toRadians(120) - gap/2
      })
    });

  unitGroups
    .append("text")
    .attr("class", "approval-type-label")
    .attr("dy", 3)
    .append("textPath") //append a textPath to the text element
    .attr("xlink:href", function(d,index) {
      return "#objectIdentityPath-" + index;
    }) //place the ID of the path here
    .style("text-anchor","middle") //place the text halfway on the arc
    .attr("startOffset", "76%")
    .text(function(d) {
      return d.department;
    });

  // add approver bubbles inside units

  var approverBubbleRadius = d3.scaleLinear()
    .domain([0, maxValue])
    .range([0, maxApproverBubbleRatio * outerRadius]);  // corresponds to 4 color segments

  var approverGroups = unitGroups
    .selectAll("g.approver-group")
    .data(function(d) {
      var maxApproverValueInUnit = d3.max(d.approvers, function(a) {return a.approverTotalValue});
      d.spreadRadius = d.approvers.length <= 1 ? 0 :
        (d.approvers.length == 2 ?
          minApproverBubbleRatio * outerRadius :
          Math.max(approverBubbleRadius(maxApproverValueInUnit), minApproverBubbleRatio * outerRadius)
        );
      return d.approvers;
    })
    .enter()
    .append("svg:g")
    .attr("class", "approver-group")
    .attr("transform", function (d, index) {
      var parentData = d3.select(this.parentNode).datum();
      var totalBubbles = parentData.approvers.length;
      var degOffset = index * 360 / totalBubbles - 30;
      var y = -Math.cos(toRadians(degOffset)) * parentData.spreadRadius;
      var x = Math.sin(toRadians(degOffset)) * parentData.spreadRadius;
      return "translate(" + x + "," + y + ")";
    });

  approverGroups
    .append("circle")
    .attr("r", function(d) {
      return Math.max(approverBubbleRadius(d.approverTotalValue), minApproverBubbleRatio * outerRadius);
    })
    .style("mix-blend-mode", "multiply")
    .attr("class", "approver-sphere-background")
    .on("mouseenter", handleMouseOver);

  // add label
  approverGroups
    .append("text")
    .attr("class", "approver-name")
    .attr("text-anchor", "middle")
    .attr("dy", "-.35em")
    .text(function (d) {
      return d.approverName;
    });

  // add value
  approverGroups
    .append("text")
    .attr("class", "approver-value")
    .attr("text-anchor", "middle")
    .attr("dy", "1em")
    .text(function (d) {
      return valueToText(d.approverTotalValue);
    });

  function handleMouseOver(d, i) {  // Add interactivity
    console.log("mouseover " + d.approverName);
    // d3.selectAll(".approver-sphere-background").classed("block-events", true);
    d3.select(this.parentNode.parentNode).classed("selected", true);
    var parentData = d3.select(this.parentNode.parentNode).datum();
    var rect = this.getBoundingClientRect();
    // var unitTransform = d3.select(this.parentNode.parentNode).attr("transform");
    drawDetailedView(d, parentData.department, svg, {
      x: rect.x + rect.width/2,
      y: rect.y + rect.height/2 + window.scrollY
    } );
  }

}
