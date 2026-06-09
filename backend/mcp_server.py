"""PitchCraft MongoDB MCP server — a real, protocol-compliant MCP server.

This exposes the PitchCraft MongoDB data layer as Model Context Protocol tools.
It's a genuine MCP server (built on the official `mcp` SDK), not a façade — it
can be consumed two ways:

  1. As a standard **stdio MCP server** by any MCP client (Claude Desktop,
     Cursor, the MCP Inspector, …):

         cd backend && python mcp_server.py
         # or:  mcp run mcp_server.py

     Example Claude Desktop config:
         {
           "mcpServers": {
             "pitchcraft-mongodb": {
               "command": "python",
               "args": ["/abs/path/to/backend/mcp_server.py"]
             }
           }
         }

  2. **In-process by the PitchCraft agent** over the real MCP protocol via an
     in-memory client↔server session (see `agent.call_mcp_tool`). The agent's
     market-research (Step 2) and financial (Step 5) grounding flows through
     these MCP tool calls — MongoDB is literally giving the agent its
     "superpowers" through MCP.

The tools are thin, well-described wrappers over `mongodb.py`.
"""

from mcp.server.fastmcp import FastMCP

from mongodb import (
    mcp_search_similar_plans,
    mcp_get_market_benchmarks,
    search_market_data,
)

mcp = FastMCP("PitchCraft MongoDB MCP")


@mcp.tool()
def search_similar_plans(industry: str) -> dict:
    """Search completed business plans stored in MongoDB whose target market
    matches an industry. Returns the most relevant prior plans (market research,
    financials, viability) so the agent can ground new analysis in real patterns
    it has seen before.

    Args:
        industry: The target market / industry to search for (e.g. "healthcare").
    """
    return mcp_search_similar_plans(industry)


@mcp.tool()
def get_market_benchmarks(industry: str) -> dict:
    """Aggregate real benchmarks (average viability score, average break-even
    month, number of plans analysed) from completed plans in MongoDB and blend
    them with seed industry data. Used to keep financial projections realistic.

    Args:
        industry: The industry to benchmark (e.g. "fintech", "e-commerce").
    """
    return mcp_get_market_benchmarks(industry)


@mcp.tool()
def get_industry_market_data(industry: str) -> dict:
    """Look up curated market data for an industry from MongoDB: market size,
    growth rate, key players, average revenue and the main challenges. Falls
    back to the closest seeded industry when there is no exact match.

    Args:
        industry: The industry to look up (e.g. "education", "real estate").
    """
    return search_market_data(industry)


async def list_tools_manifest() -> list[dict]:
    """Serialize the server's real MCP tool list (name + description + schema)
    for the /api/mcp/tools endpoint."""
    tools = await mcp.list_tools()
    return [
        {"name": t.name, "description": (t.description or "").strip(), "input_schema": t.inputSchema}
        for t in tools
    ]


if __name__ == "__main__":
    # Default stdio transport — the standard way MCP clients launch a server.
    mcp.run()
