var _ 			= require('lodash');
var moment		= require('moment');
var plotly 		= require('plotly')("fabre.lambeau", "clzjsknyci");
var meters		= require('./meters');

function plotAll(buckets, readings, meterType) {
	plot_YoY(buckets, meterType);
	plot_continuous(buckets, readings, meterType);
}

function plot_YoY(buckets, meterType) {
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

	//console.log(data);

	var graphOptions = {
		layout: {
			xaxis: {
				title: 'month'
			},
			yaxis: {
				title: "consumption (kWh)"
			},
			title: meters.fullname(meterType) + " - Year-on-Year"
		},
		fileopt : "overwrite", 
		filename : meters.fullname(meterType) + " - Year-on-Year"
	};

	plotly.plot(data, graphOptions, function (err, msg) {
		if (err) return console.log(err);
		console.log(msg);
	});
}

function plot_continuous(buckets, readings, meterType) {
	var datax, datay;
	
	// Data for a continuous line (per month)
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
		type: 'scatter',
		mode: 'lines',
		name: 'per month'
	};

	// Data for actual meter readings
	datax = _.map(readings, function (reading) {
		return moment(reading.EndDate).format('YYYY-MM-DD');
	});
	datay = _.map(readings, function (reading) {
		return reading.Consumption;
	});
	readingdata = {
		x: datax,
		y: datay,
		type: 'scatter',
		mode: 'markers',
		name: 'meter readings'
	};

	var data = [bucketdata, readingdata];

	var graphOptions = {
		layout: {
			xaxis: {
				title: 'time'
			},
			yaxis: {
				title: "consumption (kWh)"
			},
			title: meters.fullname(meterType) + " - Continuous"
		},
		fileopt: "overwrite", 
		filename: meters.fullname(meterType) + " - Continuous"
	};
	plotly.plot(data, graphOptions, function (err, msg) {
		if (err) return console.log(err);
		console.log(msg);
	});
}

module.exports = {
	plot: plotAll
};