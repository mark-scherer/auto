from http.server import SimpleHTTPRequestHandler,HTTPServer
from urllib.parse import urlparse
import os 
import sys

sys.path.append('led_controller/')
import controller as control

port = 8080
controller = control.Controller({
    'red'       : control.LED_STRIP_RED_PIN,
    'green'     : control.LED_STRIP_GREEN_PIN,
    'blue'      : control.LED_STRIP_BLUE_PIN
})
frontend_path = os.path.join(os.getcwd(), 'server/frontend/build')

class myHandler(SimpleHTTPRequestHandler):
    def __init__(self, request, client_address, server):
        super().__init__(request, client_address, server, directory=frontend_path)

    def parse_query(query_string):
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

    def do_update_led_strip(self, query_string):
        led_strip_pins = ['red', 'green', 'blue']

        query = self.parse_query(query_string)

        for pin_name in led_strip_pins:
            if pin_name not in query:
                raise ValueError('missing param: {}'.format(pin_name))

        for pin_name in led_strip_pins:
            try:
                controller.set_pin(pin_name, float(query[pin_name]))
            except Exception as error:
                raise ValueError('unsupported {} intensity value: {}... {}'.format(pin_name, query[pin_name], error))

        self.send_response(200)
        self.end_headers()
            


    #Handler for the GET requests
    def do_GET(self):
        try:
            parsed = urlparse(self.path)

            if parsed.path == '/update_led_strip':
                self.do_update_led_strip(parsed.query)
            else:
                # self.path = os.path.join(frontend_path, self.path)
                print('responding to request w/ super.do_GET(): {}'.format(self.path))
                super().do_GET()
        except Exception as error:
            print('excetion handling GET request ({}): {}'.format(self.path, error))
            self.send_error(400, message="error: {}".format(error)) 


server = HTTPServer(('', port), myHandler)
print('Started httpserver on port {}'.format(port))

#Wait forever for incoming http requests
server.serve_forever()