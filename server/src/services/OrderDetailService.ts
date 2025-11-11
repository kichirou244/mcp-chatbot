import { OrderDetail, IOrderDetailCreate } from "../database/models";
import { AppError } from "../utils/errors";
import { ProductService } from "./ProductService";

const productService = new ProductService();

export class OrderDetailService {
  async saveOrderDetail(formData: IOrderDetailCreate) {
    const { orderId, productId, quantity, unitPrice } = formData;

    try {
      const product = await productService.getProductById(productId);
      if (!product) {
        throw new AppError("Product not found", 404);
      }

      const orderDetail = await OrderDetail.create({
        orderId,
        productId,
        quantity,
        unitPrice,
      });

      return orderDetail.toJSON();
    } catch (error) {
      throw new AppError(`Failed to save order detail: ${error}`, 500);
    }
  }
}
