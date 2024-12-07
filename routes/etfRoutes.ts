import express from 'express';
import { createETF, getETFs, updateETF, deleteETF } from '../controllers/etfController';

const router = express.Router();

router.post("/", createETF);
router.get("/", getETFs);
router.put("/:id", updateETF);
router.delete("/:id", deleteETF);

export default router;
