import time
import config

class CentroidTracker:
    def __init__(self, line_x=config.TRIPWIRE_X, cooldown_seconds=config.COOLDOWN_SECONDS):
        self.line_x = line_x
        self.cooldown_seconds = cooldown_seconds
        self.history = {} # asset_code -> list of (timestamp, x_coord)
        self.last_sync_time = {} # asset_code -> last sync timestamp

    def process_movement(self, asset_code: str, center_x: int) -> str:
        """
        Tracks center X coordinate of a bounding box.
        Returns 'checkout', 'checkin', or None
        """
        now = time.time()
        
        # Debounce/Cooldown check
        if asset_code in self.last_sync_time:
            if now - self.last_sync_time[asset_code] < self.cooldown_seconds:
                return None

        if asset_code not in self.history:
            self.history[asset_code] = []

        self.history[asset_code].append((now, center_x))
        # Keep only the last 2 seconds of coordinate history
        self.history[asset_code] = [pt for pt in self.history[asset_code] if now - pt[0] <= 2.0]

        if len(self.history[asset_code]) >= 2:
            first_x = self.history[asset_code][0][1]
            last_x = self.history[asset_code][-1][1]

            # Left to Right: checkout
            if first_x < self.line_x <= last_x:
                self.last_sync_time[asset_code] = now
                self.history[asset_code].clear()
                return "checkout"
            
            # Right to Left: checkin
            elif first_x > self.line_x >= last_x:
                self.last_sync_time[asset_code] = now
                self.history[asset_code].clear()
                return "checkin"

        return None
