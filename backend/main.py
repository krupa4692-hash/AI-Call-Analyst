"""Call Intelligence API — FastAPI entrypoint, CORS, MongoDB lifecycle, and background worker."""

import asyncio
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from routes import calls, dashboard, queue as queue_routes
from services import mongo_service, queue_service


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Startup: connect Mongo, ensure indexes, seed questionnaire, start queue worker.
    Shutdown: cancel worker and close Mongo client.
    """
    try:
        await mongo_service.connect()
    except Exception as e:
        raise RuntimeError(f"MongoDB connection failed: {e}") from e

    try:
        await mongo_service.create_indexes()
    except Exception:
        pass

    try:
        await mongo_service.seed_questions()
    except Exception:
        pass

    worker_task: Optional[asyncio.Task] = None
    try:
        worker_task = asyncio.create_task(queue_service.start_queue_worker())
    except Exception:
        worker_task = None

    try:
        yield
    finally:
        if worker_task is not None:
            try:
                worker_task.cancel()
            except Exception:
                pass
            try:
                await worker_task
            except asyncio.CancelledError:
                pass
            except Exception:
                pass
        try:
            await mongo_service.close()
        except Exception:
            pass


app = FastAPI(title="Call Intelligence API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dashboard.router, prefix="/api")
app.include_router(calls.router, prefix="/api")
app.include_router(queue_routes.router, prefix="/api")


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Return JSON errors for unexpected failures; preserve HTTPException semantics."""
    try:
        if isinstance(exc, RequestValidationError):
            return JSONResponse(status_code=422, content={"detail": exc.errors()})
    except Exception:
        pass
    try:
        if isinstance(exc, HTTPException):
            return JSONResponse(
                status_code=exc.status_code,
                content={"detail": exc.detail},
            )
    except Exception:
        pass
    try:
        return JSONResponse(status_code=500, content={"detail": str(exc)})
    except Exception:
        return JSONResponse(status_code=500, content={"detail": "Internal server error"})


@app.get("/health")
async def health() -> dict[str, str]:
    """Liveness probe for load balancers and orchestrators."""
    return {"status": "ok"}
