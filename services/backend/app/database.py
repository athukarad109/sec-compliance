from prisma import Prisma
from typing import Optional
import asyncio

class Database:
    def __init__(self):
        self.prisma: Optional[Prisma] = None
    
    async def connect(self):
        """Connect to the database."""
        if self.prisma is None:
            self.prisma = Prisma()
            await self.prisma.connect()
    
    async def disconnect(self):
        """Disconnect from the database."""
        if self.prisma is not None:
            await self.prisma.disconnect()
            self.prisma = None
    
    def get_client(self) -> Prisma:
        """Get the Prisma client."""
        if self.prisma is None:
            raise RuntimeError("Database not connected. Call connect() first.")
        return self.prisma

# Global database instance
db = Database()
