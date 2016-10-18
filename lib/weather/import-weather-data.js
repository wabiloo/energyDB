// usage: node import-weather-data <path to CSV file>
// The imported file is the raw CSV file from http://www.cl.cam.ac.uk/research/dtg/weather/

var csv 		= require("fast-csv");
var mysql   	= require('mysql');
var moment		= require('moment');

var script = process.argv[1];
var csvfile = process.argv[2];

var startDate = "2011-01-01";

var mysql_db = mysql.createConnection({
  user     : 'root',
  database : 'energyDB',
  socketPath: '/tmp/mysql.sock'
});
mysql_db.connect();

mysql_db.query("TRUNCATE TABLE weather", [], function(err, rows, fields) {
	if (err) throw err;
  	importWeatherData();
});
 
function importWeatherData() {
	csv
	.fromPath(csvfile)
		.on("data", function(record){    	 
			if (moment(startDate) < moment(record[0])) {
				insertWeatherData(record);
			}
		})
		.on("end", function(){
			mysql_db.end();
		});

}

function insertWeatherData(record) {
	var vTime 	= record[0];
	var vTemp 	= record[1] / 10;
	var vHum 	= record[2];
	var vDew 	= record[3] / 10;
	var vPress	= record[4];
	var vWnd	= record[5] / 10;
	var vBear	= record[6];
	if (record[6] === '') {
		vBear = null;
	}
	var vSun	= record[7] / 100;
	var vRain	= record[8] / 1000;
	var vMaxW	= record[9] / 10;

	var query = 
		"INSERT INTO weather " +
		"(Time,Temperature,Humidity,DewPoint,Pressure,MeanWindSpeed,AvgWindBearing,Sunshine,Rainfall,MaxWindSpeed) " +
		"VALUES('" + vTime + "'," + vTemp + "," + vHum + "," + vDew + "," + vPress + "," + vWnd + "," + vBear + "," + vSun + "," + vRain + "," + vMaxW + ")";

	mysql_db.query(query, function(err, rows, fields) {
		if (err) throw err;
		console.log(record[0]);
	});
}
