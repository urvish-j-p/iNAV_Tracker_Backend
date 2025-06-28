import ETF from "../models/ETF";
import axios from "axios";

export const createETF = async (req: any, res: any) => {
  try {
    const { name, link, userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const etf = new ETF({ name, link, userId });
    await etf.save();
    res.status(201).json(etf);
  } catch (error) {
    res.status(500).json({ message: "Error creating ETF" });
  }
};

export const getETFs = async (req: any, res: any) => {
  // Delay utility (inline)
  const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

  // Browser-mimicking headers (inline)
  const browserHeaders = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36",
    Accept: "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.9",
    "X-Requested-With": "XMLHttpRequest",
  };

  try {
    const userId = req.query.userId as string;
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const etfs = await ETF.find({ userId });

    const enrichedETFs = await Promise.all(
      etfs.map(async (etf, index) => {
        try {
          // Delay each request slightly
          await delay(index * 300);

          const quotePageURL = `https://www.nseindia.com/get-quotes/equity?symbol=${etf.link}`;

          // Step 1: Load quote page to get fresh cookies
          const homepage = await axios.get(quotePageURL, {
            headers: browserHeaders,
            timeout: 10000,
          });

          const rawCookies = homepage.headers["set-cookie"];
          if (!rawCookies || rawCookies.length === 0) {
            throw new Error("No cookies returned from NSE");
          }

          // Step 2: Filter essential cookies
          const filteredCookies = rawCookies
            .map((cookie) => cookie.split(";")[0])
            .slice(0, 3)
            .join("; ");

          // Step 3: Fetch live ETF data using cookies
          const quoteRes = await axios.get(
            `https://www.nseindia.com/api/quote-equity?symbol=${etf.link}`,
            {
              headers: {
                ...browserHeaders,
                Referer: quotePageURL,
                Cookie: filteredCookies,
              },
              timeout: 10000,
            }
          );

          const priceInfo = quoteRes.data?.priceInfo || {};

          return {
            ...etf.toObject(),
            iNavValue: priceInfo?.iNavValue ?? null,
            lastPrice: priceInfo?.lastPrice ?? null,
          };
        } catch (error: any) {
          console.error(
            `Error fetching quote for ${etf.link}:`,
            error?.response?.status || error.message
          );
          return {
            ...etf.toObject(),
            iNavValue: null,
            lastPrice: null,
          };
        }
      })
    );

    return res.json(enrichedETFs);
  } catch (err) {
    console.error("Server error while fetching ETFs:", err);
    return res.status(500).json({
      message: "Internal server error while fetching ETFs",
    });
  }
};

export const updateETF = async (req: any, res: any) => {
  try {
    const { name, link, userId } = req.body;
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
    etf.link = link || etf.link;
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

export const searchETFsFromGroww = async (req: any, res: any) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ message: "Query is required" });
  }

  try {
    const response = await axios.get(
      `https://groww.in/v1/api/search/v3/query/global/st_query`,
      {
        params: {
          entity_type: "etf",
          query,
        },
        headers: {
          // Optional: spoof headers if Groww starts blocking requests
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36",
        },
      }
    );

    res.json(response.data);
  } catch (error: any) {
    console.error("Groww API error:", error.message);
    res.status(500).json({ message: "Failed to fetch ETF data from Groww" });
  }
};
