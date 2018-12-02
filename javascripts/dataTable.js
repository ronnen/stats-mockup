function drawTable() {
  d3.select(".table-resize")
    .call(d3.drag()
      .on("drag", dragged));

  function dragged(d) {
    console.log(d3.event.dx + " " + d3.event.dy + " " + d3.event.x + " " + d3.event.y);
    var tableContainerNode = this.parentNode;
    var beforeHeight = tableContainerNode.getBoundingClientRect().height;
    var afterHeight = beforeHeight - d3.event.y;

    d3.select(tableContainerNode).style('height',afterHeight + "px");
  }
}

function refreshTable(approvals) {
  var tableRows = d3.select(".table-rows");

  tableRows.html(null);

  var dataRows = tableRows.selectAll(".data-row")
    .data(approvals)
    .enter()
    .append("div")
    .attr("class", "data-row");

  dataRows
    .append("div")
    .attr("class", "submitter")
    .text(function(d) {return d.submitter});
  dataRows
    .append("div")
    .attr("class", "value")
    .text(function(d) {return valueToText(d.value)});
  dataRows
    .append("div")
    .attr("class", "table-wait-time")
    .text(function(d) {return waitToText(d.waitTime)});

  var captionRow = tableRows.insert("div", "div")
    .attr("class", "data-row");
  captionRow
    .append("div")
    .attr("class", "submitter caption")
    .text("Submitted by");
  captionRow
    .append("div")
    .attr("class", "value caption")
    .text("Amount requested");
  captionRow
    .append("div")
    .attr("class", "table-wait-time caption")
    .text("Pending since");

}