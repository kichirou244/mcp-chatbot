import { Request, Response } from "express";
import { createServices } from "../services";
import { IOutlet } from "../models/Outlet";

export class OutletController {
  private services = createServices();

  getOutlets = async (_: Request, res: Response): Promise<IOutlet[]> => {
    try {
      const outlets = await this.services.outletService.getOutlets();

      res.status(200).json(outlets);

      return outlets;
    } catch (error) {
      console.error("Error fetching outlets:", error);
      res.status(500).json({ error: "Internal server error" });
      throw error;
    }
  };

  getOutletById = async (
    req: Request,
    res: Response
  ): Promise<IOutlet | null> => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid outlet ID" });
      return null;
    }
    try {
      const outlet = await this.services.outletService.getOutletById(id);
      if (!outlet) {
        res.status(404).json({ error: "Outlet not found" });
        return null;
      }

      res.status(200).json(outlet);
      return outlet;
    } catch (error) {
      console.error("Error fetching outlet by ID:", error);
      res.status(500).json({ error: "Internal server error" });
      throw error;
    }
  };

  createOutlet = async (
    req: Request,
    res: Response
  ): Promise<IOutlet | null> => {
    const { name, address } = req.body;
    if (!name || !address) {
      res.status(400).json({ error: "Name and address are required" });
      return null;
    }

    try {
      const newOutlet = await this.services.outletService.createOutlet({
        name,
        address,
      });
      res.status(201).json(newOutlet);
      return newOutlet;
    } catch (error) {
      console.error("Error creating outlet:", error);
      res.status(500).json({ error: "Internal server error" });
      throw error;
    }
  };

  updateOutlet = async (
    req: Request,
    res: Response
  ): Promise<IOutlet | null> => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid outlet ID" });
      return null;
    }

    const { name, address } = req.body;
    if (!name && !address) {
      res
        .status(400)
        .json({ error: "At least one of name or address is required" });

      return null;
    }

    try {
      const updatedOutlet = await this.services.outletService.updateOutlet(id, {
        name,
        address,
      });
      if (!updatedOutlet) {
        res.status(404).json({ error: "Outlet not found" });
        return null;
      }

      res.status(200).json(updatedOutlet);
      return updatedOutlet;
    } catch (error) {
      console.error("Error updating outlet:", error);
      res.status(500).json({ error: "Internal server error" });
      throw error;
    }
  };

  deleteOutlet = async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid outlet ID" });
      return;
    }

    try {
      await this.services.outletService.deleteOutlet(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting outlet:", error);
      res.status(500).json({ error: "Internal server error" });
      throw error;
    }
  };
}
