var firstTimeDrawOverview = true;
const zoomInDiameterFactor = 0.65;

function drawOverview(mainUnits) {

  var width = parseInt(d3.select('.svg-container').style('width')),
      height = parseInt(d3.select('.svg-container').style('height'));

  const maxDiameter = 0.65 * height;
  const diameter = Math.min(width / (mainUnits.length), maxDiameter); // diameter of closed state
  const outerRadius = diameter/2;
  const blownUpRadius = zoomInDiameterFactor/2 * height; // corresponds to radius in drawDetailedView
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

  // collect approval type
  var approvalTypeLabels = {};
  mainUnits.forEach(function(unit) {
    unit.approvers.forEach(function(approver) {
      approver.approvalTypes.forEach(function(t) {
        approvalTypeLabels[t.label] = true;
      });
    })
  });
  approvalTypeLabels = Object.keys(approvalTypeLabels);

  if (firstTimeDrawOverview) {
    console.log("max approver value " + maxValue);

    drawMenu({
      totalValueMin: 0,
      totalValueMax: maxValue,
      waitTimeMin: minWait,
      waitTimeMax: maxWait,
      approvalTypes: approvalTypeLabels
    });

    firstTimeDrawOverview = false;

  }

  d3.select("svg").remove();

  svg = d3.select(".svg-container").append("svg")
    .attr("width", width)
    .attr("height", height)
    .on("click", function() {
      // console.log("svg-container clicked");
      if (closeOpenFlowers()) {
        window.dispatchEvent(new CustomEvent("drawOverviewByCriteria", {
          detail: {  }
        }));
/*

        simulation
          .nodes(mainUnits)
          .alphaTarget(0.3).restart();
*/
      }
    });

  mainGroup = svg.append("svg:g")
    .attr("transform", "translate(" + (width / 2) + "," + (height / 2) + ")")
    .attr("class","main-group");

  const forceX = d3.forceX(width / 2).strength(0.015)
  const forceY = d3.forceY(height / 2).strength(0.015)

  // reference: https://d3indepth.com/force-layout/
  var simulation = d3.forceSimulation(mainUnits)
    .alphaDecay(0.03)
    .velocityDecay(0.2)
    // .force('charge', d3.forceManyBody().strength(800))
    .force("x", forceX)
    .force("y", forceY)
    .force('collision', d3.forceCollide().radius(function(d) {
      return (d.selected ? blownUpRadius : outerRadius) + 10; // d.radius
    }).iterations(5))
    .on('tick', ticked);

  function ticked() {
    unitGroups
      .attr("transform", function (d, index) {
        var y = d.y - (height/2);
        var x = d.x - (width/2);
        return "translate(" + x + "," + y + ")";
      });
  }

  var unitGroupsBase = mainGroup.selectAll("g.main-units")
    .data(mainUnits, function(d) {return d.department});

  var unitGroups = unitGroupsBase
    .enter()
    .append("svg:g");

  unitGroups
    .merge(unitGroupsBase)
    .attr("class", "main-units")
    .classed("selected", function(d) {
      return d.selected
    })
    .attr("transform", function (d, index) {
      if (!isNaN(parseFloat(d.fx))) {
        return d3.select(this).attr("transform");
      }
      var y = d.y - (height/2);
      var x = d.x - (width/2);
      // console.log("main-unit translate " + "translate(" + x + "," + y + ")");
      return "translate(" + x + "," + y + ")";
    });

  unitGroups
    .append("circle")
    .attr("r", outerRadius)
    .attr("class", "closed-sphere-background");

  unitGroupsBase.exit().remove();

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
    })
    .on("mouseenter", function(d) {
      d3.select(this).classed("highlight", true);
    })
    .on("mouseleave", function(d) {
      d3.select(this).classed("highlight", false);
    });

  approverGroups
    .append("circle")
    .attr("r", function(d) {
      return Math.max(approverBubbleRadius(d.approverTotalValue), minApproverBubbleRatio * outerRadius);
    })
    .style("mix-blend-mode", "multiply")
    .attr("class", "approver-sphere-background")
    .on("click", handleClick);
    // .on("mouseenter", handleMouseOver);

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

  function closeOpenFlowers() {
    // there's supposed to be only one really
    console.log("main unit clicked");
    var any = d3.selectAll(".main-units.selected .detailed-group").nodes().length;
    if (any) {
      d3.selectAll(".main-units.selected .detailed-group").remove();
      d3.select(".main-units.selected").on('mousedown.drag', null);
      d3.selectAll(".main-units").classed("selected", false).each(function(d) {
        d.selected = false;
        d.fx = null;
        d.fy = null;
      });
      d3.select(".submitterTooltip")
        .style("display","none");
    }

    return any;
  }

  function handleClick(d, i) {
    d3.event.stopPropagation();

    // first close all open flowers
    closeOpenFlowers();

    d3.select(this.parentNode.parentNode).classed("selected", true);
    var parentData = d3.select(this.parentNode.parentNode).datum();
    parentData.selected = true; // department marked as selected
    d.selected = true; // approver marked as selected
    window.dispatchEvent(new CustomEvent("drawOverviewByCriteria", { detail : {} }));
    runSimulation(0.3);
/*
    var parentData = d3.select(this.parentNode.parentNode).datum();
    parentData.selected = true; // department marked as selected
    drawDetailedView(d, parentData, this.parentNode.parentNode, runSimulation);
    runSimulation(0.3);
*/

    function runSimulation(alphaTarget) {
      alphaTarget = alphaTarget != null ? alphaTarget : 0.3;
      simulation
        .nodes(mainUnits)
        .alphaTarget(alphaTarget).restart();
    }
  }

}
