import { Product, IProduct, IProductWithOutlet } from "../models/Product";
import { Outlet } from "../models/Outlet";
import { AppError } from "../utils/errors";
import { EmbeddingService } from "./EmbeddingService";
import { OutletService } from "./OutletService";
import { Op } from "sequelize";

const outletServices = new OutletService();
const embeddingServices = new EmbeddingService();

export class ProductService {
  async getProducts(): Promise<IProduct[]> {
    try {
      const products = await Product.findAll();
      return products.map((product) => product.toJSON());
    } catch (error) {
      throw new AppError(`Error fetching products: ${error}`, 500);
    }
  }

  async getProductsOutlets(): Promise<IProductWithOutlet[]> {
    try {
      const products = await Product.findAll({
        include: [
          {
            model: Outlet,
            as: "outlet",
            attributes: ["name", "address"],
          },
        ],
      });

      return products.map((product) => {
        const productJSON = product.toJSON() as any;
        return {
          id: productJSON.id,
          name: productJSON.name,
          description: productJSON.description,
          price: productJSON.price,
          quantity: productJSON.quantity,
          outletId: productJSON.outletId,
          outletName: productJSON.outlet?.name || "",
          outletAddress: productJSON.outlet?.address || "",
        };
      });
    } catch (error) {
      throw new AppError(`Error fetching products with outlets: ${error}`, 500);
    }
  }

  async getProductById(id: number): Promise<IProduct | null> {
    try {
      const product = await Product.findByPk(id);
      return product ? product.toJSON() : null;
    } catch (error) {
      throw new AppError(`Error fetching products by ID: ${error}`, 500);
    }
  }

  async searchProducts(keyword: string): Promise<IProduct[]> {
    try {
      const products = await Product.findAll({
        where: {
          [Op.or]: [
            { name: { [Op.like]: `%${keyword}%` } },
            { description: { [Op.like]: `%${keyword}%` } },
          ],
        },
      });

      return products.map((product) => product.toJSON());
    } catch (error) {
      throw new AppError(`Error searching products: ${error}`, 500);
    }
  }

  async createProduct(product: Omit<IProduct, "id">): Promise<IProduct> {
    try {
      const { name, description, price, outletId, quantity } = product;

      const outlet = await outletServices.getOutletById(outletId);

      if (!outlet) {
        throw new AppError(`Outlet with ID ${outletId} does not exist`, 400);
      }

      const newProduct = await Product.create({
        name,
        description,
        price,
        outletId,
        quantity,
      });

      const data = {
        id: newProduct.id,
        outletId: outletId,
        name: name,
        description: description,
        price: price,
        quantity: quantity,
        outletName: outlet.name,
        outletAddress: outlet.address,
      };

      await embeddingServices.upsertProductWithOutletRows([data]);

      return newProduct.toJSON();
    } catch (error) {
      throw new AppError(`Error creating product: ${error}`, 500);
    }
  }

  async updateProduct(
    id: number,
    product: Partial<IProduct>
  ): Promise<IProduct> {
    try {
      const existingProduct = await Product.findByPk(id);
      if (!existingProduct) {
        throw new AppError(`Product with ID ${id} does not exist`, 404);
      }

      if (product.outletId) {
        const outlet = await outletServices.getOutletById(product.outletId);

        if (!outlet) {
          throw new AppError(
            `Outlet with ID ${product.outletId} does not exist`,
            400
          );
        }
      }

      await existingProduct.update(product);

      return existingProduct.toJSON();
    } catch (error) {
      throw new AppError(`Error updating product: ${error}`, 500);
    }
  }

  async deleteProduct(id: number): Promise<void> {
    try {
      const product = await Product.findByPk(id);

      if (!product) {
        throw new AppError(`Product with ID ${id} does not exist`, 404);
      }

      await product.destroy();

      return;
    } catch (error) {
      throw new AppError(`Error deleting product: ${error}`, 500);
    }
  }
}
