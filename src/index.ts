import express, { Request, Response, NextFunction } from "express";
import bodyParser from "body-parser";
import { AppDataSource } from "./data-source";
import { Routes } from "./routes";
import { User } from "./entity/User";
import { UserGroup } from "./entity/UserGroup";

AppDataSource.initialize()
  .then(async () => {
    const app = express();
    app.use(bodyParser.json());

    Routes.forEach((route) => {
      app[route.method](
        route.route,
        (req: Request, res: Response, next: NextFunction) => {
          const controller = new (route.controller as any)();
          if (typeof controller[route.action] !== "function") {
            console.error(
              `Controller action ${route.action} is not a function on ${route.controller.name}`
            );
            res.status(500).send("Controller method not implemented");
          } else {
            try {
              const result = controller[route.action](req, res, next);
              if (result instanceof Promise) {
                result
                  .then((result) => {
                    if (result !== null && result !== undefined)
                      res.send(result);
                  })
                  .catch((err) => {
                    if (!res.headersSent) {
                      next(err);
                    }
                  });
              } else if (result !== null && result !== undefined) {
                if (!res.headersSent) {
                  res.send(result);
                }
              }
            } catch (err) {
              if (!res.headersSent) {
                next(err);
              }
            }
          }
        }
      );
    });

    app.use((err: any, req: Request, res: Response, next: NextFunction) => {
      console.error(err.stack);
      if (!res.headersSent) {
        res.status(500).send("Internal Server Error");
      }
    });

    app.listen(3000, () => {
      console.log(
        "Express server has started on port 3000. Open http://localhost:3000/users to see results"
      );
    });

    await initializeData();
  })
  .catch((error) => {
    console.log("Failed to initialize data source:", error);
  });

async function initializeData() {
  const usersExist = await AppDataSource.getRepository(User).count();
  const groupsExist = await AppDataSource.getRepository(UserGroup).count();

  if (!usersExist) {
    let users = [];
    for (let i = 1; i <= 20; i++) {
      users.push(
        AppDataSource.getRepository(User).create({
          firstName: `User${i}`,
          lastName: `LastName${i}`,
          email: `user${i}@example.com`,
          status: "active",
          group: null,
        })
      );
    }
    await AppDataSource.getRepository(User).save(users);
    console.log("20 new users added.");
  }

  if (!groupsExist) {
    const groups = [
      { name: "admins", status: "empty" },
      { name: "users", status: "empty" },
    ].map((group) => AppDataSource.getRepository(UserGroup).create(group));

    await AppDataSource.getRepository(UserGroup).save(groups);
    console.log("Admin and User groups added.");
  }
}
