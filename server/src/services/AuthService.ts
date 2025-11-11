import { User, IAuthResponse, IUserCreate, IUserLogin } from "../database/models";
import { JwtUtility } from "../utils/jwtUtility";
import { PasswordUtility } from "../utils/passwordUtility";
import { AppError } from "../utils/errors";

export class AuthService {
  async register(formData: IUserCreate): Promise<IAuthResponse> {
    const { username, password, name, phone, address } = formData;

    try {
      const existingUser = await User.findOne({
        where: { username },
      });

      if (existingUser) {
        throw new AppError("Username already exists", 409);
      }

      const passwordHash = await PasswordUtility.hashPassword(password);

      const newUser = await User.create({
        username,
        password: passwordHash,
        name,
        phone,
        address,
      });

      const accessToken = JwtUtility.generateToken(newUser.id, username);

      return {
        id: newUser.id,
        username: username,
        accessToken,
      };
    } catch (error) {
      throw new AppError(`Registration failed: ${error}`, 500);
    }
  }

  async login(formData: IUserLogin): Promise<IAuthResponse> {
    const { username, password } = formData;

    try {
      const user = await User.findOne({
        where: { username },
      });

      if (!user) {
        throw new AppError("Invalid username or password", 401);
      }

      const isPasswordValid = await PasswordUtility.comparePassword(
        password,
        user.password
      );

      if (!isPasswordValid) {
        throw new AppError("Invalid username or password", 401);
      }

      const accessToken = JwtUtility.generateToken(user.id, username);

      return {
        id: user.id,
        username: user.username,
        accessToken,
      };
    } catch (error) {
      throw new AppError(`Login failed: ${error}`, 500);
    }
  }
}
