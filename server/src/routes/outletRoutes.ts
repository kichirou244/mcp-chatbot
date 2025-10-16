import express from "express";
import { OutletController } from "../controllers/OutletsController";
import { authenticateToken } from "../middleware/authMiddleware";

const outletController = new OutletController();

const router = express.Router();

router.get("/", outletController.getOutlets);
router.get("/:id", outletController.getOutletById);

router.post("/", authenticateToken, outletController.createOutlet);
router.put("/:id", authenticateToken, outletController.updateOutlet);
router.delete("/:id", authenticateToken, outletController.deleteOutlet);

export default router;
