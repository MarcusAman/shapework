import cv2
from http.server import BaseHTTPRequestHandler, HTTPServer
import socketserver
import time
import sys
import os

# Adjust path to import config
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import config

class VideoStreamHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/video_feed':
            self.send_response(200)
            self.send_header('Content-type', 'multipart/x-mixed-replace; boundary=frame')
            self.end_headers()
            
            # Open local RTSP camera stream
            cap = cv2.VideoCapture(config.RTSP_URL)
            if not cap.isOpened():
                print("[Server] Error: Could not connect to Tapo RTSP stream. Check IP/credentials in .env")
                return

            try:
                while True:
                    ret, frame = cap.read()
                    if not ret:
                        time.sleep(0.05)
                        continue
                    
                    # Resize frame for efficient local web network streaming
                    small_frame = cv2.resize(frame, (640, 360))
                    
                    # Encode frame as JPEG format
                    _, jpeg = cv2.imencode('.jpg', small_frame)
                    frame_bytes = jpeg.tobytes()
                    
                    self.wfile.write(b'--frame\r\n')
                    self.send_header('Content-Type', 'image/jpeg')
                    self.send_header('Content-Length', str(len(frame_bytes)))
                    self.end_headers()
                    self.wfile.write(frame_bytes)
                    self.wfile.write(b'\r\n')
                    time.sleep(0.04) # ~25 FPS
            except Exception as e:
                # Triggers when browser tab is closed/refreshed
                print(f"[Server] Web client disconnected: {e}")
            finally:
                cap.release()
        else:
            # Main HTML page
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            self.wfile.write(b"""
            <!DOCTYPE html>
            <html>
            <head>
                <title>Tapo Live View</title>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                        background: #1c1917;
                        color: #f5f5f4;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        height: 100vh;
                        margin: 0;
                    }
                    h2 { font-weight: 300; margin-bottom: 20px; }
                    .video-container {
                        border: 2px solid #292524;
                        border-radius: 12px;
                        overflow: hidden;
                        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                    }
                </style>
            </head>
            <body>
                <h2>Tapo TCW-61 Live Camera Feed</h2>
                <div class="video-container">
                    <img src="/video_feed" width="640" height="360" />
                </div>
            </body>
            </html>
            """)

class ThreadingHTTPServer(socketserver.ThreadingMixIn, HTTPServer):
    pass

def run(port=5000):
    server = ThreadingHTTPServer(('0.0.0.0', port), VideoStreamHandler)
    print(f"[Server] Live view stream server running on http://localhost:{port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        server.server_close()

if __name__ == '__main__':
    run()
