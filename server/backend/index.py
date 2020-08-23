from http.server import SimpleHTTPRequestHandler,HTTPServer
from urllib.parse import urlparse
import os 
import sys

sys.path.append('led_controller/')
import controller as control

port = 8080
controller = control.Controller(control.LED_STRIP_RED_PIN, control.LED_STRIP_GREEN_PIN, control.LED_STRIP_BLUE_PIN)
frontend_path = os.path.join(os.getcwd(), 'server/frontend/build')
print('frontend_path: {}'.format(frontend_path))

class myHandler(SimpleHTTPRequestHandler):
    def __init__(self, request, client_address, server):
        super().__init__(request, client_address, server, directory=frontend_path)

    def do_base(self):
        self.send_response(200)
        self.send_header('Content-type','text/html')
        self.end_headers()  

        file = open(frontend_path, 'rb')
        frontend_content = file.read()
        file.close()
        self.wfile.write(frontend_content)

        print('sent frontend_content: {}'.format(frontend_content.decode('utf-8')))

    def do_update_led_strip(self, query_string):
        try:
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

            print('got color update query: {}'.format(query))

            if 'red' not in query:
                raise ValueError('missing red param')
            if 'green' not in query:
                raise ValueError('missing green param')
            if 'blue' not in query:
                raise ValueError('missing blue param')

            try:
                controller.set_pin(controller.red_pin, float(query['red']))
            except Exception as ex:
                raise ValueError('unsupported red intensity value: {}... {}'.format(query['red'], ex))

            try:
                controller.set_pin(controller.green_pin, float(query['green']))
            except Exception as ex:
                raise ValueError('unsupported green intensity value: {}... {}'.format(query['green'], ex))

            try:
                controller.set_pin(controller.blue_pin, float(query['blue']))
            except Exception as ex:
                raise ValueError('unsupported blue intensity value: {}... {}'.format(query['blue'], ex))

            self.send_response(200)
            self.end_headers() 

        except Exception as ex:
            self.send_error(400, message="error: {}".format(ex)) 


    #Handler for the GET requests
    def do_GET(self):
        parsed = urlparse(self.path)

        if parsed.path == '/update_led_strip':
            print('responding to request: {}'.format(self.path))
            self.do_update_led_strip(parsed.query)
        else:
            # self.path = os.path.join(frontend_path, self.path)
            print('responding to request w/ super.do_GET(): {}'.format(self.path))
            super().do_GET()


server = HTTPServer(('', port), myHandler)
print('Started httpserver on port {}'.format(port))

#Wait forever for incoming http requests
server.serve_forever()