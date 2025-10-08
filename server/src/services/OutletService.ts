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
}
