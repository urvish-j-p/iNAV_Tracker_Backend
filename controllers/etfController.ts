import ETF from "../models/ETF";

export const createETF = async (req: any, res: any) => {
  try {
    const { name, symbol, userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const etf = new ETF({ name, symbol, userId });
    await etf.save();
    res.status(201).json(etf);
  } catch (error) {
    res.status(500).json({ message: "Error creating ETF" });
  }
};

export const getETFs = async (req: any, res: any) => {
  try {
    const userId = req.query.userId;
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const etfs = await ETF.find({ userId });
    res.json(etfs);
  } catch (error) {
    res.status(500).json({ message: "Error fetching ETFs" });
  }
};

export const updateETF = async (req: any, res: any) => {
  try {
    const { name, userId } = req.body;
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const etf = await ETF.findById(req.params.id);
    if (!etf) {
      return res.status(404).json({ message: "ETF not found" });
    }

    if (etf.userId.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this ETF" });
    }

    etf.name = name || etf.name;

    await etf.save();
    res.json(etf);
  } catch (error) {
    res.status(500).json({ message: "Error updating ETF" });
  }
};

export const deleteETF = async (req: any, res: any) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const etf = await ETF.findById(req.params.id);
    if (!etf) {
      return res.status(404).json({ message: "ETF not found" });
    }

    if (etf.userId.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this ETF" });
    }

    await ETF.findByIdAndDelete(req.params.id);
    res.json({ message: "ETF deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting ETF" });
  }
};

export const searchETFs = async (req: any, res: any) => {
  try {
    const { query } = req.query;

    if (!query || query.trim() === "") {
      return res.status(400).json({ message: "Search query is required" });
    }

    // Construct the Groww API URL
    const growwApiUrl = `https://groww.in/v1/api/search/v3/query/global/st_query?query=${query}`;

    // Fetch data from Groww API using native fetch
    const response = await fetch(growwApiUrl);

    // Check if the response is OK
    if (!response.ok) {
      return res.status(response.status).json({
        message: `Error fetching data from Groww API: ${response.statusText}`,
      });
    }

    // Parse the response JSON
    const data = await response.json();

    // Filter results where entity_type is "ETF"
    const etfResults = data.data.content.filter(
      (item: any) => item.entity_type === "ETF"
    );

    // Send the filtered results back to the client
    res.json(etfResults);
  } catch (error) {
    console.error("Error fetching ETFs from Groww API:", error);
    res.status(500).json({ message: "Error fetching ETFs" });
  }
};

export const fetchNseData = async (req: any, res: any) => {
  const { symbol } = req.query;

  if (!symbol) {
    return res.status(400).json({ message: "Symbol is required" });
  }

  try {
    // Step 1: Establish session and retrieve cookies
    const sessionResponse = await fetch(
      `https://www.nseindia.com/get-quotes/equity?symbol=${symbol}`,
      {
        method: "GET",
      }
    );

    // Extract cookies from headers
    const setCookieHeaders: string[] = [];
    sessionResponse.headers.forEach((value, key) => {
      if (key.toLowerCase() === "set-cookie") {
        setCookieHeaders.push(value);
      }
    });

    if (setCookieHeaders.length === 0) {
      return res.status(500).json({ message: "Failed to establish session" });
    }

    // Parse cookies and extract nseappid and nsit
    const cookies = setCookieHeaders
      .map((cookie) => cookie.split(";")[0]) // Extract the cookie key-value pair
      .filter(
        (cookie) => cookie.startsWith("nseappid") || cookie.startsWith("nsit")
      ) // Filter nseappid and nsit
      .join("; "); // Join cookies as a single string

    if (!cookies.includes("nseappid") || !cookies.includes("nsit")) {
      return res.status(500).json({ message: "Required cookies not found" });
    }

    // Step 2: Make a second request to fetch data using the cookies
    const nseResponse = await fetch(
      `https://www.nseindia.com/api/quote-equity?symbol=${symbol}`,
      {
        method: "GET",
        headers: {
          Cookie: cookies,
        },
      }
    );

    if (!nseResponse.ok) {
      return res.status(nseResponse.status).json({
        message: `Failed to fetch NSE data: ${nseResponse.statusText}`,
      });
    }

    const data = await nseResponse.json();
    const { priceInfo } = data;

    res.json({
      lastPrice: priceInfo?.lastPrice || null,
      iNavValue: priceInfo?.iNavValue || null,
    });
  } catch (error) {
    console.error("Error fetching NSE data:", error);
    res.status(500).json({ message: "Error fetching NSE data" });
  }
};
