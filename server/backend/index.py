from http.server import SimpleHTTPRequestHandler,HTTPServer
from httpcompressionserver import HTTPCompressionRequestHandler
from urllib.parse import urlparse, unquote, parse_qs
import os 
import sys
import json
import traceback
import uuid
import functools
from datetime import datetime

_dir = os.path.dirname(os.path.realpath(__file__))

sys.path.append(os.path.join(_dir, '../../utils/'))
import utils_misc

# actual pin controller, including controls, sequnces, statuses... server index should only send requests
sys.path.append(os.path.join(_dir, '../../controllers/'))
import pinController as pinControl
from sequences import * 
from scheduler import Scheduler

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
scheduler = Scheduler()

# new handler instance created for each request
class myHandler(HTTPCompressionRequestHandler):

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
        
        scheduled_sequences = {} 
        for job_id, job_info in scheduler.get_scheduled_jobs().items():
            scheduled_sequences[job_id] = {
                'sequence_config': utils_misc.dict_pick(job_info['job_args'][0], ['sequence_name', 'sequence_id', 'sequence_args']),
                'trigger_time': job_info['next_run_time'][11:19] # just get HH:MM:SS (in UTC)
            }

        status = {
            'intensities': pinController.getPinValues(),
            'available_sequences': {name: {**utils_misc.dict_pick(info, ['name', 'description', 'eligible_outputs', 'required_args']), 'base_required_args': sequenceBaseRequiredArgs} for name, info in CONFIG['sequences'].items()},
            'active_sequences': {sequence_id: sequence_entry['sequence_info'] for sequence_id, sequence_entry in sequenceGuide.items()},
            'scheduled_sequences': scheduled_sequences
        }
        return status

    # args passed to each Sequence inst (via sequence_info fields sequence_args and sequence_nonrecordable_args, both passed to sequence ctor in startSequence)
        # sequence config's base_sequence_params field
        # sequence config's required_args fields found in request query
        # outputs_guide: sequence config's complete_outputs_guide dict pick'd to fields in request query's outputs field
        # initial_status: current status of involved outputs
        # stop_sequence_func: function to properly stop & delete sequence
    def parseSequence(self, parsed_query):
        self.validateQuery(parsed_query, sequenceBaseRequiredArgs)
        sequence_info = {
            'sequence_name': parsed_query['sequence'][0]
        }
        if sequence_info['sequence_name'] not in CONFIG['sequences']:
            raise ValueError(f"unsupported sequence: {sequence_info['sequence_name']}")

        sequence_info['sequence_config'] = CONFIG['sequences'][sequence_info['sequence_name']]
        self.validateQuery(parsed_query, sequence_info['sequence_config']['required_args'])
        
        for output in parsed_query['outputs']:
            if output not in sequence_info['sequence_config']['complete_outputs_guide']:
                raise ValueError(f"invalid output specified for sequence {sequence_info['sequence_name']}: {output}")

        sequence_info['sequence_class'] = globals()[sequence_info['sequence_config']['base_sequence_name']]
        sequence_info['sequence_id'] = uuid.uuid4().hex

        sequence_info['sequence_args'] = {
            **sequence_info['sequence_config']['base_sequence_params'],
            **utils_misc.dict_pick(parsed_query, sequence_info['sequence_config']['required_args']),
            'outputs_guide': utils_misc.dict_pick(sequence_info['sequence_config']['complete_outputs_guide'], parsed_query['outputs']),
            'initial_status': utils_misc.dict_pick(self.getStatus()['intensities'], parsed_query['outputs'])
        }
        sequence_info['sequence_nonrecordable_args'] = {
            'pin_controller': pinController,
            'stop_sequence_func': functools.partial(self.stopSequence, sequence_info['sequence_id'])
        }

        return sequence_info

    def startSequence(self, full_sequence_info):
        # stop any other sequences on output
        to_stop = {}
        for sequence_output in full_sequence_info['sequence_args']['outputs_guide']:
            for other_sequence_id, other_sequence_entry in sequenceGuide.items():
                if sequence_output in other_sequence_entry['sequence_info']['sequence_args']['outputs_guide']:
                    to_stop[other_sequence_id] = True

        for other_sequence_id in to_stop.keys():
            self.stopSequence(other_sequence_id)

        sequenceGuide[full_sequence_info['sequence_id']] = {
            'sequence_obj': full_sequence_info['sequence_class'](**full_sequence_info['sequence_args'], **full_sequence_info['sequence_nonrecordable_args']),
            'sequence_info': utils_misc.dict_pick(full_sequence_info, ['sequence_name', 'sequence_args'])
        }
        sequenceGuide[full_sequence_info['sequence_id']]['sequence_obj'].run()
        return full_sequence_info['sequence_id']
    
    def stopSequence(self, sequence_id):
        if sequence_id not in sequenceGuide:
            raise ValueError(f'sequence not found: {sequence_id}')

        sequenceGuide[sequence_id]['sequence_obj'].stop()
        del sequenceGuide[sequence_id]

    def do_control(self, parsed_path, parsed_query):
        if len(parsed_path) < 2:
            raise ValueError(f'incomplete path: /{"/".join(parsed_path)}')

        cmd_response = None

        if parsed_path[1] == 'updateIntensity':
            self.validateQuery(parsed_query, ['output', 'channel', 'value'])
            pinController.setPin(parsed_query['output'][0], parsed_query['channel'][0], float(parsed_query['value'][0]))

        elif parsed_path[1] == 'startSequence':
            full_sequence_info = self.parseSequence(parsed_query)
            cmd_response = {'sequence_id': self.startSequence(full_sequence_info)}

        elif parsed_path[1] == 'stopSequence':
            self.validateQuery(parsed_query, ['sequence_id'])

            sequence_id = parsed_query['sequence_id'][0]
            self.stopSequence(sequence_id)

        elif parsed_path[1] == 'scheduleSequence':
            full_sequence_info = self.parseSequence(parsed_query)
            self.validateQuery(parsed_query, ['trigger_time'])

            trigger_datetime_str = parsed_query['trigger_time'][0]
            scheduler.schedule_job(trigger_datetime_str, self.startSequence, full_sequence_info['sequence_name'], [full_sequence_info])

        elif parsed_path[1] == 'unscheduleSequence':
            self.validateQuery(parsed_query, ['job_id'])

            job_id = parsed_query['job_id'][0]
            scheduler.unschedule_job(job_id)

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
