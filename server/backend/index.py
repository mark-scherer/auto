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

# server globals (new handler instance created for each request)
pinController = pinControl.PinController(CONFIG['outputs'])

class myHandler(SimpleHTTPRequestHandler):

    def __init__(self, request, client_address, server):
        super().__init__(request, client_address, server, directory=FRONTEND_PATH)

    def validateQuery(self, parsed_query, required_fields):
        for field in required_fields:
            if field not in parsed_query:
                raise ValueError(f'query missing field: {field}')

    def sendResponseStart(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()

    def do_control(self, parsed_path, parsed_query):
        if len(parsed_path) < 2:
            raise ValueError(f'incomplete path: /{"/".join(parsed_path)}')

        if parsed_path[1] == 'updateIntensity':
            self.validateQuery(parsed_query, ['output', 'channel', 'value'])
            pinController.setPin(parsed_query['output'][0], parsed_query['channel'][0], float(parsed_query['value'][0]))
        else:
            raise ValueError(f'unsupported mode: {parsed_query["mode"]}')
        self.sendResponseStart()         

    def do_status(self, parsed_path, parsed_query):
        self.validateQuery(parsed_query, [])
        response = {
            'intensities': pinController.getPinValues()
        }
        self.sendResponseStart()
        self.wfile.write(json.dumps(response).encode('utf-8'))  

    #Handler for the GET requests
    def do_GET(self):
        try:
            parsed_request = urlparse(unquote(self.path))
            parsed_path = parsed_request.path[1:].split('/')
            parsed_query = parse_qs(parsed_request.query)

            if parsed_path[0] == 'control':
                self.do_control(parsed_path, parsed_query)
            elif parsed_path[0] == 'status':
                self.do_status(parsed_path, parsed_query)

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
