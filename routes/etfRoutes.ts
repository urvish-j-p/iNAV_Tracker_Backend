import express from "express";
import {
  createETF,
  getETFs,
  updateETF,
  deleteETF,
  searchETFsFromGroww,
} from "../controllers/etfController";

const router = express.Router();

router.post("/", createETF);
router.get("/", getETFs);
router.put("/:id", updateETF);
router.delete("/:id", deleteETF);
router.get("/search-etf", searchETFsFromGroww);

export default router;
