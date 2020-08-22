import RPi.GPIO as GPIO
from time import sleep
import controller as control

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

	controller = control.Controller(red_pin, green_pin, blue_pin)

	red_intensity = 0
	green_intensity = 0.5
	blue_intensity = 1.0
	
	increment = 0.025
	cycle_length = 0.1 		# seconds ?

	while True:
		red_intensity += increment
		green_intensity += increment
		blue_intensity += increment

		if red_intensity > 1.0:
			red_intensity = 0
			print('reset intensity: red')

		if green_intensity > 1.0:
			green_intensity = 0
			print('reset intensity: green')

		if blue_intensity > 1.0:
			blue_intensity = 0
			print('reset intensity: blue')

		controller.set_pin(controller.red_pin, red_intensity)
		controller.set_pin(controller.green_pin, green_intensity)
		controller.set_pin(controller.blue_pin, blue_intensity)

		sleep(cycle_length)

def main():
	controller_test_1()

main()