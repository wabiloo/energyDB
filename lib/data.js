var mysql   	= require('mysql');
var moment 		= require('moment');
var _ 			= require('lodash');

function getUsageData(mysql_db, type, callback) {
	mysql_db.query("SELECT * FROM consumption_records WHERE MeterType = ? ORDER BY StartDate", [type], function(err, rows, fields) {
	  	if (err) throw err;

	  	console.log('Number of rows returned: ', rows.length);

  		callback(rows);
	});	
}

function getWeatherData(mysql_db, start_date, callback) {
	mysql_db.query("SELECT * from weather_by_month WHERE StartDate >= (SELECT min(StartDate) FROM consumption_records)", [],
		function(err, rows, fields) {
			if (err) throw err;

			callback(rows);
		});
}

module.exports = {
	getUsageData: getUsageData,
	getWeatherData: getWeatherData
};