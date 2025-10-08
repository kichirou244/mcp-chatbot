import { createServices } from "./../services/index";
import { Request, Response } from "express";
import { IUserCreate } from "../models/User";

export class AuthController {
  private services = createServices();

  async register(req: Request, res: Response): Promise<void> {
    try {
      const formData = {
        username: req.body.username,
        password: req.body.password,
      } as IUserCreate;

      const result = await this.services.authService.register(formData);

      res.status(201).json({
        message: "Đăng ký thành công",
        data: result,
      });
    } catch (error: any) {
      res.status(error.statusCode).json({ error: error.message });
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { username, password } = req.body;

      const result = await this.services.authService.login({
        username,
        password,
      });

      res.status(200).json({
        message: "Đăng nhập thành công",
        data: result,
      });
    } catch (error: any) {
      res.status(error.statusCode).json({ error: error.message });
    }
  }
}
