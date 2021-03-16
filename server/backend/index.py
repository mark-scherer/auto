from http.server import SimpleHTTPRequestHandler,HTTPServer
from urllib.parse import urlparse, unquote, parse_qs
import os 
import sys
import json
import traceback
import uuid

_dir = os.path.dirname(os.path.realpath(__file__))

sys.path.append(os.path.join(_dir, '../../utils/'))
import utils_misc

# actual pin controller, including controls, sequnces, statuses... server index should only send requests
sys.path.append(os.path.join(_dir, '../../controllers/'))
import pinController as pinControl
from sequences import * 

# server index should be only access to configs by backend
with open(os.path.join(_dir, '../configs/config_public.json')) as f:
    config_public = json.load(f)
with open(os.path.join(_dir, '../configs/config_private.json')) as f:
    config_private = json.load(f)
CONFIG = {**config_public, **config_private}
FRONTEND_PATH = os.path.join(_dir, '../frontend/build')

# server globals
pinController = pinControl.PinController(CONFIG['outputs'])
sequenceGuide = {}
sequenceBaseRequiredArgs = ['sequence', 'outputs']

# new handler instance created for each request
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

    def getStatus(self):
        status = {
            'intensities': pinController.getPinValues(),
            'available_sequences': {name: {**utils_misc.dict_pick(info, ['name', 'description', 'eligible_outputs', 'required_args']), 'base_required_args': sequenceBaseRequiredArgs} for name, info in CONFIG['sequences'].items()},
            'active_sequences': {sequence_id: sequence_entry['sequence_info'] for sequence_id, sequence_entry in sequenceGuide.items()}
        }
        return status

    def do_control(self, parsed_path, parsed_query):
        if len(parsed_path) < 2:
            raise ValueError(f'incomplete path: /{"/".join(parsed_path)}')

        cmd_response = None

        if parsed_path[1] == 'updateIntensity':
            self.validateQuery(parsed_query, ['output', 'channel', 'value'])
            pinController.setPin(parsed_query['output'][0], parsed_query['channel'][0], float(parsed_query['value'][0]))

        elif parsed_path[1] == 'startSequence':
            self.validateQuery(parsed_query, sequenceBaseRequiredArgs)
            _sequence_name = parsed_query['sequence'][0]
            if _sequence_name not in CONFIG['sequences']:
                raise ValueError(f'unsupported sequence: {_sequence_name}')

            _sequence_config = CONFIG['sequences'][_sequence_name]
            self.validateQuery(parsed_query, _sequence_config['required_args'])
            
            _sequence_specific_args = {
                **_sequence_config['base_sequence_params'],
                **utils_misc.dict_pick(parsed_query, _sequence_config['required_args']),
                'outputs_guide': utils_misc.dict_pick(_sequence_config['complete_outputs_guide'], parsed_query['outputs']),
            }

            _sequence_class = globals()[_sequence_config['base_sequence_name']]
            _sequence_id = uuid.uuid4().hex
            sequenceGuide[_sequence_id] = {
                'sequence_obj': _sequence_class(**_sequence_specific_args, pin_controller=pinController),
                'sequence_info': {
                    'name': _sequence_name,
                    'args': _sequence_specific_args
                }
            }
            sequenceGuide[_sequence_id]['sequence_obj'].run()
            cmd_response = {'sequence_id': _sequence_id}

        elif parsed_path[1] == 'stopSequence':
            self.validateQuery(parsed_query, ['sequence_id'])

            sequence_id = parsed_query['sequence_id'][0]
            if sequence_id not in sequenceGuide:
                raise ValueError(f'sequence not found: {sequence_id}')

            sequenceGuide[sequence_id]['sequence_obj'].stop()
            del sequenceGuide[sequence_id]

        else:
            raise ValueError(f'unsupported mode: {parsed_query["mode"]}')
        
        self.sendResponseStart()
        response = {
            'cmd_response': cmd_response,
            'status': self.getStatus()
        }
        self.wfile.write(json.dumps(response).encode('utf-8'))  

    def do_status(self, parsed_path, parsed_query):
        self.validateQuery(parsed_query, [])
        response = {
            'status': self.getStatus()
        }
        self.sendResponseStart()
        self.wfile.write(json.dumps(response).encode('utf-8'))  

    # Handler for the GET requests
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
            traceback.print_exc()
            self.send_error(400, message="error: {}".format(error)) 

port = CONFIG['server']['port']
server = HTTPServer(('', port), myHandler)
print('Started httpserver on port {}'.format(port))
server.serve_forever()
