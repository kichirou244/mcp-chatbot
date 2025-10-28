import { User } from "../models/User";
import { IUserResponse } from "../models/User";
import { AppError } from "../utils/errors";

export class UserService {
  async getUserById(userId: number): Promise<IUserResponse | null> {
    try {
      const user = await User.findByPk(userId, {
        attributes: ["id", "username", "name", "phone", "address"],
      });

      return user ? user.toJSON() : null;
    } catch (error) {
      throw new AppError(`Error fetching user: ${error}`, 500);
    }
  }

  async getUsers(): Promise<IUserResponse[]> {
    try {
      const users = await User.findAll({
        attributes: ["id", "username", "name", "phone", "address"],
      });

      return users.map((user) => user.toJSON());
    } catch (error) {
      throw new AppError(`Error fetching users: ${error}`, 500);
    }
  }
}
