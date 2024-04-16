import { AppDataSource } from "../data-source";
import { NextFunction, Request, Response } from "express";
import { User } from "../entity/User";
import { UserGroup } from "../entity/UserGroup";

export class UserController {
  private userRepository = AppDataSource.getRepository(User);
  private groupRepository = AppDataSource.getRepository(UserGroup);

  async getAllUsers(request: Request, response: Response, next: NextFunction) {
    const limit = parseInt(request.query.limit as string) || 10;
    const offset = parseInt(request.query.offset as string) || 0;

    const [users, total] = await this.userRepository.findAndCount({
      relations: ["group"],
      take: limit,
      skip: offset,
    });

    response.json({ total, users });
  }

  async filterByUserName(
    request: Request,
    response: Response,
    next: NextFunction
  ) {
    const name = request.query.name as string;
    if (!name) {
      return response
        .status(400)
        .json({ message: "Name parameter is required." });
    }

    const users = await this.userRepository.find({
      where: { firstName: name },
    });

    response.json(users);
  }

  async filterByEmail(
    request: Request,
    response: Response,
    next: NextFunction
  ) {
    const email = request.query.email as string;
    if (!email) {
      return response
        .status(400)
        .json({ message: "Email parameter is required." });
    }

    const users = await this.userRepository.find({ where: { email } });
    response.json(users);
  }

  // Note - in a real world application, this function would use sqs or similar to handle large updates

  async updateUsersStatuses(
    request: Request,
    response: Response,
    next: NextFunction
  ) {
    const updates = request.body.updates as {
      id: number;
      status: "pending" | "active" | "blocked";
    }[];

    if (!updates || updates.length === 0) {
      return response
        .status(400)
        .json({ message: "Updates parameter is required." });
    }

    if (updates.length > 500) {
      return response
        .status(400)
        .json({ message: "Cannot update more than 500 users at once." });
    }

    const chunkSize = 50;
    const chunks = [];

    for (let i = 0; i < updates.length; i += chunkSize) {
      chunks.push(updates.slice(i, i + chunkSize));
    }

    try {
      await this.userRepository.manager.transaction(
        async (transactionalEntityManager) => {
          for (const chunk of chunks) {
            const updatePromises = chunk.map((update) =>
              transactionalEntityManager.update(User, update.id, {
                status: update.status,
              })
            );
            await Promise.all(updatePromises);
          }
        }
      );
      response.json({ message: "Statuses updated", count: updates.length });
    } catch (error) {
      next(error);
    }
  }

  async removeUserFromGroup(
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<Response> {
    const userId = parseInt(request.params.id);
    if (isNaN(userId)) {
      return response.status(400).json({ message: "Invalid user ID" });
    }

    const userToRemove = await this.userRepository.findOne({
      where: { id: userId },
      relations: ["group"],
    });

    if (!userToRemove) {
      return response.status(404).json({ message: "This user does not exist" });
    }

    const group = userToRemove.group;
    if (!group) {
      return response.status(400).json({ message: "User is not in any group" });
    }

    userToRemove.group = null;
    await this.userRepository.save(userToRemove);

    const count = await this.userRepository.count({ where: { group } });

    if (count === 0) {
      group.status = "empty";
      await this.groupRepository.save(group);
    }

    return response.status(200).json({
      message:
        count === 0
          ? "User has been removed from the group, group status updated"
          : "User removed from group successfully",
    });
  }

  async addUserToGroup(
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<Response> {
    const userId = parseInt(request.params.userId);
    const groupId = parseInt(request.params.groupId);

    if (isNaN(userId) || isNaN(groupId)) {
      return response.status(400).json({ message: "Invalid user or group ID" });
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ["group"],
    });

    if (!user) {
      return response.status(404).json({ message: "User not found" });
    }

    const group = await this.groupRepository.findOne({
      where: { id: groupId },
    });

    if (!group) {
      return response.status(404).json({ message: "Group not found" });
    }

    if (user.group && user.group.id === group.id) {
      return response
        .status(400)
        .json({ message: "User is already in the specified group" });
    }

    user.group = group;

    const wasEmpty = group.status === "empty";
    if (wasEmpty) {
      group.status = "notEmpty";
    }

    await this.userRepository.save(user);
    if (wasEmpty) {
      await this.groupRepository.save(group);
    }

    return response.status(200).json({
      message: "User added to the group successfully",
      user: { id: user.id, group: user.group },
    });
  }
}
