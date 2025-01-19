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

let cachedCookies: string | null = null;
let cookieExpiry: number | null = null;

export const fetchNseData = async (req: any, res: any) => {
  const { symbol } = req.query;

  if (!symbol) {
    return res.status(400).json({ message: "Symbol is required" });
  }

  try {
    // Check if cookies are cached and still valid
    if (!cachedCookies || (cookieExpiry && Date.now() > cookieExpiry)) {
      console.log("Fetching new cookies...");

      // Step 1: Establish session and retrieve cookies
      const sessionResponse = await fetch(
        `https://www.nseindia.com/get-quotes/equity?symbol=${symbol}`,
        {
          method: "GET",
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            Accept: "text/html",
            "Accept-Language": "en-US,en;q=0.9",
          },
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

      // Parse and cache cookies
      cachedCookies = setCookieHeaders
        .map((cookie) => cookie.split(";")[0])
        .filter(
          (cookie) => cookie.startsWith("nseappid") || cookie.startsWith("nsit")
        )
        .join("; ");

      if (
        !cachedCookies.includes("nseappid") ||
        !cachedCookies.includes("nsit")
      ) {
        return res.status(500).json({ message: "Required cookies not found" });
      }

      // Set cookie expiry time (e.g., 30 minutes from now)
      cookieExpiry = Date.now() + 30 * 60 * 1000; // 30 minutes in milliseconds
    }

    // Step 2: Fetch data from NSE API using cached cookies
    const nseResponse = await fetch(
      `https://www.nseindia.com/api/quote-equity?symbol=${symbol}`,
      {
        method: "GET",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          Accept: "application/json",
          "Accept-Language": "en-US,en;q=0.9",
          Referer: `https://www.nseindia.com/get-quotes/equity?symbol=${symbol}`,
          Cookie: cachedCookies,
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

    // Dynamically allow origins
    const allowedOrigins = [
      "http://localhost:5173", // Local frontend URL
      "https://i-nav-tracker-by-urvish.vercel.app", // Deployed frontend URL
    ];

    const origin = req.headers.origin;

    if (allowedOrigins.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    }

    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );

    res.json({
      lastPrice: priceInfo?.lastPrice || null,
      iNavValue: priceInfo?.iNavValue || null,
    });
  } catch (error) {
    console.error("Error fetching NSE data:", error);
    res.status(500).json({ message: "Error fetching NSE data" });
  }
};
