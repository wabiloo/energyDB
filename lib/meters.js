function fullname(meterType) {
	switch(meterType) {
		case 'G':
			return "Gas";
		case 'E':
			return "Electricity";
		default:
			return "Invalid meterType";
	}
}

module.exports = {
	fullname: fullname
}