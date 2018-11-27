(function() {
  var MIN_PADDING, data, en_nodes, height, nodes, simulation, svg, width;

  svg = d3.select('svg');

  width = svg.node().getBoundingClientRect().width;

  height = svg.node().getBoundingClientRect().height;

  MIN_PADDING = 3;

  data = [
    {
      r: 5
    }, {
      r: 10
    }, {
      r: 20
    }, {
      r: 30
    }, {
      r: 30
    }, {
      r: 10
    }, {
      r: 20
    }, {
      r: 30
    }, {
      r: 60
    }, {
      r: 10
    }, {
      r: 20
    }, {
      r: 30
    }, {
      r: 30
    }, {
      r: 50
    }
  ];

  simulation = d3.forceSimulation()
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('charge', d3.forceManyBody().strength(100))
    .force('collision', d3.forceCollide(function(d) {
      return d.r + MIN_PADDING + (d.active ? 20 : 0);
    }));

  nodes = svg.selectAll('.node').data(data);

  en_nodes = nodes.enter().append('svg:g').attrs({
    "class": 'node',
  });

  en_nodes.append('circle').attrs({
    "class": 'circle',
    r: function(d) {
      return d.r;
    }
  });

  simulation.nodes(data).on('tick', function() {
    return en_nodes.attrs({
      transform: function(d) {
        return "translate(" + d.x + ", " + d.y + ")";
      }
    });
  });

  en_nodes
    .on("mouseenter", function() {
      d3.select(this).datum().active = true;
      simulation.nodes(data).alphaTarget(0.3).restart();
    })
    .on("mouseleave", function() {
      d3.select(this).datum().active = false;
      simulation.nodes(data).alphaTarget(0.3).restart();
    })
    .call(d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended));

  function dragstarted(d) {
    d3.select(this).raise().classed("active", true);
    if (!d3.event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(d) {
    // console.log("d3.event " + d3.event.x + " " + d3.event.dx + " " + d3.event.sourceEvent.pageX);
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  }

  function dragended(d) {
    d3.select(this).classed("active", false);
    // var translated = getTranslation(d3.select(this).attr("transform"));
    // suppose to fixate this node
    if (!d3.event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }



}).call(this);