import requests
import datetime
import config

class ShapeworkApiClient:
    def __init__(self):
        self.base_url = config.SHAPEWORK_API_URL
        self.headers = {
            "Authorization": f"Bearer {config.SHAPEWORK_TOKEN}",
            "x-workspace-id": config.WORKSPACE_ID,
            "Content-Type": "application/json"
        }
        self.assets_map = {} # Maps assetCode ('NS-YS-001') -> assetId ('ast_1')
        self.load_assets_catalog()

    def load_assets_catalog(self):
        try:
            url = f"{self.base_url}/api/ops/assets"
            res = requests.get(url, headers=self.headers)
            if res.status_code == 200:
                assets = res.json().get("assets", [])
                self.assets_map = {a["assetCode"]: a["id"] for a in assets if "assetCode" in a}
                print(f"[REST API] Loaded {len(self.assets_map)} assets from Shapework ledger.")
            else:
                print(f"[REST API] Failed to fetch assets: {res.text}")
        except Exception as e:
            print(f"[REST API] Connection error loading catalog: {e}")

    def update_ledger(self, asset_code: str, agent_name: str, action: str):
        asset_id = self.assets_map.get(asset_code)
        if not asset_id:
            # Refresh asset map catalog once and check again
            self.load_assets_catalog()
            asset_id = self.assets_map.get(asset_code)
            if not asset_id:
                print(f"[REST API] Asset code {asset_code} not found in Shapework registry. Ignoring.")
                return False

        # Prepare parameters
        payload = {
            "assetId": asset_id,
            "actorEmail": "camera-vision@nestrealty.com",
            "actorName": "Warehouse Tapo AI"
        }

        if action == "checkout":
            url = f"{self.base_url}/api/ops/assets/checkout"
            payload.update({
                "agent": agent_name or "Unknown Agent",
                "property": "Warehouse Depot Exit",
                "expectedReturnDate": (datetime.datetime.now() + datetime.timedelta(days=7)).isoformat()
            })
        else:
            url = f"{self.base_url}/api/ops/assets/checkin"

        try:
            res = requests.post(url, json=payload, headers=self.headers)
            if res.status_code == 200:
                print(f"[REST API] Successfully {action}ed asset {asset_code} to {agent_name or 'System'}")
                return True
            else:
                print(f"[REST API] Failed request to {url}: {res.status_code} - {res.text}")
        except Exception as e:
            print(f"[REST API] Failed to communicate with Shapework server: {e}")
        return False
