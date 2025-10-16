import { Request, Response } from "express";
import { IUserResponse } from "../models/User";
import { createServices } from "../services";

export class UserController {
  private services = createServices();

  getUsers = async (_: Request, res: Response): Promise<IUserResponse[]> => {
    try {
      const users = await this.services.userService.getUsers();
      res.status(200).json(users);
      return users;
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Internal server error" });
      throw error;
    }
  };

  getUserById = async (
    req: Request,
    res: Response
  ): Promise<IUserResponse | null> => {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid user ID" });
      return null;
    }

    try {
      const user = await this.services.userService.getUserById(id);

      if (!user) {
        res.status(404).json({ error: "User not found" });
        return null;
      }

      res.status(200).json(user);
      return user;
    } catch (error) {
      console.error(`Error fetching user with ID ${id}:`, error);
      res.status(500).json({ error: "Internal server error" });
      throw error;
    }
  };
}
