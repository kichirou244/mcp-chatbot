import { Outlet, IOutlet } from "../models/Outlet";

export class OutletService {
  async getOutletById(id: number): Promise<IOutlet | null> {
    try {
      const outlet = await Outlet.findByPk(id);
      return outlet ? outlet.toJSON() : null;
    } catch (error) {
      throw new Error(`Error fetching outlet by ID: ${error}`);
    }
  }

  async getOutlets(): Promise<IOutlet[]> {
    try {
      const outlets = await Outlet.findAll();
      return outlets.map((outlet) => outlet.toJSON());
    } catch (error) {
      throw new Error(`Error fetching outlet: ${error}`);
    }
  }

  async createOutlet(outlet: Omit<IOutlet, "id">): Promise<IOutlet> {
    try {
      const { name, address } = outlet;

      const newOutlet = await Outlet.create({
        name,
        address,
      });

      return newOutlet.toJSON();
    } catch (error) {
      throw new Error(`Error creating outlet: ${error}`);
    }
  }

  async updateOutlet(
    id: number,
    outlet: Partial<IOutlet>
  ): Promise<IOutlet | null> {
    try {
      const existingOutlet = await Outlet.findByPk(id);

      if (!existingOutlet) {
        throw new Error(`Outlet with ID ${id} does not exist`);
      }

      await existingOutlet.update(outlet);

      return existingOutlet.toJSON();
    } catch (error) {
      throw new Error(`Error updating outlet: ${error}`);
    }
  }

  async deleteOutlet(id: number): Promise<void> {
    try {
      const existingOutlet = await Outlet.findByPk(id);

      if (!existingOutlet) {
        throw new Error(`Outlet with ID ${id} does not exist`);
      }

      await existingOutlet.destroy();

      return;
    } catch (error) {
      throw new Error(`Error deleting outlet: ${error}`);
    }
  }
}
