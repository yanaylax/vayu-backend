import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "./entity/User";
import { UserGroup } from "./entity/UserGroup";

export const AppDataSource = new DataSource({
  type: "sqlite",
  database: "database.sqlite",
  synchronize: true,
  logging: false,
  entities: [User, UserGroup],
  migrations: [],
  subscribers: [],
});
