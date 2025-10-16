import { AuthService } from "./AuthService";
import { UserService } from "./UserService";
import { OutletService } from "./OutletService";
import { OrderService } from "./OrderService";
import { OrderDetailService } from "./OrderDetailService";
import { ProductService } from "./ProductService";
import { AiAgent } from "./AiAgent";
import { EmbeddingService } from "./EmbeddingService";

export const createServices = () => {
  const authService = new AuthService();
  const userService = new UserService();
  const outletService = new OutletService();
  const orderService = new OrderService();
  const orderDetailService = new OrderDetailService();
  const productService = new ProductService();
  const aiAgent = new AiAgent();
  const embeddingService = new EmbeddingService();

  return {
    authService,
    userService,
    outletService,
    orderService,
    orderDetailService,
    productService,
    aiAgent,
    embeddingService,
  };
};
