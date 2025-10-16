import { authenticateToken } from "../middleware/authMiddleware";
import { ProductController } from "./../controllers/ProductController";
import express from "express";

const productController = new ProductController();

const router = express.Router();

router.get("/", productController.getProducts);
router.get("/:id", productController.getProductById);
router.post("/", authenticateToken, productController.createProduct);
router.put("/:id", authenticateToken, productController.updateProduct);
router.delete("/:id", authenticateToken, productController.deleteProduct);

export default router;
