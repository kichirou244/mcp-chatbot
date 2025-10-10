import { createServices } from "./../services/index";
import { Request, Response } from "express";
import { IUserCreate, IUserLogin } from "../models/User";

export class AuthController {
  private services = createServices();

  constructor() {
    this.register = this.register.bind(this);
    this.login = this.login.bind(this);
    this.getMe = this.getMe.bind(this);
  }

  async register(req: Request, res: Response): Promise<void> {
    try {
      const formData = {
        username: req.body.username,
        password: req.body.password,
        name: req.body.name,
        phone: req.body.phone,
        address: req.body.address,
      } as IUserCreate;

      const result = await this.services.authService.register(formData);

      res.status(201).json({
        message: "Đăng ký thành công",
        data: result,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ error: error.message });
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { username, password } = req.body;

      const formData = { username, password } as IUserLogin;

      const result = await this.services.authService.login(formData);

      res.status(200).json({
        message: "Đăng nhập thành công",
        data: result,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ error: error.message });
    }
  }

  async getMe(req: Request, res: Response): Promise<void> {
    const accessToken = req.headers.authorization?.split(" ")[1];

    if (!accessToken) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    try {
      const user = await this.services.userService.getMe(accessToken);

      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      res.status(200).json({
        message: "Lấy thông tin người dùng thành công",
        data: user,
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Internal server error" });
      throw error;
    }
  }
}
