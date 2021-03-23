import csv
import threading
import time
import json
import traceback

def read_csv(filepath):
    with open(filepath) as csv_file:
        csv_reader = csv.reader(csv_file, delimiter=',')
        line_count = 0
        headers = []
        data = []
        for row in csv_reader:
            if line_count == 0:
                headers = row
                line_count += 1
            else:
                data.append(dict(zip(headers, row)))
                line_count += 1
        print(f'read {line_count} rows from {filepath}')
        return data

def dict_pick(d, keys):
    return {x: d[x] for x in d.keys() if x in keys}

def dict_omit(d, keys):
    return {x: d[x] for x in d if x not in keys}

def clamp(value, _min, _max):
    return min(max(value, _min), _max)

'''
    Run specified function on loop on non-blocking thread
        func must have 1st arg as elaspsed_time
'''
class NonBlockingLoopingFunc:
    def __init__(self, timestep, func, *args):
        self.timestep = timestep
        self.func = func
        self.args = args

        self.running = None
        self.start_time = time.time()
        self.thread = threading.Thread(target = self._loopFunc)
    
    def _loopFunc(self):
        try:
            while self.running:
                self.elapsed_time = time.time() - self.start_time
                self.func(self.elapsed_time, *self.args)
                time.sleep(self.timestep)
        except Exception as error:
            print(f"exception in sequence loop: {json.dumps({'func': self.func.__name__, 'error': str(error)})}")
            traceback.print_exc()
            self.stop()

    
    def start(self):
        self.running = True
        self.thread.start()

    def stop(self):
        self.running = False