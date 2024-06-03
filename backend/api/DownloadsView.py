from starlette.requests import Request
from starlette.responses import Response, JSONResponse
from backend.managers.DownloadsManager import DownloadsManager
from backend.paths import api_base_url
from backend.pagination import parse_pagination_params

class DownloadsView:
    def __init__(self):
        self.manager = DownloadsManager()

    async def get(self):
        downloads = await self.manager.retrieve_downloads()
        return JSONResponse(status_code=200, content=downloads)

    async def post(self, body: list):
        if not body or not isinstance(body, list):
            return JSONResponse(status_code=400, content={"message": "Invalid request: body must be a list of download details"})

        try:
            download_ids = await self.manager.queue_downloads(body)
            return JSONResponse(status_code=200, content=[{"download_id": download_id} for download_id in download_ids])
        except Exception as e:
            # TODO: Log and conceal error details
            return JSONResponse(status_code=400, content={"message": str(e)})

    async def put(self):
        return JSONResponse(status_code=501, content={"message": "Not Implemented"})

    async def delete(self, download_id: str):
        await self.manager.delete_download(download_id)
        return Response(status_code=204)

    async def search(self, filter: str = None, range: str = None, sort: str = None):
        result = parse_pagination_params(filter, range, sort)
        if isinstance(result, JSONResponse):
            return result

        offset, limit, sort_by, sort_order, filters = result

        downloads, total_count = await self.manager.retrieve_downloads(limit=limit, offset=offset)
        headers = {
            'X-Total-Count': str(total_count),
            'Content-Range': f'downloads {offset}-{offset + len(downloads) - 1}/{total_count}'
        }
        return JSONResponse(downloads, status_code=200, headers=headers)

    # custom functions

    async def pause(self, download_id: str):
        await self.manager.pause_download(download_id)
        return JSONResponse(status_code=200, content={"message": "Download paused"})

    async def resume(self, download_id: str):
        await self.manager.resume_download(download_id)
        return JSONResponse(status_code=200, content={"message": "Download resumed"})
