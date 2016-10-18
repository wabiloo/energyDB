var moment  	= require('moment');
var _ 			= require('lodash');
var mysql   	= require('mysql');
var plotter		= require('./lib/plotter');
var data 		= require('./lib/data');
var timebuckets		= require('./lib/time_buckets');
var analysis 	= require('./lib/analysis');

/*var mysql_db = mysql.createConnection({
  host     : 'elysium.krystal.co.uk',
  user     : 'eacdbces_energyadmin',
  password : 'NskWD3XGK3',
  database : 'eacdbces_energy'
});*/

var mysql_db = mysql.createConnection({
  user     : 'root',
  database : 'energyDB',
  socketPath: '/tmp/mysql.sock'
});
mysql_db.connect();

var meterTypes = ['G', 'E'];
var startDate = '2011-06-01';

_.forEach(meterTypes, function (meterType) {
	var buckets = timebuckets.createTimeBuckets(startDate, "months");

	data.getUsageData(mysql_db, meterType, function(records) {
		data.getWeatherData(mysql_db, startDate, function(weather) {
			analysis.mapRecordsToBuckets(buckets, records, weather);	

			displayBuckets(buckets);
		
			plotter.plot(buckets, records, meterType, weather);	
		});
		
	});	
});

//mysql_db.end();


function displayBuckets(buckets) {
	_.forEach(buckets, function(bucket) {
		console.log("\nBucket %d: year %d, month %d, from %s to %s", bucket.id, bucket.year, bucket.month, bucket.startDate, bucket.endDate);
		console.log("  -> Associated records: %d", bucket.associatedRecords.length);
		
		_.forEach(bucket.associatedRecords, function(r, i) {
			console.log("    %d. record %d, %s-%s (%d kWh) - %d days = %d kWh", i+1, r.record.RecordId, r.record.StartDate, r.record.EndDate, r.record.Consumption, r.overlap.duration, r.overlap.consumption);
		});

		if(bucket.weather) {
			console.log("  -> Weather record for %s:  avg temp= %d, mean degree days= %d", bucket.weather.ReferenceTime, bucket.weather.AvgTemp, bucket.weather.MeanDegreeDays);
		} else {
			console.log("  -> NO WEATHER RECORD");
		}

		console.log("  => Total consumption: %d kWh (cumulative: %d kWh)", bucket.consumption, bucket.cumulConsumption);
	});
}
