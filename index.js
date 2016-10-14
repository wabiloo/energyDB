var mysql   = require('mysql');
var moment  = require('moment');
var _ 		= require('lodash');
var plotter	= require('./lib/plotter');

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
	var buckets = createMonthlyBuckets(startDate);

	getConsumption(meterType, function(readings) {
		console.log(buckets);
		mapReadingsToBuckets(buckets, readings);	

		displayBuckets(buckets);
		plotter.plot(buckets, readings, meterType);
	});	
});

mysql_db.end();


// create a number of monthly buckets, based on a set start date
function createMonthlyBuckets(startDate) {
	var buckets = [];

	var start = moment(startDate);
	var today = moment();

	var i = 1;
	var numMonth = 1;
	var numYear = 1;

	while (start.isBefore(today)) {
		var bucket = {};
		bucket.id = i++;
		bucket.year = numYear;
		bucket.month = numMonth++;
		bucket.startDate = start.toDate();
		
		// calculate end date
		start.add(1,'months');
		var end = moment(start);
		bucket.endDate = end.toDate();
		//bucket.duration = end.diff(start, 'days');

		bucket.incomplete = true;
		bucket.consumption = null;

		bucket.associatedReadings = [];

		// reset the year/month if necessary
		if (numMonth > 12) {
			numMonth = 1;
			numYear++;
		}

		// console.log("new bucket for year %d, month %d, from %s to %s", bucket.year, bucket.month, bucket.startDate, bucket.endDate);

		buckets.push(bucket);
	}

	return buckets;
}

function getConsumption(meterType, callback) {
	mysql_db.query("SELECT * FROM consumption_periods WHERE MeterType = ? ORDER BY StartDate", [meterType], function(err, rows, fields) {
	  	if (err) throw err;

	  	console.log('Number of rows returned: ', rows.length);

  		callback(rows);
	});	
}

function mapReadingsToBuckets(buckets, readings) {
	// loop through readings
	_.forEach(readings, function(reading) {
		reading.duration = moment(reading.EndDate).diff(moment(reading.StartDate), 'days');		

		console.log("\nReading %d: from %s to %s (%d days) = %d kWh", reading.ReadingId, reading.StartDate, reading.EndDate, reading.duration, reading.Consumption);

		// filter out all buckets that are totally before this reading
		var assocBuckets = _.dropWhile(buckets, function(bucket) {
			return bucket.endDate <= reading.StartDate;
		});
		// filter out all buckets that are totally after this reading
		assocBuckets = _.dropRightWhile(assocBuckets, function(bucket) {
			return bucket.startDate >= reading.EndDate;
		});

		/*_.forEach(assocBuckets, function(bucket) {
			console.log("  > bucket  %d: year %d, month %d, from %s to %s", bucket.id, bucket.year, bucket.month, bucket.startDate, bucket.endDate);
		});*/
		reading.buckets = assocBuckets;

		// then calculate the consumption for each bucket
		computeConsumptionPerBucket(reading);
	});
}

function computeConsumptionPerBucket(reading) {
	_.forEach(reading.buckets, function (bucket) {

		console.log("  * bucket  %d: year %d, month %d, from %s to %s", bucket.id, bucket.year, bucket.month, bucket.startDate, bucket.endDate);

		// calculate the number of days of overlap
		var overlapStart = moment.max(moment(bucket.startDate), moment(reading.StartDate));
		var overlapEnd = moment.min(moment(bucket.endDate), moment(reading.EndDate));
		var overlapDuration = overlapEnd.diff(overlapStart, 'days');

		// add consumption to bucket
		var overlapConsumption = reading.Consumption / reading.duration * overlapDuration;
		bucket.consumption += overlapConsumption;

		bucket.associatedReadings.push({
			reading: reading, 
			overlap: {
				start: overlapStart,
				end: overlapEnd,
				duration: overlapDuration,
				consumption: overlapConsumption
			}
		});

		console.log("     > overlap: %s to %s (%d days) = %d kWh", overlapStart, overlapEnd, overlapDuration, overlapConsumption);
	});
}

function displayBuckets(buckets) {
	_.forEach(buckets, function(bucket) {
		console.log("\nBucket %d: year %d, month %d, from %s to %s", bucket.id, bucket.year, bucket.month, bucket.startDate, bucket.endDate);
		console.log("  -> Associated Readings: %d", bucket.associatedReadings.length);
		
		_.forEach(bucket.associatedReadings, function(r, i) {
			console.log("    %d. reading %d, %s-%s (%d kWh) - %d days = %d kWh", i+1, r.reading.ReadingId, r.reading.StartDate, r.reading.EndDate, r.reading.Consumption, r.overlap.duration, r.overlap.consumption);
		});
		console.log("  => Total consumption: %d kWh", bucket.consumption);
	});
}
