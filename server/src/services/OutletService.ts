import { dbPool } from "../config/database";
import { IOutlet } from "../models/Outlet";

export class OutletService {
  async getOutletById(id: number): Promise<IOutlet | null> {
    let connection;

    try {
      connection = await dbPool.getConnection();

      const [rows] = await connection.query(
        "SELECT * FROM outlets WHERE id = ?",
        [id]
      );

      const outlets = rows as IOutlet[];

      return outlets.length ? outlets[0] : null;
    } catch (error) {
      throw new Error(`Error fetching outlet by ID: ${error}`);
    } finally {
      if (connection) connection.release();
    }
  }

  async getOutlets(): Promise<IOutlet[]> {
    let connection;

    try {
      connection = await dbPool.getConnection();

      const [rows] = await connection.query("SELECT * FROM outlets");

      const outlets = rows as IOutlet[];

      return outlets;
    } catch (error) {
      throw new Error(`Error fetching outlet: ${error}`);
    } finally {
      if (connection) connection.release();
    }
  }

  async createOutlet(outlet: Omit<IOutlet, "id">): Promise<IOutlet> {
    let connection;

    try {
      connection = await dbPool.getConnection();

      const { name, address } = outlet;

      const [result] = await connection.query(
        "INSERT INTO outlets (name, address) VALUES (?, ?)",
        [name, address]
      );

      const insertId = (result as any).insertId;

      return {
        id: insertId,
        name,
        address,
      } as IOutlet;
    } catch (error) {
      throw new Error(`Error creating outlet: ${error}`);
    } finally {
      if (connection) connection.release();
    }
  }

  async updateOutlet(
    id: number,
    outlet: Partial<IOutlet>
  ): Promise<IOutlet | null> {
    let connection;

    try {
      connection = await dbPool.getConnection();

      const existingOutlet = await this.getOutletById(id);

      if (!existingOutlet) {
        throw new Error(`Outlet with ID ${id} does not exist`);
      }

      const updatedOutlet = { ...existingOutlet, ...outlet };

      const { name, address } = updatedOutlet;

      await connection.query(
        "UPDATE outlets SET name = ?, address = ? WHERE id = ?",
        [name, address, id]
      );

      return updatedOutlet;
    } catch (error) {
      throw new Error(`Error updating outlet: ${error}`);
    } finally {
      if (connection) connection.release();
    }
  }

  async deleteOutlet(id: number): Promise<void> {
    let connection;
    try {
      connection = await dbPool.getConnection();

      const existingOutlet = await this.getOutletById(id);

      if (!existingOutlet) {
        throw new Error(`Outlet with ID ${id} does not exist`);
      }

      await connection.query("DELETE FROM outlets WHERE id = ?", [id]);

      return;
    } catch (error) {
      throw new Error(`Error deleting outlet: ${error}`);
    } finally {
      if (connection) connection.release();
    }
  }
}
