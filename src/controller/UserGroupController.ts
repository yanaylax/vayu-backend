import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../data-source";
import { UserGroup } from "../entity/UserGroup";

export class UserGroupController {
  private groupRepository = AppDataSource.getRepository(UserGroup);

  async addUserGroup(
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<Response> {
    const { name } = request.body;

    if (!name) {
      return response.status(400).json({ message: "Group name is required." });
    }

    try {
      const newGroup = new UserGroup();
      newGroup.name = name;
      newGroup.status = "empty";

      await this.groupRepository.save(newGroup);

      return response.status(201).json({
        message: "User group created successfully.",
        group: newGroup,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllUserGroups(
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<Response> {
    const limit = parseInt(request.query.limit as string) || 10;
    const offset = parseInt(request.query.offset as string) || 0;

    const [groups, total] = await this.groupRepository.findAndCount({
      take: limit,
      skip: offset,
    });

    return response.json({ total, groups });
  }
}
