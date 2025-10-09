import { ProductController } from "./../controllers/ProductController";
import express from "express";

const productController = new ProductController();

const router = express.Router();

router.get("/", productController.getProducts);

export default router;
