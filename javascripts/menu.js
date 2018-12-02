var legendToggle = false;
var tableToggleState = false;
var drawOverviewListener;

function drawMenu(criteria) {
  drawTable(); // to be moved to a menu option
  // criteria {totalValueMin, totalValueMax, waitTimeMin, waitTimeMax, amountMin, amountMax, approvalTypes}

  var timeRangeMin = criteria.timeRangeMin || 0, timeRangeMax = criteria.timeRangeMax || 100;
  var totalValueMin = criteria.totalValueMin || 0, totalValueMax = criteria.totalValueMax || 100000000;
  var waitTimeMin = criteria.waitTimeMin || 0, waitTimeMax = criteria.waitTimeMax || 100000000;
  var amountMin = criteria.amountMin || 0, amountMax = criteria.amountMax || 100000000;

  // d3.select("#total-value-filter .label-left").text("$ " + valueToText(totalValueMin));
  // d3.select("#total-value-filter .label-right").text("$ " + valueToText(totalValueMax));
  d3.select("#amount-filter .label-left").text(valueToText(amountMin));
  d3.select("#amount-filter .label-right").text(valueToText(amountMax));
  d3.select("#wait-time-filter .label-left").text(waitToText(waitTimeMin));
  d3.select("#wait-time-filter .label-right").text(waitToText(waitTimeMax));

  d3.selectAll(".stats-slider").html(null);

  var approvalSwitchContainer = d3.select("#approval-type-switches");
  approvalSwitchContainer.html(null);
  var approvalSwitchTemplate = d3.select("#type-filter-template");

  criteria.approvalTypes.forEach(function(t) {
    var addedType = approvalSwitchTemplate.clone(true);
    addedType.attr("id", null);
    addedType.attr("data-type-filter", t);
    addedType.select(".stats-filter-title").text(t);
    approvalSwitchContainer.append(function() {
      return addedType.node()
    });
  });

  // Time Range filter
  var timeFilterState = true;

  d3.select("#time-range-filter .switch-container")
    .on("click", timeSliderClick);

  function timeSliderClick() {
    d3.select("#time-range-filter").classed("on", !timeFilterState);
    timeFilterState = !timeFilterState;
    drawOverviewByCriteria();
  }

  var timeSlider = createD3RangeSlider(timeRangeMin, timeRangeMax, "#time-range-filter .stats-slider", false);

  timeSlider.onChange(function(newRange){
    // d3.select("#range-label").html(newRange.begin + " &mdash; " + newRange.end);
  });

  timeSlider.onRelease(function(newRange){
    drawOverviewByCriteria();
  });

  timeSlider.range(timeRangeMin,timeRangeMax);

  // Amount filter
  var amountFilterState = true;

  d3.select("#amount-filter .switch-container")
    .on("click", amountSliderClick);

  function amountSliderClick() {
    d3.select("#amount-filter").classed("on", !amountFilterState);
    amountFilterState = !amountFilterState;
    drawOverviewByCriteria();
  }

  var amountSlider = createD3RangeSlider(amountMin, amountMax, "#amount-filter .stats-slider", false);

  amountSlider.onChange(function(newRange){
  });

  amountSlider.onRelease(function(newRange){
    drawOverviewByCriteria();
  });

  amountSlider.range(amountMin,amountMax);

/*
  // Total Value filter
  var valueFilterState = true;

  d3.select("#total-value-filter .switch-container")
    .on("click", valueSliderClick);

  function valueSliderClick() {
    d3.select("#total-value-filter").classed("on", !valueFilterState);
    valueFilterState = !valueFilterState;
    drawOverviewByCriteria();
  }

  var valueSlider = createD3RangeSlider(totalValueMin, totalValueMax, "#total-value-filter .stats-slider", false);

  valueSlider.onChange(function(newRange){
    // d3.select("#range-label").html(newRange.begin + " &mdash; " + newRange.end);
  });

  valueSlider.onRelease(function(newRange){
    drawOverviewByCriteria();
  });

  valueSlider.range(totalValueMin,totalValueMax);
*/

  // Wait Time filter
  var waitFilterState = true;

  d3.select("#wait-time-filter .switch-container")
    .on("click", waitSliderClick);

  function waitSliderClick() {
    d3.select("#wait-time-filter").classed("on", !waitFilterState);
    waitFilterState = !waitFilterState;
    drawOverviewByCriteria();
  }

  var waitSlider = createD3RangeSlider(waitTimeMin, waitTimeMax, "#wait-time-filter .stats-slider", false);

  waitSlider.onRelease(function(newRange){
    drawOverviewByCriteria();
  });

  waitSlider.range(waitTimeMin,waitTimeMax);


  // approval type filters
  d3.selectAll("#approval-type-switches .switch-container")
    .on("click", approvalTypeClick);

  function approvalTypeClick() {
    var currentState = d3.select(this.parentElement).classed("on");
    d3.select(this.parentElement).classed("on", !currentState);
    drawOverviewByCriteria();
  }

  function drawOverviewByCriteriaHandler(event) {
    drawOverviewByCriteria();
  }

  // Table Toggle

  d3.select("#table-toggle-container .switch-container")
    .on("click", tableToggleClick);

  function tableToggleClick() {
    d3.select("#table-toggle-container .table-toggle").classed("on", !tableToggleState);
    d3.select(".table-container").classed("on", !tableToggleState);
    tableToggleState = !tableToggleState;
    if (tableToggleState) {
      if (d3.select(".main-units.selected").size() > 0) {
        var selectedUnit = d3.select(".main-units.selected").datum();
        var selectedApprover = selectedUnit.approvers.find(function(approver) {return approver.selected});
        refreshTable(getApproverVisibleApprovals(selectedApprover));
      }
      else {
        refreshTable(getAllVisibleApprovals());
      }
    }

  }

  if (drawOverviewListener) window.removeEventListener("drawOverviewByCriteria" , drawOverviewListener);
  drawOverviewListener = drawOverviewByCriteriaHandler;
  window.addEventListener("drawOverviewByCriteria", drawOverviewListener);

  function drawOverviewByCriteria() {
    // either refreshes the whole svg based on current criteria. or
    // refreshes just the open flower (selected unit) from criteria applied to a fresh copy of unit
    var currentTimeRange = timeSlider.range();
    // var currentValueRange = valueSlider.range();
    var currentAmountRange = amountSlider.range();
    var currentWaitRange = waitSlider.range();

    var typesFilter = [];
    d3.selectAll("#approval-type-switches .type-filter")
      .each(function(d) {
        if (d3.select(this).classed("on")) typesFilter.push(d3.select(this).attr("data-type-filter"));
      });

    var criteria = {
      timeRangeMin: timeFilterState ? currentTimeRange.begin : null,
      timeRangeMax: timeFilterState ? currentTimeRange.end : null,
      // totalValueMin: valueFilterState ? currentValueRange.begin : null,
      // totalValueMax: valueFilterState ? currentValueRange.end : null,
      amountMin: amountFilterState ? currentAmountRange.begin : null,
      amountMax: amountFilterState ? currentAmountRange.end : null,
      waitTimeMin: waitFilterState ? currentWaitRange.begin : null,
      waitTimeMax: waitFilterState ? currentWaitRange.end : null,

      typesFilter: typesFilter
    };

    filterDataByCriteria(criteria);

    // if one flower is open then update only its content
    if (d3.select(".main-units.selected").size() > 0) {
      var selectedUnit = d3.select(".main-units.selected").datum();
      var selectedApprover = selectedUnit.approvers.find(function(approver) {return approver.selected});

      // use selectedUnit.department as key to get original data from mainUnits
      // selectedUnit = mainUnits.find(function(unit) {return unit.department == selectedUnit.department});
      // selectedApprover = selectedUnit.approvers.find(function(approver) {return approver.approverName == selectedApprover.approverName});

      // filteredData = filterApproverDataByCriteria(selectedApprover, criteria);
      selectedApprover.selected = true;

      var drawOverviewParams = drawOverview(mainUnits);
      var unitGroup = d3.select(".main-units.selected");
      if (unitGroup.size() > 0) {
        drawDetailedView(selectedApprover, unitGroup.datum(), unitGroup.nodes()[0], drawOverviewParams);
      }

      if (tableToggleState) {
        refreshTable(getApproverVisibleApprovals(selectedApprover));
      }

    }
    else {
      // update the whole thing
      mainUnits.forEach(function(unit) {
        delete unit.fx;
        delete unit.fy;
      });

      drawOverview(mainUnits);

      if (tableToggleState) {
        refreshTable(getAllVisibleApprovals());
      }
    }

  }

  d3.select(".legend-button")
    .on("click", legendClickEvent);

  function legendClickEvent(event) {
    const identityMargin = 20;

    d3.event.preventDefault();
    d3.event.stopPropagation();
    var selectedUnit = d3.select(".main-units.selected").size() ? d3.select(".main-units.selected") : d3.select(".main-units");
    var circle = selectedUnit.select(".detailed-group circle").size() ? selectedUnit.select(".detailed-group circle") : selectedUnit.select(".closed-sphere-background");
    if (circle.size() <= 0) return;
    var outerRadius = parseFloat(circle.attr("r"));

    var arcLegendCircle = d3.arc()
      .startAngle(0)
      .endAngle(toRadians(330))
      .innerRadius(outerRadius - identityMargin)
      .outerRadius(outerRadius - identityMargin);

    var svg = d3.select("svg");

    console.log("show or hide legend " + legendToggle);

    if (!legendToggle) {
      d3.selectAll('.dark-legend').remove(); // just to make sure

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

      // by now the transform of the detailed sphere has change due to forceSimulation so
      // need to sample it again.
      var rect = selectedUnit.node().getBoundingClientRect();

      var legendGroup = darkScreen
        .append("svg:g")
        .attr("class", "legend-group")
        .attr("transform", "translate(" + (rect.x + rect.width/2) + "," + (rect.y + rect.height/2) + ")");

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
        .style("left", (rect.x + rect.width/2) + "px")
        .style("top", (rect.y + rect.height/2) + "px");

      d3.select(window).on("click",legendClickEvent);
    }
    else {
      d3.select(window).on("click",null);
      d3.selectAll('.dark-legend').remove();
      d3.select(".mainObjectLegend")
        .style("display","none");
    }

    legendToggle = !legendToggle;

  }

  d3.select(".load-data")
    .on("click", openEditDialog);


}


