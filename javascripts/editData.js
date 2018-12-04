
function openEditDialog() {
  function flattenJSON(units) {
    var result =
      "# Enter CSV data with the following structure to replace the current view\n" +
      "department,approver,type,submitter,value,waitTime\n";
    units.forEach(function(unit) {
      unit.approvers.forEach(function(approver) {
        approver.approvalTypes.forEach(function(approvalType) {
          approvalType.approvals.forEach(function(approval) {
            result +=
              unit.department + "," +
              "\"" + approver.approverName + "\"," +
              approvalType.label + "," +
              "\"" + approval.submitter + "\"," +
              approval.value + "," +
              approval.waitTime + "\n";
          });
        });
      });
    });

    return result;
  }

  d3.select(".shield").classed("on", true);
  d3.select(".loadDataDialog").classed("on", true);

  var editor = ace.edit("editor", {
    mode: "ace/mode/text",
    selectionStyle: "text"
  });
  editor.setTheme("ace/theme/monokai");
  var csv = flattenJSON(mainUnits);
  editor.setValue(csv);
  editor.selection.clearSelection();
  editor.moveCursorTo(0,0);
  editor.focus();

  d3.select(".cancel-edit").on("click", function() {
    d3.select(".shield").classed("on", false);
    d3.select(".loadDataDialog").classed("on", false);
  });

  d3.select(".load-edit").on("click", function() {
    var csvString = editor.getValue();

    try {
      var results = Papa.parse(csvString, {
        header: true,
        delimiter: ",",
        comments: true,
        skipEmptyLines: true
      });

      if (results.errors.length) {
        alert("following error(s) where encountered: \n" + results.errors.map(function(e) {return e.message}).join("\n"));
        return;
      }

      var units = {};
      results.data.forEach(function(row) {
        var department = units[row.department] = units[row.department] || {};
        var approvers = department.approvers = department.approvers || {};
        var approver = approvers[row.approver] = approvers[row.approver] || {};
        var approvalType = approver[row.type] = approver[row.type] || {};
        var approvals = approvalType.approvals = approvalType.approvals || [];
        approvals.push({
          submitter: row.submitter,
          value: parseFloat(row.value),
          waitTime: parseFloat(row.waitTime)
        });
      });

      var result = [];

      Object.keys(units).forEach(function(unit) {
        var obj = {
          department: unit,
          employees: 40,
          approvers: []
        };
        var submitters = {}; // only way to get department size
        Object.keys(units[unit].approvers).forEach(function(approver) {
          var objApprover = {
            approverName: approver,
            approvalTypes: []
          };
          Object.keys(units[unit].approvers[approver]).forEach(function(approvalType) {
            units[unit].approvers[approver][approvalType].approvals.forEach(function(approval) {
              submitters[approval.submitter] = true;
            });
            objApprover.approvalTypes.push({
              label: approvalType,
              approvals: units[unit].approvers[approver][approvalType].approvals
            });
          });
          obj.approvers.push(objApprover);
        });
        obj.employees = Object.keys(submitters).length;
        result.push(obj);
      });

      freshDataLoaded = true;
      mainUnits = result;

      d3.select(".shield").classed("on", false);
      d3.select(".loadDataDialog").classed("on", false);

      drawOverview(mainUnits);
    }
    catch(err) {
      console.log("illegal json provided..." + err);
      alert("Please provide a valid JSON object");
    }
  });

  d3.select(".view-json").on("click", function() {
    editor.session.setMode("ace/mode/json");
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
          "average",
          "selected",
          "flipText"
        ].indexOf(name) >= 0) ? undefined : val;
      }
    }, '\t'));
    editor.setReadOnly(true);
    editor.selection.clearSelection();
    editor.moveCursorTo(0,0);
    editor.focus();
  });
}

