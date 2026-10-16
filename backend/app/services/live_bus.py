import asyncio
import json
from typing import AsyncGenerator, Set
from backend.app.core.logging_config import logger

class LiveEventBus:
    """
    In-memory async PubSub event bus for broadcasting live security events 
    and alerts to connected Server-Sent Events (SSE) and WebSocket clients.
    """
    def __init__(self):
        self._subscribers: Set[asyncio.Queue] = set()
        self._loop = None

    def set_loop(self, loop: asyncio.AbstractEventLoop):
        self._loop = loop

    def subscribe(self) -> asyncio.Queue:
        q: asyncio.Queue = asyncio.Queue(maxsize=100)
        self._subscribers.add(q)
        logger.debug(f"[LiveEventBus] Client subscribed. Active listeners: {len(self._subscribers)}")
        return q

    def unsubscribe(self, q: asyncio.Queue):
        self._subscribers.discard(q)
        logger.debug(f"[LiveEventBus] Client unsubscribed. Active listeners: {len(self._subscribers)}")

    def publish_nowait(self, message: dict):
        """Thread-safe and async-safe broadcast of an event dictionary."""
        dead_queues = []
        for q in list(self._subscribers):
            try:
                if q.full():
                    try:
                        q.get_nowait()  # Drop oldest event if buffer is full
                    except asyncio.QueueEmpty:
                        pass
                q.put_nowait(message)
            except Exception as e:
                dead_queues.append(q)

        for dq in dead_queues:
            self._subscribers.discard(dq)

    def publish_from_thread(self, message: dict):
        """Called from synchronous background watcher threads to post to the asyncio event loop."""
        if self._loop and self._loop.is_running():
            self._loop.call_soon_threadsafe(self.publish_nowait, message)
        else:
            # Fallback if no active loop set
            self.publish_nowait(message)

# Global singleton
live_bus = LiveEventBus()
