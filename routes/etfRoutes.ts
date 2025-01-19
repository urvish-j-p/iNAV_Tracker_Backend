import express from "express";
import {
  createETF,
  getETFs,
  updateETF,
  deleteETF,
  searchETFs,
  fetchNseData,
} from "../controllers/etfController";

const router = express.Router();

router.post("/", createETF);
router.get("/", getETFs);
router.put("/:id", updateETF);
router.delete("/:id", deleteETF);
router.get("/search", searchETFs);
router.get("/nse-data", fetchNseData);

export default router;
