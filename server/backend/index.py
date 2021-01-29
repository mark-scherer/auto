from http.server import SimpleHTTPRequestHandler,HTTPServer
from urllib.parse import urlparse, unquote, parse_qs
import os 
import sys
import json

sys.path.append('controllers/')
import pinController as pinControl
import scheduler as schedule

sys.path.append('controllers/scripts/')
import sunriseAlarm as sunrise

config_public = json.loads('../configs/config_public.json')
config_private = json.loads('../configs/config_private.json')
CONFIG = {**config_public, **config_private}
frontend_path   = os.path.join(os.getcwd(), 'server/frontend/build')

# server globals
pinController   = pinControl.PinController({
    **CONFIG['pins']['rgb'],
    **CONFIG['pins']['white'],
})
scheduler       = schedule.Scheduler()

class myHandler(SimpleHTTPRequestHandler):
    def __init__(self, request, client_address, server):
        super().__init__(request, client_address, server, directory=frontend_path)        

    def do_getCurrentValues(self):
        response = json.dumps(pinController.getPinValues())

        self.send_response(200)
        self.end_headers()
        self.wfile.write(response.encode('utf-8'))

    def do_updatePins(self, query, stripPins):
        
        for pin_name in stripPins:
            if pin_name not in query:
                raise ValueError('missing param: {}'.format(pin_name))

        for pin_name in stripPins:
            try:
                pinController.setPin(pin_name, float(query[pin_name][0]))
            except Exception as error:
                raise ValueError('unsupported {} intensity value: {}... {}'.format(pin_name, query[pin_name], error))

        self.send_response(200)
        self.end_headers()

    def do_scheduleEvent(self, eventName, query, eventFunc, eventFuncArgs):
        if 'datetime' not in query:
            raise ValueError('missing param: {}'.format('datetime'))
        
        scheduler.addEvent(eventName, query['datetime'][0], eventFunc, eventFuncArgs)
        print('scheduled {} for {}'.format(eventName, query['datetime']))

        self.send_response(200)
        self.end_headers()            

    #Handler for the GET requests
    def do_GET(self):
        try:
            parsed = urlparse(unquote(self.path))
            query = parse_qs(parsed.query)

            # misc
            if parsed.path == '/{}'.format(CONFIG['endpoints']['INITIAL_INTENSITIES_ENDPOINT']):
                self.do_getCurrentValues()

            # direct controls
            elif parsed.path == '/{}'.format(CONFIG['endpoints']['RGB_CONTROL_ENDPOINT']):
                self.do_updatePins(query, CONFIG['pins']['rgb'].keys())
            elif parsed.path == '/{}'.format(CONFIG['endpoints']['WHITE_CONTROL_ENDPOINT']):
                self.do_updatePins(query, CONFIG['pins']['white'].keys())
            
            # event schedulers
            elif parsed.path == '/{}'.format(CONFIG['endpoints']['SCHEDULE_SUNRISE_ENDPOINT']):
                if 'duration' not in query:
                    raise ValueError('missing param: {}'.format('duration'))
                self.do_scheduleEvent('sunrise_alarm', query, sunrise.sunriseAlarm, [ float(query['duration'][0]), pinController ])

            # default
            else:
                super().do_GET()
        except Exception as error:
            print('exception handling GET request ({}): {}'.format(self.path, error))
            self.send_error(400, message="error: {}".format(error)) 

port = CONFIG['server']['port']
server = HTTPServer(('', port), myHandler)
print('Started httpserver on port {}'.format(port))
server.serve_forever()
