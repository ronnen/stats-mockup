
function drawMenu(criteria) {
  // criteria {totalValueMin, totalValueMax, waitTimeMin, waitTimeMax}

  var totalValueMin = criteria.totalValueMin || 0, totalValueMax = criteria.totalValueMax || 100000000;
  var waitTimeMin = criteria.waitTimeMin || 0, waitTimeMax = criteria.waitTimeMax || 100000000;

  d3.select("#total-value-filter .label-left").text("$ " + valueToText(totalValueMin));
  d3.select("#total-value-filter .label-right").text("$ " + valueToText(totalValueMax));
  d3.select("#wait-time-filter .label-left").text(waitToText(waitTimeMin));
  d3.select("#wait-time-filter .label-right").text(waitToText(waitTimeMax));

  function switchClick() {
    var currentValueRange = valueSlider.range();
    var currentWaitRange = waitSlider.range();
    drawOverview(filterDataByCriteria(mainUnits, {
      totalValueMin: valueFilterState ? currentValueRange.begin : null,
      totalValueMax: valueFilterState ? currentValueRange.end : null,
      waitTimeMin: waitFilterState ? currentWaitRange.begin : null,
      waitTimeMax: waitFilterState ? currentWaitRange.end : null,
    }));
  }

  // Total Value filter
  var valueFilterState = true;

  d3.select("#total-value-filter .switch-container")
    .on("click", valueSliderClick);

  function valueSliderClick() {
    d3.select("#total-value-filter").classed("on", !valueFilterState);
    valueFilterState = !valueFilterState;
    switchClick();
  }

  var valueSlider = createD3RangeSlider(totalValueMin, totalValueMax, "#total-value-filter .stats-slider", false);

  valueSlider.onChange(function(newRange){
    // d3.select("#range-label").html(newRange.begin + " &mdash; " + newRange.end);
  });

  valueSlider.onRelease(function(newRange){
    // d3.select("#range-label").html(newRange.begin + " &mdash; " + newRange.end);
    // console.log("value range changed " + newRange.begin + " " + newRange.end);

    totalValueMin = newRange.begin;
    totalValueMax = newRange.end;
    drawOverview(filterDataByCriteria(mainUnits, {
      totalValueMin: totalValueMin,
      totalValueMax: totalValueMax,
      waitTimeMin: waitFilterState ? waitTimeMin : null,
      waitTimeMax: waitFilterState ? waitTimeMax : null,
    }));
  });

  valueSlider.range(totalValueMin,totalValueMax);

  // Total Value filter
  var waitFilterState = true;

  d3.select("#wait-time-filter .switch-container")
    .on("click", waitSliderClick);

  function waitSliderClick() {
    d3.select("#wait-time-filter").classed("on", !waitFilterState);
    waitFilterState = !waitFilterState;
    switchClick();
  }

  var waitSlider = createD3RangeSlider(waitTimeMin, waitTimeMax, "#wait-time-filter .stats-slider", false);

  /*
   slider.onChange(function(newRange){
   d3.select("#range-label").html(newRange.begin + " &mdash; " + newRange.end);
   });
   */
  waitSlider.onRelease(function(newRange){
    waitTimeMin = newRange.begin;
    waitTimeMax = newRange.end;
    drawOverview(filterDataByCriteria(mainUnits, {
      totalValueMin: valueFilterState ? totalValueMin : null,
      totalValueMax: valueFilterState ? totalValueMax : null,
      waitTimeMin: waitTimeMin,
      waitTimeMax: waitTimeMax,
    }));
  });

  waitSlider.range(waitTimeMin,waitTimeMax);

}