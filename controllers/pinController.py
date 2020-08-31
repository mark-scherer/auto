import RPi.GPIO as GPIO

RGB_STRIP_RED_PIN 	= 11
RGB_STRIP_GREEN_PIN = 12
RGB_STRIP_BLUE_PIN 	= 13
WHITE_STRIP_PIN 	= 15

class PinController:
	'''
		pin_guide: dict of (pin_name, pin_number) pairs
	'''
	def __init__(self, pin_guide):
		GPIO.setwarnings(False)
		GPIO.setmode(GPIO.BOARD)

		self.pins = {}
		self.current_values = {}
		for pin_name, pin_number in pin_guide.items():
			GPIO.setup(pin_number, GPIO.OUT)
			self.pins[pin_name] = GPIO.PWM(pin_number, 1000)
			self.pins[pin_name].start(0)
			self.current_values[pin_name] = 0


	def getPinValues(self):
		return self.current_values
		

	'''
		update pwm intensity on specified pin (0-1)
	'''
	def setPin(self, pin_name, value):
		if pin_name not in self.pins:
			raise ValueError('setPin: invalid pin_name: {}'.format(pin_name))

		if value < 0 or value > 1:
			raise ValueError('setPin: value out of bounds: {}'.format(value))

		self.pins[pin_name].ChangeDutyCycle(value*100)
		self.current_values[pin_name] = value