
function drawMenu(criteria) {
  // criteria {totalValueMin, totalValueMax, waitTimeMin, waitTimeMax, approvalTypes}

  var timeRangeMin = criteria.timeRangeMin || 0, timeRangeMax = criteria.timeRangeMax || 100;
  var totalValueMin = criteria.totalValueMin || 0, totalValueMax = criteria.totalValueMax || 100000000;
  var waitTimeMin = criteria.waitTimeMin || 0, waitTimeMax = criteria.waitTimeMax || 100000000;

  d3.select("#total-value-filter .label-left").text("$ " + valueToText(totalValueMin));
  d3.select("#total-value-filter .label-right").text("$ " + valueToText(totalValueMax));
  d3.select("#wait-time-filter .label-left").text(waitToText(waitTimeMin));
  d3.select("#wait-time-filter .label-right").text(waitToText(waitTimeMax));

  var approvalSwitchTemplate = d3.select("#approval-type-switches .type-filter");

  criteria.approvalTypes.forEach(function(t) {
    var addedType = approvalSwitchTemplate.clone(true);
    addedType.attr("data-type-filter", t);
    addedType.select(".stats-filter-title").text(t);
  });

  approvalSwitchTemplate.remove();

  function drawOverviewByCriteria() {
    var currentTimeRange = valueSlider.range();
    var currentValueRange = valueSlider.range();
    var currentWaitRange = waitSlider.range();

    var typesFilter = [];
    d3.selectAll("#approval-type-switches .type-filter")
      .each(function(d) {
        if (d3.select(this).classed("on")) typesFilter.push(d3.select(this).attr("data-type-filter"));
      });

    mainUnits.forEach(function(unit) {
      delete unit.fixed;
      delete unit.fx;
      delete unit.fy;
    });

    drawOverview(filterDataByCriteria(mainUnits, {
      timeRangeMin: timeFilterState ? currentTimeRange.begin : null,
      timeRangeMax: timeFilterState ? currentTimeRange.end : null,
      totalValueMin: valueFilterState ? currentValueRange.begin : null,
      totalValueMax: valueFilterState ? currentValueRange.end : null,
      waitTimeMin: waitFilterState ? currentWaitRange.begin : null,
      waitTimeMax: waitFilterState ? currentWaitRange.end : null,

      typesFilter: typesFilter,
    }));
  }

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

  // Total Value filter
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



}