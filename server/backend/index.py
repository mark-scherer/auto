from http.server import SimpleHTTPRequestHandler,HTTPServer
from urllib.parse import urlparse
import os 
import sys
import json

sys.path.append('controllers/')
import pinController as pinControl
import scheduler as schedule

sys.path.append('controllers/scripts/')
import sunriseAlarm as sunrise

# server options
port            = 8080
frontend_path   = os.path.join(os.getcwd(), 'server/frontend/build')

# server constants
CURRENT_VALUES_ENDPOINT         = 'get_current_values'
RGB_CONTROL_ENDPOINT            = 'update_rgb_strip'
WHITE_CONTROL_ENDPOINT          = 'update_white_strip'
SCHEDULE_SUNRISE_ENDPOINT       = 'schedule_sunrise'


RGB_PINS                        = ['red', 'green', 'blue']
WHITE_PINS                      = ['white']

# server globals
pinController   = pinControl.PinController({
    'red'       : pinControl.RGB_STRIP_RED_PIN,
    'green'     : pinControl.RGB_STRIP_GREEN_PIN,
    'blue'      : pinControl.RGB_STRIP_BLUE_PIN,
    'white'     : pinControl.WHITE_STRIP_PIN
})
scheduler       = schedule.Scheduler()

class myHandler(SimpleHTTPRequestHandler):
    def __init__(self, request, client_address, server):
        super().__init__(request, client_address, server, directory=frontend_path)

    def parseQuery(self, queryString):
        query = {}
        for vp in queryString.split("&"):
            splitVP = vp.split('=')
            if len(splitVP) == 0:
                raise ValueError('missing key for query param')
            if len(splitVP) == 1:
                raise ValueError('missing value for query param: {}'.format(splitVP[0]))
            elif len(splitVP) == 2:
                query[splitVP[0]] = splitVP[1]
            else:
                raise ValueError('malformed query param: {}'.format(splitVP[0]))
        return query

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
                pinController.setPin(pin_name, float(query[pin_name]))
            except Exception as error:
                raise ValueError('unsupported {} intensity value: {}... {}'.format(pin_name, query[pin_name], error))

        self.send_response(200)
        self.end_headers()

    def do_scheduleEvent(eventName, query, eventFunc, eventFuncArgs):
        if 'datetime' not in query:
            raise ValueError('missing param: {}'.format('datetime'))
        
        scheduler.addEvent(eventName, query['datetime'], eventFunc, eventFuncArgs)
        print('scheduled {} for {}'.format(eventName, query['datetime']))

        self.send_response(200)
        self.end_headers()            

    #Handler for the GET requests
    def do_GET(self):
        try:
            parsed = urlparse(self.path)
            query = self.parseQuery(parsed.query)

            # get current values
            if parsed.path == '/{}'.format(CURRENT_VALUES_ENDPOINT):
                self.do_getCurrentValues()

            # update pins
            elif parsed.path == '/{}'.format(RGB_CONTROL_ENDPOINT):
                self.do_updatePins(parsed.query, RGB_PINS)
            elif parsed.path == '/{}'.format(WHITE_CONTROL_ENDPOINT):
                self.do_updatePins(parsed.query, WHITE_PINS)
            
            # event schedules
            elif parsed.path == '/{}'.format(SCHEDULE_SUNRISE_ENDPOINT):
                if 'duration' not in query:
                    raise ValueError('missing param: {}'.format('duration'))
                self.do_scheduleEvent('sunrise_alarm', query, sunrise.sunriseAlarm, [ query['duration'], pinController ])

            # default
            else:
                super().do_GET()
        except Exception as error:
            print('exception handling GET request ({}): {}'.format(self.path, error))
            self.send_error(400, message="error: {}".format(error)) 


server = HTTPServer(('', port), myHandler)
print('Started httpserver on port {}'.format(port))
server.serve_forever()
