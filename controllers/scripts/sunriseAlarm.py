from time import sleep

# constants
timestep 	= 100 		# ms

'''
	duration: 	seconds
'''
def sunriseAlarm(duration, pinController):
	i_max = int(round(duration*1000 / timestep))
	for i in range(i_max):
		intensities = {
			'white' 	: float(i) / float(i_max)
		}

		print('sunriseAlarm ({}/{}): setting intensities: {}'.format(i, i_max, intensities))
		for channel, intensity in intensities.items():
			pinController.setPin(channel, intensity)
		sleep(timestep)
