var moment  	= require('moment');
var _ 			= require('lodash');

function createTimeBuckets(startDate, frequency) {
	switch (frequency) {
		case "months":
			return createMonthlyBuckets(startDate);
	}
}

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
		bucket.duration = moment(bucket.endDate).diff(moment(bucket.startDate), 'days');

		bucket.incomplete = true;
		bucket.consumption = null;
		bucket.cumulConsumption = null;

		bucket.associatedRecords = [];

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

module.exports = {
	createTimeBuckets: createTimeBuckets
};