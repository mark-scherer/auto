'''
    ALI between scheduler & server

    Current implementation use APScheduler
'''

from apscheduler.schedulers.background import BackgroundScheduler
# from apscheduler.triggers.date import DateTrigger
from apscheduler.triggers.interval import IntervalTrigger
from datetime import datetime
import pytz
import json
import re
import copy

TIME_REGEX = '^[0-9]{2}:[0-9]{2}:[0-9]{2}$'

class Scheduler:
    def __init__(self):
        self.scheduler = BackgroundScheduler()
        self.scheduler.start()

        self.jobs = {} # schedule util cannot track job metadata

    # trigger_time_str format (in UTC): HH:MM:SS
    def schedule_job(self, trigger_time_str, job_func, job_name, job_args=[], job_kwargs={}):
        if not re.match(TIME_REGEX, trigger_time_str):
            raise ValueError(f'invalid time format, expecting HH:MM:SS (in UTC), got: {trigger_time_str}')
        
        # IntervalTrigger will schedule event every 24 hrs beginning at strat date BUT NOT in the past
        trigger = IntervalTrigger(hours=24, start_date=f'2021-01-01 {trigger_time_str}', timezone=pytz.utc)
        job = self.scheduler.add_job(job_func, args=job_args, kwargs=job_kwargs, trigger=trigger, name=job_name)
        self.jobs[job.id] = {
            'job_name': job_name,
            'job_args': job_args,
            'job_kwargs': job_kwargs
        }

    def unschedule_job(self, job_id):
        if job_id not in self.jobs:
            raise ValueError(f'Scheduler.unschedule_job: job_id not found: {job_id}')
            
        self.scheduler.remove_job(job_id)
        del self.jobs[job_id]

    def get_scheduled_jobs(self):
        for job_id, job_info in self.jobs.items():
            job_info['next_run_time'] = str(self.scheduler.get_job(job_id).next_run_time)
        return self.jobs