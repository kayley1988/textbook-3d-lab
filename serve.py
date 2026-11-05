import http.server, sys
class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()
    def log_message(self, *a): pass
http.server.test(HandlerClass=H, port=int(sys.argv[1]) if len(sys.argv)>1 else 8123, bind='127.0.0.1')
