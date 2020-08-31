from apscheduler.schedulers.background import BackgroundScheduler
from pytz import utc

class Scheduler:
	def __init__(self):
		self.scheduler = BackgroundScheduler(timezone=utc)
		self.scheduler.start()

	'''
		events are one-time scheduled function calls
	'''
	def addEvent(self, eventName, eventDatetime, eventFunc, eventFuncArgs):
		print('scheduling {} for {}'.format(eventName, eventDatetime))
		self.scheduler.add_job(eventFunc, name=eventName, trigger='date', args=eventFuncArgs, run_date=eventDatetime)
		
