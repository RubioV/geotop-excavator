
// VolumeChart: plot volumes of lithoclasses in a horizontal bar chart.
function VolumeChart (svg, config) {
	this.svg = svg;

	if (!config) config = {};
	this.config = config;
	
	// set up dimensions and margins
	this.margin = config.margin ? config.margin : {top: 80, right: 80, bottom: 80, left: 120};
	this.width = config.width ? config.width : 640;
	this.width = this.width - this.margin.left - this.margin.right;
	this.height = config.height ? config.height : 500;
	this.height = this.height - this.margin.top - this.margin.bottom;

	// Set svg dimensions and add inner chart group
	this.chart = d3.select(svg)
			.attr("width", this.width + this.margin.left + this.margin.right)
			.attr("height", this.height + this.margin.top + this.margin.bottom)
		.append("g")
			.attr('class', 'innerChart')
			.attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");
	
	// the scale functions convert data units to screen units
	this.xScale = d3.scale.linear()
			.range([0, this.width]);
	this.yScale = d3.scale.ordinal()
			.rangeRoundBands([0, this.height], 0.2, 0.2);

	// set up the axes
	this.xAxis = d3.svg.axis()
		.scale(this.xScale)
		.tickSize(-this.height, 0)
		.ticks(2)
		.orient("bottom");	

	if (config.xLabel) {
		var xTrans = (this.margin.left + this.width) / 2;
		var yTrans = this.height + config.xLabel.dist;
		this.chart.append('g')
			.attr('transform', 'translate(' + xTrans + ', ' + yTrans + ')')
			.append('text')
			.attr('text-anchor', 'middle')
			.text(config.xLabel.label);
	}
	
	this.chart.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate(0," + this.height + ")")
		.call(this.xAxis);

	this.yAxis = d3.svg.axis()
		.scale(this.yScale)
		.orient("left");	

	this.chart.append("g")
		.attr("class", "y axis")
		.call(this.yAxis);

	if (config.yLabel) {
		xTrans = -config.yLabel.dist;
		yTrans = (this.height - this.margin.top) / 2
		this.chart.append('g')
			.attr('transform', 'translate(' + xTrans + ', ' + yTrans + ')')
			.append('text')
			.attr('text-anchor', 'middle')
			.attr('transform', 'rotate(-90)')
			.text(config.yLabel.label);
	}
	
	this.tooltip = d3.select("body").append("div")   
		.attr("class", "tooltip");

}

// VolumeChart.toolTipHTML - provide the HTML content of the tooltip
VolumeChart.prototype.toolTipHTML = function(d) {
	var html = '\x3Csvg width="18" height="18">' +
		'\x3Crect x="1" y="1" width="16" height="16" style="stroke-width:1;stroke:grey;fill: ' +
		d.color + '">\x3C/rect>\x3C/svg>\x3Ctext>\x3Cstrong>' + 
		d.name + ':&nbsp;\x3C/strong>' + d3.format(',.0f')(d.value) + " m3\x3C/text>";
	return html;
}

// VolumeChart.update - update the chart with the provided data
VolumeChart.prototype.update = function(data) {
	var xScale = this.xScale;
	var yScale = this.yScale;
	var tooltip = this.tooltip;
	var volumeChartObj = this;
	
	// adjust the scale functions to the input data
	xScale.domain([0, d3.max(data, function(d) { return d.value; })]);
	yScale.domain(data.map(function(d) { return d.name; }));
	
	var barHeight = this.height / data.length;
	var barGap = Math.round(barHeight * 0.2);
	
	// select all existing or potential rects, D3 joined to the data
	var rects = this.chart.selectAll("rect").data(data, function(d) { return d.name; } ); 
	var newRects = rects.enter(); // all new data entries
	var delRects = rects.exit(); // all deleted data entries
	
	// append svg rects for all new entries
	newRects.append('rect')
			.attr('x', xScale(0))
			.attr('y', function(d) { return yScale(d.name); } )
			.attr('width', 0) // start with width of 0 and transition to correct width below
			.attr('height', yScale.rangeBand())
			.style({ 'fill': function(d) { return d.color; } })
			.on("mousemove", function(d) {
					tooltip.transition()
						.duration(200)
						.style("opacity", 1.0);
					tooltip.html(volumeChartObj.toolTipHTML(d))
						.style("left", (d3.event.pageX) + "px")
						.style("top", (d3.event.pageY - 28) + "px");
				})
			.on("mouseout", function(d) {
					tooltip.transition()
						.duration(500)
						.style("opacity", 0);
				});
	
	// remove svg rects for data entries which were deleted
	delRects.remove();
	
	// update dimensions of rects to new values, using transition
	rects.transition()
		.duration(1000)
		.attr('y', function(d) { return yScale(d.name); } )
		.attr("width", function(d) { return xScale(d.value); })
		.attr('height', yScale.rangeBand())
		.style({ 'fill': function(d) { return d.color; } });
	
	// update chart ranges to input data ranges, using transition
	this.xAxis.scale(xScale);
	this.chart.selectAll("g.x.axis")
		.transition()
		.duration(1000)
		.call(this.xAxis);
	
	this.yAxis.scale(yScale);
	this.chart.selectAll("g.y.axis")
		.transition()
		.duration(1000)
		.call(this.yAxis);
};


/*******************************************************************************/

// DepthChart: plot depth/z on y axis versus relative probability of lithoclasses 
// on the x axis. The chart area consists of a counter clockwise rotated stacked area.
function DepthChart (svg, config) {
	this.svg = svg;

	if (!config) config = {};
	this.config = config;
	
	// set up dimensions and margins
	this.margin = {top: 80, right: 80, bottom: 80, left: 120};
	this.margin = config.margin ? config.margin : {top: 80, right: 80, bottom: 80, left: 120};
	this.width = (config.width) ? config.width : 640;
	this.width = this.width - this.margin.left - this.margin.right;
	this.height = (config.height) ? config.height : 500;
	this.height = this.height - this.margin.top - this.margin.bottom;

	// Set svg dimensions and add inner chart group
	this.chart = d3.select(svg)
			.attr("width", this.width + this.margin.left + this.margin.right)
			.attr("height", this.height + this.margin.top + this.margin.bottom)
		.append("g")
			.attr('class', 'innerChart')
			.attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");
		
	// the scale functions convert data units to screen units
	var xScale = d3.scale.linear()
			.range([0, this.width]);
	this.xScale = xScale;
	var yScale = d3.scale.linear()
			.range([0, this.height]);
	this.yScale = yScale;

	// set up the axes
	if (config.xLabel) {
		var xTrans = (this.margin.left + this.width) / 2;
		var yTrans = this.height + config.xLabel.dist;
		this.chart.append('g')
			.attr('transform', 'translate(' + xTrans + ', ' + yTrans + ')')
			.append('text')
			.attr('text-anchor', 'middle')
			.text(config.xLabel.label);
	}
	
	this.yAxis = d3.svg.axis()
		.scale(this.yScale)
		.orient("left");	

	this.chart.append("g")
		.attr("class", "y axis")
		.call(this.yAxis);

	if (config.yLabel) {
		xTrans = -config.yLabel.dist;
		yTrans = (this.height - this.margin.top) / 2
		this.chart.append('g')
			.attr('transform', 'translate(' + xTrans + ', ' + yTrans + ')')
			.append('text')
			.attr('text-anchor', 'middle')
			.attr('transform', 'rotate(-90)')
			.text(config.yLabel.label);
	}

	// Set up the stacked area
	this.area = d3.svg.area()
		.interpolate("basis")
		.y(function(d) { return yScale(d.z); })
		.x0(function(d) { return xScale(d.y0); })
		.x1(function(d) { return xScale(d.y0 + d.y); });
	
	this.stack = d3.layout.stack()
		.offset("expand")
		.values(function(d) { return d.values; })
		.x(function(d) { return d.z; })
		.y(function(d) { return d.volume; });

	this.bisectDepth = d3.bisector(function(d) { return d.z; }).left; // used for the tooltip

	this.tooltip = d3.select("body").append("div")   
		.attr("class", "tooltip");
}


// DepthChart.toolTipHTML - provide the HTML content of the tooltip
DepthChart.prototype.toolTipHTML = function(d) {
	var innerChart = d3.select('.innerChart').node();

	var chartY = d3.mouse(innerChart)[1], // get mouse position along y-axis
		yScale = this.yScale;
		zMouse = Math.max(Math.min(yScale.invert(chartY), this.upperZ), this.lowerZ); // convert mouse-y to z value (depth)
		zValues = d.values.map(function(d){ return d.z; }), // get all z values for this chart shape
		bisectDepth = d3.bisector(d3.descending).left, 
		zIndex = bisectDepth(zValues, zMouse); // get index within zValues array for the zMouse value
	
	if (zIndex > 0)
		// determine if we're closer to the left or right index within the zValues array
		zIndex = Math.abs(zMouse - zValues[zIndex - 1]) < Math.abs(zMouse - zValues[zIndex]) ? zIndex - 1 : zIndex;
	
	var html = '\x3Cstrong>Depth: ' + (zValues[zIndex]-0.25) + 'm to ' + (zValues[zIndex]+0.25) + 'm NAP\x3Cstrong><br>';
	
	// loop over all lithoclasses and add an entry to the tooltip
	for (var i = 0; i < this.data.length; i++) {
		var	name = this.data[i].name,
			color = this.data[i].color,
			perc = this.data[i].values[zIndex].y * 100;
		
		if (perc == 0.0) continue; // skip lithoclasses which have zero probability
		
		html += '\x3Csvg width="18" height="18">' +
			'\x3Crect x="1" y="1" width="16" height="16" style="stroke-width:1;stroke:grey;fill: ' +
			color + '">\x3C/rect>\x3C/svg>\x3Ctext>\x3Cstrong>' + 
			name + ':&nbsp;\x3C/strong>' + d3.format(',.2f')(perc) + '%\x3C/text><br>';
	}
	return html;
}

// DepthChart.update - update the chart with the provided data
DepthChart.prototype.update = function(data, upperZ, lowerZ) {
	this.data = data;
	
	var depthChartObj = this;
	var xScale = this.xScale;
	var yScale = this.yScale;
	var area = this.area;
	var stack = this.stack;
	var tooltip = this.tooltip;
	
	// convert input data to stacked area data
	var layers = stack(data);

	// adjust the scale function to the input data
	yScale.domain([upperZ, lowerZ]);

	// select all existing or potential paths, D3 joined to the data
	var paths = this.chart.selectAll(".layer").data(layers, function(d) { return d.name; } );
	var newPaths = paths.enter(); // all new data entries
	var delPaths = paths.exit(); // all deleted data entries
	
	// append svg paths for all new data entries
	newPaths.append("path")
			.attr("class", "layer")
			.attr("d", function(d) { return area(d.values); })
			.style("fill", function(d, i) { return d.color; })
			.on("mousemove", function(d) {
					tooltip.transition()
						.duration(200)
						.style("opacity", 1.0);
					tooltip.html(depthChartObj.toolTipHTML(d))
						.style("left", (d3.event.pageX) + "px")
						.style("top", (d3.event.pageY - 28) + "px");
				})
			.on("mouseout", function(d) {
					tooltip.transition()
						.duration(500)
						.style("opacity", 0);
				});
			
	// remove svg paths for data entries which were deleted
	delPaths.remove();
	
	if (upperZ == this.upperZ && lowerZ == this.lowerZ) {
		// if depth range didn't change, animate paths change
		paths.transition()
			.duration(1000)
			.attr("d", function(d) { return area(d.values); })
			.style("fill", function(d, i) { return d.color; });
	} else {
		// if depth range did change, don't animate paths themselves (ugly)
		// instead, have entire paths transition in from the right
		paths.attr('transform', 'translate(' + 1.5 * this.width + ', 0)')
			.attr("d", function(d) { return area(d.values); })
			.style("fill", function(d, i) { return d.color; });
		paths.transition()
			.duration(500)
			.ease("exp-out")
			.delay(function(d, i) { return i * 100; })
			.each(function() {
				d3.selectAll(".layer").transition()
					.attr('transform', 'translate(0, 0)');
				});
	}

	this.upperZ = upperZ;
	this.lowerZ = lowerZ;
	
	// animate any chage of the depth axis
	this.yAxis.scale(yScale);
	this.chart.selectAll("g.y.axis")
		.transition()
		.duration(1000)
		.call(this.yAxis);

};