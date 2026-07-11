import cv2
import queue
import threading
import time
import config

class ThreadedRTSPStream:
    def __init__(self):
        self.rtsp_url = config.RTSP_URL
        self.q = queue.Queue(maxsize=3)
        self.stopped = True
        self.cap = None
        self.thread = None

    def start(self):
        self.stopped = False
        self.cap = cv2.VideoCapture(self.rtsp_url)
        self.thread = threading.Thread(target=self._reader, daemon=True)
        self.thread.start()

    def stop(self):
        self.stopped = True
        if self.cap:
            self.cap.release()

    def _reader(self):
        while not self.stopped:
            ret, frame = self.cap.read()
            if not ret:
                print("[RTSP] Stream disconnected. Reconnecting in 5s...")
                self.cap.release()
                time.sleep(5)
                self.cap = cv2.VideoCapture(self.rtsp_url)
                continue
                
            # Discard stale frames to stay thread-safe and live
            if not self.q.empty():
                try:
                    self.q.get_nowait()
                except queue.Empty:
                    pass
            self.q.put(frame)

    def get_latest_frame(self):
        try:
            return self.q.get(timeout=2)
        except queue.Empty:
            return None
