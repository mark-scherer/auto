import RPi.GPIO as GPIO

LED_STRIP_RED_PIN = 11
LED_STRIP_GREEN_PIN = 12
LED_STRIP_BLUE_PIN = 13

class Controller:
	def __init__(self, red_pin, green_pin, blue_pin):
		GPIO.setwarnings(False)
		GPIO.setmode(GPIO.BOARD)
		GPIO.setup(red_pin, GPIO.OUT)
		GPIO.setup(green_pin, GPIO.OUT)
		GPIO.setup(blue_pin, GPIO.OUT)

		self.red_pin = GPIO.PWM(red_pin, 1000)
		self.green_pin = GPIO.PWM(green_pin, 1000)
		self.blue_pin = GPIO.PWM(blue_pin, 1000)

		self.red_pin.start(0)	
		self.green_pin.start(0)
		self.blue_pin.start(0)

		self.set_pin(self.red_pin, 0)
		self.set_pin(self.green_pin, 0)
		self.set_pin(self.blue_pin, 0)

	'''
		update pwm intensity on specified pin (0-1)
	'''
	def set_pin(self, pin, value):
		if value < 0 or value > 1:
			raise ValueError('value out of bounds: {}'.format(value))

		pin.ChangeDutyCycle(value*100)
		print('set pin to {}'.format(value))