from http.server import SimpleHTTPRequestHandler,HTTPServer
from urllib.parse import urlparse, unquote, parse_qs
import os 
import sys
import json

_dir = os.path.dirname(os.path.realpath(__file__))

sys.path.append(os.path.join(_dir, '../../controllers/'))
import pinController as pinControl
import scheduler as schedule

sys.path.append(os.path.join(_dir, '../../controllers/scripts'))
import sunriseAlarm as sunrise

with open(os.path.join(_dir, '../configs/config_public.json')) as f:
    config_public = json.load(f)
with open(os.path.join(_dir, '../configs/config_private.json')) as f:
    config_private = json.load(f)
CONFIG = {**config_public, **config_private}
FRONTEND_PATH = os.path.join(_dir, '../frontend/build')

class myHandler(SimpleHTTPRequestHandler):

    def __init__(self, request, client_address, server):
        self.pinController = pinControl.PinController(CONFIG['outputs'])
        super().__init__(request, client_address, server, directory=FRONTEND_PATH)

    def validateQuery(parsed_query, required_fields):
        for field in required_fields:
            if field not in parsed_query:
                raise ValueError(f'query missing field: {field}')

    def sendResponseStart(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()

    def do_control(parsed_query):
        self.validateQuery(parsed_query, ['mode'])

        if parsed_query['mode'] == 'updateIntensity':
            self.validateQuery(parsed_query, ['output', 'channel', 'value'])
            self.pinController.setPin(**parsed_query)
        else:
            raise ValueError(f'unsupported mode: {parsed_query["mode"]}')
        self.sendResponseStart()         

    def do_status(parsed_query):
        self.validateQuery(parsed_query, [])
        response = {
            'intensities': json.dumps(pinController.getPinValues())
        }
        self.sendResponseStart()
        self.wfile.write(response.encode('utf-8'))  

    #Handler for the GET requests
    def do_GET(self):
        try:
            parsed_path = urlparse(unquote(self.path)).path[1:].split('/')
            parsed_query = parse_qs(parsed.query)

            if parsed_path[0] == 'control':
                self.do_control(parsed_query)
            elif parsed_path[0] == 'status':
                self.do_status(parsed_query)

            # default: send frontend
            else:
                super().do_GET()
        except Exception as error:
            print('exception handling request ({}): {}'.format(self.path, error))
            self.send_error(400, message="error: {}".format(error)) 

port = CONFIG['server']['port']
server = HTTPServer(('', port), myHandler)
print('Started httpserver on port {}'.format(port))
server.serve_forever()
