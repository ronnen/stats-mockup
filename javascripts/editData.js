
function openEditDialog() {
  d3.select(".shield").classed("on", true);
  d3.select(".loadDataDialog").classed("on", true);

  var editor = ace.edit("editor", {
    mode: "ace/mode/json",
    selectionStyle: "text"
  });
  editor.setTheme("ace/theme/monokai");
  editor.setValue(JSON.stringify(mainUnits, function(name, val) {
    if (typeof val == "object") {
      // Array.isArray(val) to check if it's an arry
      return val;
    }
    else {
      return ([
        "unitTotalValue",
        "unitLabel",
        "approverTotalValue",
        "outerRadius",
        "x","y","vx","vy",
        "index",
        "hidden",
        "selected",
        "flipText"
      ].indexOf(name) >= 0) ? undefined : val;
    }
  }, '\t'));
  editor.selection.clearSelection();
  editor.moveCursorTo(0,0);
  editor.focus();

  d3.select(".cancel-edit").on("click", function() {
    d3.select(".shield").classed("on", false);
    d3.select(".loadDataDialog").classed("on", false);
  });

  d3.select(".load-edit").on("click", function() {
    var newDataStr = editor.getValue();

    try {
      var parsedData = JSON.parse(newDataStr);
      mainUnits = parsedData;
      freshDataLoaded = true;

      d3.select(".shield").classed("on", false);
      d3.select(".loadDataDialog").classed("on", false);

      drawOverview(mainUnits);
    }
    catch(err) {
      console.log("illegal json provided..." + err);
      alert("Please provide a valid JSON object");
    }
  });
}

