import RPi.GPIO as GPIO
from time import sleep
import math
import sys
# import controller as control
import pinController as pinControl

sys.path.append('controllers/scripts/')
import sunriseAlarm as sunrise


def pwm_test_1():
	ledpin = 12				# PWM pin connected to LED
	GPIO.setwarnings(False)			#disable warnings
	GPIO.setmode(GPIO.BOARD)		#set pin numbering system
	GPIO.setup(ledpin,GPIO.OUT)
	pi_pwm = GPIO.PWM(ledpin,1000)		#create PWM instance with frequency
	pi_pwm.start(0)				#start PWM of required Duty Cycle 
	while True:
	    for duty in range(0,101,1):
	        pi_pwm.ChangeDutyCycle(duty) #provide duty cycle in the range 0-100
	        sleep(0.01)
	    print('set duty cycle to 100')
	    sleep(0.5)
	    
	    for duty in range(100,-1,-1):
	        pi_pwm.ChangeDutyCycle(duty)
	        sleep(0.01)
	    print('set duty cycle to 0')
	    sleep(0.5)

def controller_test_1():
	red_pin = 11
	green_pin = 12
	blue_pin = 13

	controller = control.Controller(red_pin, green_pin, blue_pin)\

	red_shift = 0
	green_shift = 2*math.pi / 3
	blue_shift = 4*math.pi / 3
	
	t = 0
	cycle_length = 0.01
	period = 3

	while True:
		t_adjusted = 2 * math.pi * (t / period)
		red_intensity = 0.5*math.sin(t_adjusted + red_shift) + 0.5
		green_intensity = 0.5*math.sin(t_adjusted + green_shift) + 0.5
		blue_intensity = 0.5*math.sin(t_adjusted + blue_shift) + 0.5

		controller.set_pin(controller.red_pin, red_intensity)
		controller.set_pin(controller.green_pin, green_intensity)
		controller.set_pin(controller.blue_pin, blue_intensity)

		t += cycle_length
		print('updated t to {}, t_adjusted: {}'.format(t, t_adjusted))
		sleep(cycle_length)

def controller_test_2():
	controller = control.Controller({
	    'white'       : control.WHITE_STRIP_PIN,
	})

	t = 0
	cycle_length = 0.01
	period = 3

	while True:
		t_adjusted = 2 * math.pi * (t / period)
		intensity = 0.5*math.sin(t_adjusted) + 0.5

		controller.set_pin('white', intensity)

		t += cycle_length
		print('updated t to {}, t_adjusted: {}'.format(t, t_adjusted))
		sleep(cycle_length)

def sunriseTest1():
	duration = 10

	pinController   = pinControl.PinController({
	    'red'       : pinControl.RGB_STRIP_RED_PIN,
	    'green'     : pinControl.RGB_STRIP_GREEN_PIN,
	    'blue'      : pinControl.RGB_STRIP_BLUE_PIN,
	    'white'     : pinControl.WHITE_STRIP_PIN
	})

	print('starting sunrise alarm...')
	sunrise.sunriseAlarm(duration, pinController)

def main():
	sunriseTest1()

main()