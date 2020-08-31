
# constants
timestep 	= 100 		# ms

'''
	duration: 	seconds
'''
def sunriseAlarm(duration, pinController):
	i_max = duration*1000 / timestep
	for i in range(i_max):
		intensities = {
			'white' 	: i / i_max
		}

		print('sunriseAlarm ({}/{}): setting intensities: {}'.format(i, i_max, intensities))
		for channel, intensity in intensities.items():
			pinController.setPin(channel, intensity)
		sleep(timestep)
