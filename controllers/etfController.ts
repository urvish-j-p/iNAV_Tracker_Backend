import ETF from "../models/ETF";

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
