var _ 			= require('lodash');
var moment		= require('moment');
var plotly 		= require('plotly')("fabre.lambeau", "clzjsknyci");
var meters		= require('./meters');
const util 		= require('util');

function plotAll(buckets, records, meterType, weather) {
	//plot_comparative(buckets, meterType);
	//plot_comparative_cumulative(buckets, meterType);
	plot_series(buckets, records, meterType, weather);
	plot_degreedays(buckets, weather, meterType);
}

function plot_comparative(buckets, meterType) {
	var name = meters.fullname(meterType) + " - Comparative";
	var years = _.groupBy(buckets, 'year');
	
	data = _.map(years, function(yeardata, key) {
		yr = moment(yeardata[0].endDate).year();
		yr2 = moment(yeardata[yeardata.length-1].endDate).year();

		return {
			x: _.map(yeardata, function(yd) {
				return moment(yd.endDate).format('MMM');
			}),
			y: _.map(yeardata, function(yd) {
				if (yd.consumption) {
					return yd.consumption.toFixed();	
				}
				return null;
			}),
			name: "Year " + key + " " + yr + "-" + yr2
		};
	});

	var graphOptions = {
		layout: {
			xaxis: {
				title: 'month'
			},
			yaxis: {
				title: "consumption (kWh)"
			},
			title: name
		},
		fileopt : "overwrite", 
		filename : name
	};

	plotly.plot(data, graphOptions, function (err, msg) {
		if (err) return console.log(err);
		console.log(msg);
	});
}

function plot_comparative_cumulative(buckets, meterType) {
	var name = meters.fullname(meterType) + " - Comparative Cumulative";
	var years = _.groupBy(buckets, 'year');
	
	data = _.map(years, function(yeardata, key) {
		yr = moment(yeardata[0].endDate).year();
		yr2 = moment(yeardata[yeardata.length-1].endDate).year();

		return {
			x: _.map(yeardata, function(yd) {
				return moment(yd.endDate).format('MMM');
			}),
			y: _.map(yeardata, function(yd) {
				if (yd.cumulConsumption) {
					return yd.cumulConsumption.toFixed();	
				}
				return null;
			}),
			name: "Year " + key + " " + yr + "-" + yr2
		};
	});

	var graphOptions = {
		layout: {
			xaxis: {
				title: 'month'
			},
			yaxis: {
				title: "consumption (kWh)"
			},
			title: name
		},
		fileopt : "overwrite", 
		filename : name
	};

	plotly.plot(data, graphOptions, function (err, msg) {
		if (err) return console.log(err);
		console.log(msg);
	});
}

function plot_series(buckets, records, meterType, weather) {
	var datax, datay;
	var name = meters.fullname(meterType) + " - Time Series";
	
	// === Data for a continuous line (per month)
	datax = _.map(buckets, function(bucket) {
		return moment(bucket.endDate).format('YYYY-MM-DD');
	});
	datay = _.map(buckets, function(bucket) {
		if (bucket.consumption) {
			return bucket.consumption.toFixed();	
		}
		return null;		
	});
	bucketdata = { 
		x: datax, 
		y: datay, 
		type: 'bar',
		hoverinfo: 'x+y',
		name: 'monthly total'
	};

	// === Data for actual meter records
	datax = _.map(records, function (record) {
		return moment(record.EndDate).format('YYYY-MM-DD');
	});
	datay = _.map(records, function (record) {
		return record.Consumption;
	});
	var recorddata = {
		x: datax,
		y: datay,
		type: 'scatter',
		mode: 'markers',
		name: 'meter records'
	};

	// === Data for annual totals
	var years = _.groupBy(buckets, 'year');
	datax = _.map(years, function(buckets, key) {
		var yr = moment(buckets[0].endDate).year();
		return moment(yr.toString()).date(31).month(12).format('YYYY-MM-DD');
	});
	datay = _.map(years, function(yearbuckets, key) {
		var yeartotal = _.reduce(yearbuckets, function(total, bucket) {
			return total + bucket.consumption;
		}, 0);
		return yeartotal.toFixed();
	});
	var yeardata = {
		x: datax,
		y: datay,
		type: 'scatter',
		mode: 'lines',
		yaxis: 'y3',
		name: 'yearly total',
		line: {
			shape: 'vh'
		}
	}; 

	// === Data for average temperatures
	datax = _.map(weather, 'ReferenceTime');
	datay = _.map(weather, 'AvgTemp');
	var weatherdata = {
		x: datax,
		y: datay,
		type: 'scatter',
		mode: 'lines',
		yaxis: 'y2',
		name: 'avg temperatures',
		line: {
			//shape: 'hvh'
		}
	};

	// === Data for mean degree days
	datax = _.map(weather, 'ReferenceTime');
	datay = _.map(weather, 'MeanDegreeDays');
	var degreedaydata = {
		x: datax,
		y: datay,
		type: 'scatter',
		mode: 'lines',
		yaxis: 'y4',
		name: 'mean degree days',
		line: {
			//shape: 'hvh'
		}
	};	

	var graphOptions = {
		layout: {
			xaxis: {
				title: 'time',
				showgrid: true
			},
			yaxis: {
				title: "monthly consumption (kWh)",
				domain: [0, 0.60]
			},
			yaxis2: {
   			 	title: "temperature",
			    titlefont: {color: "rgb(148, 103, 189)"},
			    tickfont: {color: "rgb(148, 103, 189)"},
			    overlaying: "y",
			    side: "right"
		  	},
		  	yaxis3: {
		  		title: "yearly consumption (kWh)",
		  		domain: [0.70, 1]
		  	},
			title: name
		},
		fileopt: "overwrite", 
		filename: name
	};

	var data;
	switch (meterType) {
		case 'G': 
			graphOptions.layout.yaxis4 = {
   			 	title: "mean degree days",
			    anchor: 'free',
    			overlaying: 'y',
    			side: 'right',
    			position: 1.15
		  	};
			data = [bucketdata, recorddata, weatherdata, yeardata, degreedaydata];	
			break;
		case 'E':
			data = [bucketdata, recorddata, yeardata];	
			break;
	}

	//console.log(util.inspect(data, false, null));
	//console.log(util.inspect(graphOptions, false, null));

	plotly.plot(data, graphOptions, function (err, msg) {
		if (err) return console.log(err);
		console.log(msg);
	});
}


function plot_degreedays(buckets, weather, meterType) {
	var name = meters.fullname(meterType) + " - Consumption vs Degree Days";

	var datax = _.map(buckets, function(bucket) {
		if (bucket.weather) {
			return bucket.weather.MeanDegreeDays;
		}
	});
	var datay = _.map(buckets, function(bucket) {
		if (bucket.weather) {
			return bucket.consumption / bucket.duration;
		}
	});

	var data = {
		x: datax,
		y: datay,
		type: 'scatter',
		mode: 'markers',
		name: 'consumption against degree days',
	};

	var graphOptions = {
		layout: {
			xaxis: {
				title: 'mean degree days'
			},
			yaxis: {
				title: "consumption (kWh/day)"
			},
			title: name
		},
		fileopt : "overwrite", 
		filename : name
	};

	plotly.plot(data, graphOptions, function (err, msg) {
		if (err) return console.log(err);
		console.log(msg);
	});
}

module.exports = {
	plot: plotAll
};