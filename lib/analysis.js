var moment  	= require('moment');
var _ 			= require('lodash');

function mapRecordsToBuckets(buckets, records, weatherdata) {
	// loop through records
	_.forEach(records, function(record) {
		record.duration = moment(record.EndDate).diff(moment(record.StartDate), 'days');		

		console.log("\nRecord %d: from %s to %s (%d days) = %d kWh", record.recordId, record.StartDate, record.EndDate, record.duration, record.Consumption);

		// filter out all buckets that are totally before this record
		var assocBuckets = _.dropWhile(buckets, function(bucket) {
			return bucket.endDate <= record.StartDate;
		});
		// filter out all buckets that are totally after this record
		assocBuckets = _.dropRightWhile(assocBuckets, function(bucket) {
			return bucket.startDate >= record.EndDate;
		});

		record.buckets = assocBuckets;

		// then calculate the consumption for each bucket
		computeConsumptionPerBucket(record);

	});

	// then run aggregate functions;
	aggregateConsumption(buckets);

	// and decorate with weather information
	decorateWeatherInfo(buckets, weatherdata);
}

function computeConsumptionPerBucket(record) {	
	// loops through all records and modify associated buckets
	_.forEach(record.buckets, function (bucket) {

		// calculate the number of days of overlap
		var overlapStart = moment.max(moment(bucket.startDate), moment(record.StartDate));
		var overlapEnd = moment.min(moment(bucket.endDate), moment(record.EndDate));
		var overlapDuration = overlapEnd.diff(overlapStart, 'days');

		// add consumption to bucket
		var overlapConsumption = record.Consumption / record.duration * overlapDuration;
		bucket.consumption += overlapConsumption;

		bucket.associatedRecords.push({
			record: record, 
			overlap: {
				start: overlapStart,
				end: overlapEnd,
				duration: overlapDuration,
				consumption: overlapConsumption
			}
		});

		console.log("  * bucket  %d: year %d, month %d, from %s to %s", bucket.id, bucket.year, bucket.month, bucket.startDate, bucket.endDate);
		console.log("     > overlap: %s to %s (%d days) = %d kWh", overlapStart, overlapEnd, overlapDuration, overlapConsumption);
	});
}

function aggregateConsumption(buckets) {
	var runningCumulConsumption = null;
	
	_.forEach(buckets, function(bucket) {
		if (bucket.month === 1) {
			runningCumulConsumption = bucket.consumption;
		} else {
			runningCumulConsumption += bucket.consumption;
		}
		bucket.cumulConsumption = runningCumulConsumption;
	});
}

function decorateWeatherInfo(buckets, weather) {
	_.forEach(buckets, function(bucket) {
		// find in the weather info the record that matches closest
		var rec = _.findLast(weather, function(wrecord) {
			return moment(wrecord.ReferenceTime) <= bucket.startDate;
		});
		bucket.weather = rec;
	});
}

module.exports = {
	mapRecordsToBuckets: mapRecordsToBuckets
}