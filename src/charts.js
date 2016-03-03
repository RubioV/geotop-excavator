
function VolumeChart (svg, config) {
	this.svg = svg;
	if (!config) config = {};
	this.config = config;
	
	this.margin = config.margin ? config.margin : {top: 80, right: 80, bottom: 80, left: 120};
	
	this.width = config.width ? config.width : 640;
	this.width = this.width - this.margin.left - this.margin.right;
	this.height = config.height ? config.height : 500;
	this.height = this.height - this.margin.top - this.margin.bottom;

	this.chart = d3.select(svg)
			.attr("width", this.width + this.margin.left + this.margin.right)
			.attr("height", this.height + this.margin.top + this.margin.bottom)
		.append("g")
			.attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");
		
	this.xScale = d3.scale.linear()
			.range([0, this.width]);

	this.yScale = d3.scale.ordinal()
			.rangeRoundBands([0, this.height], 0.2, 0.2);

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

VolumeChart.prototype.toolTipHTML = function(d) {
	var html = '\x3Csvg width="18" height="18">' +
		'\x3Crect x="1" y="1" width="16" height="16" style="stroke-width:1;stroke:grey;fill: ' +
		d.color + '">\x3C/rect>\x3C/svg>\x3Ctext>\x3Cstrong>' + 
		d.name + ':&nbsp;\x3C/strong>' + d3.format(',.0f')(d.value) + " m3\x3C/text>";
	return html;
}

VolumeChart.prototype.update = function(data) {
	var xScale = this.xScale;
	var yScale = this.yScale;
	var tooltip = this.tooltip;
	var volumeChartObj = this;
	
	xScale.domain([0, d3.max(data, function(d) { return d.value; })]);
	yScale.domain(data.map(function(d) { return d.name; }));
	
	var barHeight = this.height / data.length;
	var barGap = Math.round(barHeight * 0.2);
	
	var rects = this.chart.selectAll("rect").data(data, function(d) { return d.name; } );
	var newRects = rects.enter();
	var delRects = rects.exit();
	
	newRects.append('rect')
			.attr('x', xScale(0))
			.attr('y', function(d) { return yScale(d.name); } )
			.attr('width', 0)
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
	
	delRects.remove();
		
	rects.transition()
		.duration(1000)
		.attr('y', function(d) { return yScale(d.name); } )
		.attr("width", function(d) { return xScale(d.value); })
		.attr('height', yScale.rangeBand())
		.style({ 'fill': function(d) { return d.color; } });
	
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

function DepthChart (svg, config) {
	this.svg = svg;
	if (!config) config = {};
	this.config = config;
	
	this.margin = {top: 80, right: 80, bottom: 80, left: 120};
	if (config && config.margin)
		this.margin = config.margin;
	
	this.width = (config.width) ? config.width : 640;
	this.width = this.width - this.margin.left - this.margin.right;
	this.height = (config.height) ? config.height : 500;
	this.height = this.height - this.margin.top - this.margin.bottom;

	this.chart = d3.select(svg)
			.attr("width", this.width + this.margin.left + this.margin.right)
			.attr("height", this.height + this.margin.top + this.margin.bottom)
		.append("g")
			.attr('class', 'innerChart')
			.attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");
		
	var xScale = d3.scale.linear()
			.range([0, this.width]);
	this.xScale = xScale;
	
	var yScale = d3.scale.linear()
			.range([0, this.height]);
	this.yScale = yScale;

	/*this.xAxis = d3.svg.axis()
		.scale(this.xScale)
		.tickSize(-this.height, 0)
		.ticks(4)
		.orient("bottom");	
	*/

	if (config.xLabel) {
		var xTrans = (this.margin.left + this.width) / 2;
		var yTrans = this.height + config.xLabel.dist;
		this.chart.append('g')
			.attr('transform', 'translate(' + xTrans + ', ' + yTrans + ')')
			.append('text')
			.attr('text-anchor', 'middle')
			.text(config.xLabel.label);
	}
	
	/*this.chart.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate(0," + this.height + ")")
		.call(this.xAxis);
	*/
	
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

	this.nest = d3.nest()
		.key(function(d) { return d.name; });
		
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

	this.tooltip = d3.select("body").append("div")   
		.attr("class", "tooltip");
		
	/*xScale.domain([0, 1]);
	this.xAxis.scale(xScale);
	this.chart.selectAll("g.x.axis")
		.call(this.xAxis);
	*/	
	this.bisectDepth = d3.bisector(function(d) { return d.z; }).left;
}


DepthChart.prototype.toolTipHTML = function(d) {
	var innerChart = d3.select('.innerChart').node();

	var chartY = d3.mouse(innerChart)[1],
		yScale = this.yScale;
		zMouse = Math.max(Math.min(yScale.invert(chartY), this.upperZ), this.lowerZ);
		zValues = d.values.map(function(d){ return d.z; }),
		bisectDepth = d3.bisector(d3.descending).left,
		zIndex = bisectDepth(zValues, zMouse);
	
	if (zIndex > 0)
		zIndex = Math.abs(zMouse - zValues[zIndex - 1]) < Math.abs(zMouse - zValues[zIndex]) ? zIndex - 1 : zIndex;
	
	var html = '\x3Cstrong>Depth: ' + zValues[zIndex] + 'm NAP\x3Cstrong><br>';
	
	for (var i = 0; i < this.data.length; i++) {
		var	name = this.data[i].name,
			color = this.data[i].color,
			perc = this.data[i].values[zIndex].y * 100;
		
		if (perc == 0.0) continue;
		
		html += '\x3Csvg width="18" height="18">' +
			'\x3Crect x="1" y="1" width="16" height="16" style="stroke-width:1;stroke:grey;fill: ' +
			color + '">\x3C/rect>\x3C/svg>\x3Ctext>\x3Cstrong>' + 
			name + ':&nbsp;\x3C/strong>' + d3.format(',.2f')(perc) + '%\x3C/text><br>';
	}
	return html;
}
	
DepthChart.prototype.update = function(data, upperZ, lowerZ) {
	this.data = data;
	
	var depthChartObj = this;
	var xScale = this.xScale;
	var yScale = this.yScale;
	var area = this.area;
	var stack = this.stack;
	var tooltip = this.tooltip;
	
	var layers = stack(data);

	yScale.domain([upperZ, lowerZ]);

	var paths = this.chart.selectAll(".layer")
			.data(layers);
			
	var pathsEnter = paths.enter();
	var pathsExit = paths.exit();
	
	pathsEnter.append("path")
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
			
	pathsExit.remove();
	
	if (upperZ == this.upperZ && lowerZ == this.lowerZ) {
		paths.transition()
			.duration(1000)
			.attr("d", function(d) { return area(d.values); })
			.style("fill", function(d, i) { return d.color; });
	} else {
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
		
	this.yAxis.scale(yScale);
	this.chart.selectAll("g.y.axis")
		.transition()
		.duration(1000)
		.call(this.yAxis);

};