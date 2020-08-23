from http.server import BaseHTTPRequestHandler,HTTPServer
from urllib.parse import urlparse

port = 8080

class myHandler(BaseHTTPRequestHandler):

    def do_base(self):
        self.send_response(200)
        self.send_header('Content-type','text/html')
        self.end_headers()  

        # Send the html message
        self.wfile.write("<b> Hello World !</b>".encode("utf-8"))

    def do_update_led_strip(self, query_string):
        query = dict(qc.split("=") for qc in query_string.split("&"))
        print('got color update query: {}'.format(query))

        self.send_response(200)
        self.send_header('Content-type','text/html')
        self.end_headers()  

        # Send the html message
        self.wfile.write("<b> update strip</b>".encode("utf-8"))

    #Handler for the GET requests
    def do_GET(self):
        parsed = urlparse(self.path)

        if parsed.path == '/update_led_strip':
            self.do_update_led_strip(parsed.query)
        else:
            self.do_base()


server = HTTPServer(('', port), myHandler)
print('Started httpserver on port {}'.format(port))

#Wait forever for incoming http requests
server.serve_forever()