var width = 700,
    height = 700;

// the scales are declared out here as "globals" so that
// we can access them in handleHeatMapMouseMove
var xScale = null,
    yScale = null;
    
    
function handleHeatMapMouseMove(event) {
    var rect = $("#heatmapcanvas")[0].getBoundingClientRect();
    var xx = xScale.invert(event.clientX - rect.left);
    var yy = yScale.invert(event.clientY - rect.top);
    
    $.getJSON('/xy', {x:xx, y: yy}, function(ret) {
        var numAtoms = ret.x.length;
        for (var i = 0; i < numAtoms; i++) {
            glmol.atoms[i+1].x = ret.x[i];
            glmol.atoms[i+1].y = ret.y[i];
            glmol.atoms[i+1].z = ret.z[i];
        }
        glmol.rebuildScene(true);
        glmol.show();
    })
    .done(function() {
        // only let this callback get called once every "lag" miliseconds
        // to avoid taking the GPU too much
        var lag = 200;
        setTimeout(function() {
            $("#heatmapsvg").one('mousemove', handleHeatMapMouseMove);
        }, lag);
    });
}

var createHeatmap = function(data) {
    var heatmap = data.heatmap,
        extent = data.extent;
    var dx = heatmap[0].length,
        dy = heatmap.length;

  $("#heatmapContainer").width(width).height(height);

  xScale = d3.scale.linear()
      .domain([extent.xmin, extent.xmax])
      .range([0, width]);

  yScale = d3.scale.linear()
      .domain([extent.ymin, data.extent.ymax])
      .range([height, 0]);

  var color = d3.scale.linear()
      .domain([0, data.vmax/20.0])
      .range(colorbrewer.RdBu[9]);

  var xAxis = d3.svg.axis()
      .scale(xScale)
      .orient("top")
      .ticks(10);

  var yAxis = d3.svg.axis()
      .scale(yScale)
      .orient("right")
      .ticks(10);

  $("#heatmapsvg").one('mousemove', handleHeatMapMouseMove);
      
  var svg = d3.select("#heatmapsvg")
      .attr("width", width)
      .attr("height", height);

  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

  svg.append("g")
      .attr("class", "y axis")
      .call(yAxis);

  d3.select("#heatmapcanvas")
      .attr("width", dx)
      .attr("height", dy)
      .style("width", width + "px")
      .style("height", height + "px")
      .call(drawImage);

  // Compute the pixel colors; scaled by CSS.
  function drawImage(canvas) {
    var context = canvas.node().getContext("2d"),
        image = context.createImageData(dx, dy);

    for (var y = 0, p = -1; y < dy; ++y) {
      for (var x = 0; x < dx; ++x) {
        var c = d3.rgb(color(heatmap[y][x]));
        image.data[++p] = c.r;
        image.data[++p] = c.g;
        image.data[++p] = c.b;
        image.data[++p] = 255;
      }
    }

    context.putImageData(image, 0, 0);
  }
};