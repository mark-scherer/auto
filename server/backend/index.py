from http.server import SimpleHTTPRequestHandler,HTTPServer
from urllib.parse import urlparse
import os 
import sys
import json

sys.path.append('controllers/')
import pinController as pinControl

port = 8080
pinController = pinControl.PinController({
    'red'       : pinControl.RGB_STRIP_RED_PIN,
    'green'     : pinControl.RGB_STRIP_GREEN_PIN,
    'blue'      : pinControl.RGB_STRIP_BLUE_PIN,
    'white'     : pinControl.WHITE_STRIP_PIN
})
frontend_path = os.path.join(os.getcwd(), 'server/frontend/build')

RGB_CONTROL_ENDPOINT            = 'update_rgb_strip'
WHITE_CONTROL_ENDPOINT          = 'update_white_strip'
CURRENT_VALUES_ENDPOINT         = 'get_current_values'

RGB_PINS                        = ['red', 'green', 'blue']
WHITE_PINS                      = ['white']

class myHandler(SimpleHTTPRequestHandler):
    def __init__(self, request, client_address, server):
        super().__init__(request, client_address, server, directory=frontend_path)

    def parse_query(self, query_string):
        query = {}
        for vp in query_string.split("&"):
            split_vp = vp.split('=')
            if len(split_vp) == 0:
                raise ValueError('missing key for query param')
            if len(split_vp) == 1:
                raise ValueError('missing value for query param: {}'.format(split_vp[0]))
            elif len(split_vp) == 2:
                query[split_vp[0]] = split_vp[1]
            else:
                raise ValueError('malformed query param: {}'.format(split_vp[0]))
        return query

    def do_get_current_values(self):
        response = json.dumps(pinController.get_pin_values())

        self.send_response(200)
        self.end_headers()
        self.wfile.write(response.encode('utf-8'))

    def do_update_strip(self, query_string, strip_pins):
        query = self.parse_query(query_string)

        for pin_name in strip_pins:
            if pin_name not in query:
                raise ValueError('missing param: {}'.format(pin_name))

        for pin_name in strip_pins:
            try:
                pinController.set_pin(pin_name, float(query[pin_name]))
            except Exception as error:
                raise ValueError('unsupported {} intensity value: {}... {}'.format(pin_name, query[pin_name], error))

        self.send_response(200)
        self.end_headers()            

    #Handler for the GET requests
    def do_GET(self):
        try:
            parsed = urlparse(self.path)

            if parsed.path == '/{}'.format(CURRENT_VALUES_ENDPOINT):
                self.do_get_current_values()
            elif parsed.path == '/{}'.format(RGB_CONTROL_ENDPOINT):
                self.do_update_strip(parsed.query, RGB_PINS)
            elif parsed.path == '/{}'.format(WHITE_CONTROL_ENDPOINT):
                self.do_update_strip(parsed.query, WHITE_PINS)
            else:
                super().do_GET()
        except Exception as error:
            print('exception handling GET request ({}): {}'.format(self.path, error))
            self.send_error(400, message="error: {}".format(error)) 


server = HTTPServer(('', port), myHandler)
print('Started httpserver on port {}'.format(port))

#Wait forever for incoming http requests
server.serve_forever()