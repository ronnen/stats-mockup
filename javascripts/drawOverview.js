var freshDataLoaded = true; // being set every time fresh data is loaded
const zoomInDiameterFactor = 0.65;

function drawOverview(mainUnits) {
  if (freshDataLoaded) {
    calculateTotalValues(mainUnits);
    if (tableToggleState) {
      refreshTable(getAllVisibleApprovals());
    }
  }

  var width = parseInt(d3.select('.svg-container').style('width')),
      height = parseInt(d3.select('.svg-container').style('height'));

  mainUnits = filterNonHidden(mainUnits);

  // const maxDiameter = 0.65 * height;
  // const diameter = Math.min(width / (mainUnits.length), maxDiameter); // diameter of closed state
  // const outerRadius = diameter/2;
  const blownUpRadius = zoomInDiameterFactor/2 * height; // corresponds to radius in drawDetailedView
  const minApproverBubbleRatio = 0.3;
  const maxApproverBubbleRatio = 0.6;
  const identityMargin = 20;
  var svg, mainGroup, maxValue, minWait, maxWait, minAmount, maxAmount;

  // calculate appropriate factor for outerRadius

  // if we want to go with total value of approvals to represent bubble size
  // var sumOfTotalValue = d3.sum(mainUnits, function(d) {return d.unitTotalValue});
  // var outerRadiusFactor = width*height*0.7 / (sumOfTotalValue || 1); // measure how much space per unit given screen size

  // if we want to go with # of employees to represent bubble size
  var sumOfEmployees = d3.sum(mainUnits, function(d) {return d.employees});
  var outerRadiusFactor = width*height*0.7 / (sumOfEmployees || 1); // measure how much space per unit given screen size

  mainUnits.forEach(function(d) {
    // d.outerRadius = Math.sqrt(d.unitTotalValue * outerRadiusFactor / Math.PI);
    d.outerRadius = Math.sqrt(d.employees * outerRadiusFactor / Math.PI);
  });

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

  maxAmount = d3.max(mainUnits.map(function(v) {
    return d3.max(v.approvers, function(approver) {
      return d3.max(approver.approvalTypes, function(approvalType) {
        return d3.max(approvalType.approvals, function(approval) {
          return approval.value;
        })
      })
    })
  }));

  minAmount = d3.min(mainUnits.map(function(v) {
    return d3.min(v.approvers, function(approver) {
      return d3.min(approver.approvalTypes, function(approvalType) {
        return d3.min(approvalType.approvals, function(approval) {
          return approval.value;
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

  if (freshDataLoaded) {
    console.log("max approver value " + maxValue);

    drawMenu({
      totalValueMin: 0,
      totalValueMax: maxValue,
      waitTimeMin: minWait,
      waitTimeMax: maxWait,
      amountMin: minAmount,
      amountMax: maxAmount,
      approvalTypes: approvalTypeLabels
    });

    freshDataLoaded = false;

  }

  d3.select("svg").remove();

  svg = d3.select(".svg-container").append("svg")
    .attr("width", width)
    .attr("height", height)
    .on("click", function() {
      console.log("svg-container clicked");
      d3.event.stopPropagation();

      if (closeOpenFlowers()) {
        simulation.stop();
        window.dispatchEvent(new CustomEvent("drawOverviewByCriteria", { detail: { }}));
      }
    });

  mainGroup = svg.append("svg:g")
    .attr("transform", "translate(" + (width / 2) + "," + (height / 2) + ")")
    .attr("class","main-group");

  const forceX = d3.forceX(width / 2).strength(0.015);
  const forceY = d3.forceY(height / 2).strength(0.015);

  if (mainUnits.length <= 0) {
    mainGroup
      .append("text")
      .attr("class", "all-data-hidden")
      .attr("text-anchor", "middle")
      .text("No data match your criteria");
    return;
  }

  // console.log("simulation forceSimulation with mainUnits")
  // reference: https://d3indepth.com/force-layout/
  var simulation = d3.forceSimulation(mainUnits)
    .alphaDecay(0.03)
    .velocityDecay(0.2)
    // .force('charge', d3.forceManyBody().strength(800))
    .force("x", forceX)
    .force("y", forceY)
    .force('collision', d3.forceCollide().radius(function(d, index) {
      // console.log("index " + index + " radius " + (d.selected ? blownUpRadius : outerRadius) + " " + d.unitLabel);
      return (d.selected ? blownUpRadius : d.outerRadius) + 10; // d.radius
    }))
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
    .data(mainUnits.filter(function(d) {
      return !d.hidden
    }), function(d) {return d.unitLabel});

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
    })
    .call(d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended));

  function dragstarted(d) {
    // release all other nodes
    mainUnits.forEach(function(unit) {
      delete unit.fx;
      delete unit.fy;
    });

    d3.select(this).classed("active", true);
    if (!d3.event.active) runSimulation(0.3); // simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;

  }

  function dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  }

  function dragended(d) {
    d3.select(this).classed("active", false);
    // these lines commented out to fix node
    if (!d3.event.active) runSimulation(0); // simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }

  unitGroups
    .append("circle")
    .attr("r", function(d) {return d.outerRadius})
    .attr("class", "closed-sphere-background");

  unitGroupsBase.exit().remove();

  // draw unit identity marker

  function estimateAngleGapForText(radius, text) {
    return text.length * 8 / (radius); // gap in radians
  }

  // outer identity marker (which department and employee count)

  unitGroups // might need to change class name
    .append("svg:path")
    .attr("class", "identity circular-marker")
    .attr("fill", "transparent")
    .attr("stroke-width", function(d) {
      return 1;
    })
    .attr("stroke-linejoin", "round")
    .attr("d", function(d) {return arcSliceFull({
      radius: d.outerRadius - identityMargin,
      from: 0,
      to: 2*Math.PI
    });});

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
      var gap = estimateAngleGapForText(d.outerRadius - identityMargin, d.unitLabel);
      return arcSliceFull({
        radius: d.outerRadius - identityMargin,
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
      return d.unitLabel;
    });

  function approverBubbleRadiusGenerator(d) {
    return d3.scaleLinear()
      .domain([0, maxValue])
      .range([0, maxApproverBubbleRatio * d.outerRadius]);
  }

  unitGroups.each(function(d) {

    var approvers = d.approvers.filter(function(approver) {return !approver.hidden});
    var staticSimulation = d3.forceSimulation(approvers)
      .velocityDecay(0.1)
      .force("x", d3.forceX(0).strength(.05))
      .force("y", d3.forceY(0).strength(.05))
      .force("charge", d3.forceManyBody().strength(-300))
      .stop();

    for (var i = 0, n = Math.ceil(Math.log(staticSimulation.alphaMin()) / Math.log(1 - staticSimulation.alphaDecay())); i < n; ++i) {
      staticSimulation.tick();
    }

    // make sure all approvers are in unit circle (outerRadius - identityMargin)
    var radius = d.outerRadius - identityMargin - 5;
    var approverBubbleRadius = approverBubbleRadiusGenerator(d);

    for (var j = 0; j<approvers.length; j++) {
      var approver = approvers[j];
      var approverRadius = Math.max(approverBubbleRadius(approvers[j].approverTotalValue), minApproverBubbleRatio * d.outerRadius);
      var sqrSum = (Math.pow((approver.x), 2) + Math.pow((approver.y), 2));
      var sqrSumLimit = Math.pow(radius-approverRadius,2);
      if (sqrSum > sqrSumLimit) {
        var ratio = (radius-approverRadius) / (Math.sqrt(sqrSum) || 1);
        approver.x = approver.x * ratio;
        approver.y = approver.y * ratio;
      }
    }

  });

  // add approver bubbles inside units

  var approverGroups = unitGroups
    .selectAll("g.approver-group")
    .data(function(d) {
      return d.approvers.filter(function(approver) {return !approver.hidden});
    })
    .enter()
    .append("svg:g")
    .attr("class", "approver-group")
    .attr("transform", function (d, index) {
      return "translate(" + d.x + "," + d.y + ")";
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
      var parentData = d3.select(this.parentNode.parentNode).datum();
      return Math.max(approverBubbleRadiusGenerator(parentData)(d.approverTotalValue), minApproverBubbleRatio * parentData.outerRadius);
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
    var any = d3.selectAll(".main-units.selected .detailed-group").nodes().length;
    if (any) {
      d3.selectAll(".main-units.selected .detailed-group").remove();
      d3.select(".main-units.selected").on('mousedown.drag', null);
      d3.selectAll(".main-units").classed("selected", false).each(function(d) {
        if (d.selected) {
          d.approvers.forEach(function(approver) {
            approver.selected = false;
          })
        }
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
    console.log("handleClick");

    // first close all open flowers
    closeOpenFlowers();

    d3.select(this.parentNode.parentNode).classed("selected", true);
    var parentData = d3.select(this.parentNode.parentNode).datum();
    parentData.selected = true; // department marked as selected
    d.selected = true; // approver marked as selected
    simulation.stop();
    window.dispatchEvent(new CustomEvent("drawOverviewByCriteria", { detail : {} }));

  }

  function runSimulation(alphaTarget) {
    alphaTarget = alphaTarget != null ? alphaTarget : 0.3;
    simulation
      .nodes(mainUnits)
      .alphaTarget(alphaTarget).restart();
  }

  return {stopSimulation: simulation.stop, runSimulation: runSimulation};
}
