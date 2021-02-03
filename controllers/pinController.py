import RPi.GPIO as GPIO
import copy
import json

'''
	class to handle actual interaction with device pins
'''
class PinController:
	'''
		pi: prep all channels & set to 0
	'''
	def piSetup(pin_guide):
		GPIO.setwarnings(False)
		GPIO.setmode(GPIO.BOARD)
		for output, output_guide in pin_guide.items():
			for channel, pin_number in output_guide.items():
				GPIO.setup(pin_number, GPIO.OUT)
				self.pin_objects[output][channel] = GPIO.PWM(pin_number, 1000)
				self.pin_objects[output][channel].start(0)


	'''
		pin_guide: dict of format: {output_name_1, {channel_name_1: pin_number_1, ...,}, ...}
	'''
	def __init__(self, pin_guide):
		self.pin_objects = copy.deepcopy(pin_guide)
		self.current_values = copy.deepcopy(pin_guide)
		for output, output_guide in pin_guide.items():
			for channel, pin_number in output_guide.items():
				self.pin_objects[output][channel] = None
				self.current_values[output][channel] = 0
		self.piSetup(pin_guide)


	def getPinValues(self):
		return self.current_values
		

	'''
		update pwm intensity on specified pin (0-1)
	'''
	def setPin(self, output, channel, value):
		if output not in self.pin_objects:
			raise ValueError(f'setPin: invalid output: {output}')
		if channel not in self.pin_objects[output]:
			raise ValueError(f'setPin: invalid channel for output: {json.dumps({'output': output, 'channel': channel})}')

		if value < 0 or value > 1:
			raise ValueError(f'setPin: value out of bounds: {value}')

		self.pin_objects[output][channel].ChangeDutyCycle(value*100)
		self.current_values[output][channel] = value