import RPi.GPIO as GPIO

LED_STRIP_RED_PIN = 11
LED_STRIP_GREEN_PIN = 12
LED_STRIP_BLUE_PIN = 13

class Controller:
	'''
		pin_guide: dict of (pin_name, pin_number) pairs
	'''
	def __init__(self, pin_guide):
		GPIO.setwarnings(False)
		GPIO.setmode(GPIO.BOARD)

		self.pins = {}
		for pin_name, pin_number in pin_guide.items():
			GPIO.setup(pin_number, GPIO.OUT)
			self.pins[pin_name] = GPIO.PWM(pin_number, 1000)
			self.pins[pin_name].start(0)


	'''
		update pwm intensity on specified pin (0-1)
	'''
	def set_pin(self, pin_name, value):
		if pin_name not in self.pins:
			raise ValueError('set_pin: invalid pin_name: {}'.format(pin_name))

		if value < 0 or value > 1:
			raise ValueError('set_pin: value out of bounds: {}'.format(value))

		pin.ChangeDutyCycle(value*100)