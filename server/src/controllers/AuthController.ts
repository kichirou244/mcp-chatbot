import { createServices } from "./../services/index";
import { Request, Response } from "express";
import { IAuthResponse, IUserCreate, IUserLogin } from "../database/models";

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
    const userPayload = (req as any).user;

    if (!userPayload || !userPayload.id) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    try {
      const user = await this.services.userService.getUserById(userPayload.id);

      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      const data = {
        id: user.id,
        username: user.username,
        accessToken: (req as any).token,
      } as IAuthResponse;

      res.status(200).json({
        message: "Lấy thông tin người dùng thành công",
        data: data,
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Internal server error" });
      throw error;
    }
  }
}
